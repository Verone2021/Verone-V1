-- ============================================================================
-- Migration: Suppression colonne payment_status obsolète
-- Date: 2026-02-11
-- Description: Migre payment_status → payment_status_v2, supprime ancienne colonne
--
-- CONTEXTE:
-- - payment_status (obsolète) : manuel, pas lié aux transactions
-- - payment_status_v2 (garder) : calculé auto via trigger transaction_document_links
-- - 45 commandes ont divergence (payment_status=paid mais v2=pending)
--
-- IMPACT:
-- - Uniformisation sur payment_status_v2 (source de vérité = transactions)
-- - Recréation trigger + 3 views pour utiliser payment_status_v2
-- - 16 fichiers frontend à modifier (migration code séparée)
-- ============================================================================

-- 1. Backup anciennes valeurs (au cas où)
CREATE TABLE IF NOT EXISTS _migration_payment_status_backup AS
SELECT id, payment_status, payment_status_v2, updated_at
FROM sales_orders;

-- 2. Uniformiser toutes les commandes sur payment_status_v2
-- (payment_status_v2 = source de vérité car liée aux transactions)
UPDATE sales_orders
SET payment_status = payment_status_v2,
    updated_at = NOW()
WHERE payment_status != payment_status_v2;

-- 3. Vérification : S'assurer qu'il n'y a plus de divergence
DO $$
DECLARE
  v_divergence INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_divergence
  FROM sales_orders
  WHERE payment_status != payment_status_v2;

  IF v_divergence > 0 THEN
    RAISE EXCEPTION '❌ Migration échouée: % commandes divergentes', v_divergence;
  END IF;

  RAISE NOTICE '✅ Uniformisation réussie: payment_status = payment_status_v2';
END $$;

-- ============================================================================
-- 4. RECRÉER OBJETS DÉPENDANTS POUR UTILISER payment_status_v2
-- ============================================================================

-- 4a. Recréer fonction trigger pour écouter payment_status_v2
CREATE OR REPLACE FUNCTION sync_commission_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le payment_status_v2 passe à 'paid', mettre à jour les commissions
  IF NEW.payment_status_v2 = 'paid' AND (OLD.payment_status_v2 IS NULL OR OLD.payment_status_v2 != 'paid') THEN
    UPDATE linkme_commissions
    SET
      status = 'paid',
      paid_at = COALESCE(paid_at, NOW())
    WHERE order_id = NEW.id
      AND status IN ('pending', 'validated');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4b. Recréer trigger pour écouter payment_status_v2
DROP TRIGGER IF EXISTS trg_sync_commission_on_payment ON sales_orders;
CREATE TRIGGER trg_sync_commission_on_payment
  AFTER UPDATE OF payment_status_v2 ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_commission_status_on_payment();

COMMENT ON FUNCTION sync_commission_status_on_payment() IS
'Synchronise automatiquement le statut des commissions LinkMe quand le payment_status_v2
de la commande passe à paid (calculé via trigger transaction_document_links).';

COMMENT ON TRIGGER trg_sync_commission_on_payment ON sales_orders IS
'Déclenche la synchronisation du statut des commissions LinkMe lors de la mise à jour
du payment_status_v2 de la commande.';

-- 4c. Drop views dépendantes en cascade
DROP VIEW IF EXISTS linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS linkme_orders_enriched CASCADE;
DROP VIEW IF EXISTS affiliate_pending_orders CASCADE;

-- 4d. Recréer linkme_orders_enriched avec payment_status_v2
CREATE OR REPLACE VIEW linkme_orders_enriched AS
SELECT
  -- Données commande
  so.id,
  so.order_number,
  so.status,
  so.payment_status_v2 AS payment_status,  -- ✅ MIGRATION: utilise payment_status_v2
  so.total_ht,
  so.total_ttc,
  so.customer_type,
  so.customer_id,
  so.created_at,
  so.updated_at,
  so.channel_id,

  -- Données client (organisation)
  CASE
    WHEN so.customer_type = 'organization' THEN
      COALESCE(org.trade_name, org.legal_name, 'Organisation')
    WHEN so.customer_type = 'individual' THEN
      CONCAT_WS(' ', ic.first_name, ic.last_name)
    ELSE 'Client inconnu'
  END AS customer_name,

  CASE
    WHEN so.customer_type = 'organization' THEN org.address_line1
    ELSE ic.address_line1
  END AS customer_address,

  CASE
    WHEN so.customer_type = 'organization' THEN org.postal_code
    ELSE ic.postal_code
  END AS customer_postal_code,

  CASE
    WHEN so.customer_type = 'organization' THEN org.city
    ELSE ic.city
  END AS customer_city,

  CASE
    WHEN so.customer_type = 'organization' THEN org.email
    ELSE ic.email
  END AS customer_email,

  CASE
    WHEN so.customer_type = 'organization' THEN org.phone
    ELSE ic.phone
  END AS customer_phone,

  -- Données affilié (via first item avec selection)
  la.display_name AS affiliate_name,
  CASE
    WHEN la.enseigne_id IS NOT NULL THEN 'enseigne'
    WHEN la.organisation_id IS NOT NULL THEN 'organisation'
    ELSE NULL
  END AS affiliate_type,

  -- Nom sélection
  ls.name AS selection_name,
  ls.id AS selection_id

FROM sales_orders so

-- JOIN client organisation
LEFT JOIN organisations org ON so.customer_type = 'organization' AND so.customer_id = org.id

-- JOIN client individuel
LEFT JOIN individual_customers ic ON so.customer_type = 'individual' AND so.customer_id = ic.id

-- JOIN pour récupérer la sélection via le premier item avec linkme_selection_item_id
LEFT JOIN LATERAL (
  SELECT soi.linkme_selection_item_id
  FROM sales_order_items soi
  WHERE soi.sales_order_id = so.id
    AND soi.linkme_selection_item_id IS NOT NULL
  LIMIT 1
) first_item ON true

-- JOIN linkme_selection_items
LEFT JOIN linkme_selection_items lsi ON lsi.id = first_item.linkme_selection_item_id

-- JOIN linkme_selections
LEFT JOIN linkme_selections ls ON ls.id = lsi.selection_id

-- JOIN linkme_affiliates
LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id

WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- 4e. Recréer linkme_orders_with_margins (dépend de linkme_orders_enriched)
CREATE OR REPLACE VIEW linkme_orders_with_margins AS
SELECT
  loe.*,
  -- PRIORITÉ:
  -- 1. linkme_commissions.affiliate_commission (données importées Bubble)
  -- 2. Calcul via items (nouvelles commandes créées dans Supabase)
  -- 3. 0 par défaut
  COALESCE(
    lc.affiliate_commission,                    -- Source Bubble (stockée)
    margins.total_affiliate_margin,             -- Calcul via items (fallback)
    0
  ) AS total_affiliate_margin,
  COALESCE(margins.items_count, 0) AS items_count
FROM linkme_orders_enriched loe

-- JOIN linkme_commissions pour récupérer la marge stockée (source Bubble)
LEFT JOIN linkme_commissions lc ON lc.order_id = loe.id

-- JOIN calcul via items (fallback pour nouvelles commandes)
LEFT JOIN (
  SELECT
    sales_order_id,
    SUM(affiliate_margin) AS total_affiliate_margin,
    COUNT(*) AS items_count
  FROM linkme_order_items_enriched
  GROUP BY sales_order_id
) margins ON margins.sales_order_id = loe.id;

-- 4f. Recréer affiliate_pending_orders (utilise so.* donc pas de modification nécessaire)
CREATE OR REPLACE VIEW affiliate_pending_orders AS
SELECT
  so.*,
  la.display_name as affiliate_name,
  la.email as affiliate_email,
  la.affiliate_type,
  ls.name as selection_name
FROM sales_orders so
JOIN linkme_affiliates la ON so.created_by_affiliate_id = la.id
LEFT JOIN linkme_selections ls ON so.linkme_selection_id = ls.id
WHERE so.pending_admin_validation = true
  AND so.status = 'draft';

-- 4g. Regrant accès aux vues
GRANT SELECT ON linkme_orders_enriched TO authenticated;
GRANT SELECT ON linkme_orders_with_margins TO authenticated;
GRANT SELECT ON affiliate_pending_orders TO authenticated;

-- 4h. Comments documentation views
COMMENT ON VIEW linkme_orders_enriched IS 'Vue optimisée des commandes LinkMe avec données client et affilié. Utilise payment_status_v2 (calculé auto via transactions).';
COMMENT ON VIEW linkme_orders_with_margins IS 'Vue agrégée des commandes LinkMe avec marge affilié (priorité: données Bubble stockées, fallback: calcul items)';
COMMENT ON VIEW affiliate_pending_orders IS 'Vue des commandes en attente de validation admin (affiliés LinkMe).';

-- ============================================================================
-- 5. SUPPRIMER COLONNE OBSOLÈTE (maintenant sans dépendances)
-- ============================================================================

ALTER TABLE sales_orders DROP COLUMN payment_status;

-- 6. Créer commentaire documentation
COMMENT ON COLUMN sales_orders.payment_status_v2 IS
  'Statut de paiement calculé automatiquement via rapprochement bancaire.
   - paid: Commande liée à une transaction (transaction_document_links)
   - pending: Aucune transaction liée

   Trigger: trg_update_sales_order_payment_status_v2
   Source: Migration 20260104_payment_status_v2_trigger.sql

   NOTE: Ancienne colonne payment_status supprimée le 2026-02-11 (migration 20260211_001)
   Vue linkme_orders_enriched expose payment_status_v2 sous alias payment_status pour compatibilité frontend.';

-- ============================================================================
-- 7. VÉRIFIER IMPACT (afficher distribution des statuts)
-- ============================================================================

DO $$
DECLARE
  v_paid INTEGER;
  v_pending INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_paid FROM sales_orders WHERE payment_status_v2 = 'paid';
  SELECT COUNT(*) INTO v_pending FROM sales_orders WHERE payment_status_v2 = 'pending';
  SELECT COUNT(*) INTO v_total FROM sales_orders;

  RAISE NOTICE '📊 Distribution statuts paiement:';
  RAISE NOTICE '   - Payé (paid): % commandes', v_paid;
  RAISE NOTICE '   - En attente (pending): % commandes', v_pending;
  RAISE NOTICE '   - Total: % commandes', v_total;
  RAISE NOTICE '✅ Migration terminée avec succès';
END $$;

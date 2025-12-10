-- ============================================
-- Migration: Trigger pour créer commissions LinkMe
-- Date: 2025-12-09
-- Description: Créer automatiquement une commission quand une commande LinkMe est expédiée
-- ============================================

-- ============================================
-- PHASE 1: Fonction du Trigger
-- ============================================

CREATE OR REPLACE FUNCTION create_linkme_commission_on_order_update()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate_id UUID;
  v_selection_id UUID;
  v_total_commission NUMERIC(10,2);
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Seulement pour commandes LinkMe (channel_id = LinkMe UUID)
  IF NEW.channel_id != v_linkme_channel_id THEN
    RETURN NEW;
  END IF;

  -- Seulement si statut change vers validated, shipped, partially_shipped, delivered
  IF NEW.status NOT IN ('validated', 'shipped', 'partially_shipped', 'delivered') THEN
    RETURN NEW;
  END IF;

  -- Éviter doublons
  IF EXISTS (SELECT 1 FROM linkme_commissions WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'affilié via le chemin: sales_order_items → linkme_selection_items → linkme_selections → linkme_affiliates
  SELECT DISTINCT
    ls.affiliate_id,
    ls.id
  INTO v_affiliate_id, v_selection_id
  FROM sales_order_items soi
  JOIN linkme_selection_items lsei ON lsei.id = soi.linkme_selection_item_id
  JOIN linkme_selections ls ON ls.id = lsei.selection_id
  WHERE soi.sales_order_id = NEW.id
  LIMIT 1;

  IF v_affiliate_id IS NULL THEN
    RETURN NEW;  -- Pas d'affilié trouvé
  END IF;

  -- REPRENDRE commission totale directement depuis sales_order_items (PAS de calcul!)
  SELECT COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_total_commission
  FROM sales_order_items soi
  WHERE soi.sales_order_id = NEW.id;

  -- Insérer la commission
  INSERT INTO linkme_commissions (
    affiliate_id,
    selection_id,
    order_id,
    order_number,
    order_amount_ht,
    affiliate_commission,
    affiliate_commission_ttc,
    linkme_commission,
    margin_rate_applied,
    linkme_rate_applied,
    tax_rate,
    status,
    created_at
  ) VALUES (
    v_affiliate_id,
    v_selection_id,
    NEW.id,
    NEW.order_number,
    NEW.total_ht,
    v_total_commission,
    ROUND(v_total_commission * 1.2, 2),
    ROUND(NEW.total_ht * 0.03, 2),  -- 3% pour LinkMe
    0.12,  -- Taux par défaut
    0.03,  -- Taux LinkMe
    0.2,
    CASE
      WHEN NEW.payment_status = 'paid' THEN 'validated'
      ELSE 'pending'
    END,
    NOW()
  );

  RAISE NOTICE '✅ Commission LinkMe créée pour commande %', NEW.order_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 2: Créer le Trigger
-- ============================================

DROP TRIGGER IF EXISTS trg_create_linkme_commission ON sales_orders;

CREATE TRIGGER trg_create_linkme_commission
  AFTER INSERT OR UPDATE OF status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_linkme_commission_on_order_update();

COMMENT ON FUNCTION create_linkme_commission_on_order_update() IS
  'Crée automatiquement une entrée dans linkme_commissions quand une commande LinkMe est validée/expédiée';

-- ============================================
-- PHASE 3: Backfill des Commandes Existantes
-- ============================================

INSERT INTO linkme_commissions (
  affiliate_id,
  selection_id,
  order_id,
  order_number,
  order_amount_ht,
  affiliate_commission,
  affiliate_commission_ttc,
  linkme_commission,
  margin_rate_applied,
  linkme_rate_applied,
  tax_rate,
  status,
  created_at
)
SELECT
  la.id AS affiliate_id,
  (SELECT lsei.selection_id FROM sales_order_items soi2
   JOIN linkme_selection_items lsei ON lsei.id = soi2.linkme_selection_item_id
   WHERE soi2.sales_order_id = so.id LIMIT 1) AS selection_id,
  so.id AS order_id,
  so.order_number,
  so.total_ht AS order_amount_ht,
  -- REPRENDRE directement retrocession_amount (PAS de calcul!)
  COALESCE((SELECT SUM(retrocession_amount) FROM sales_order_items WHERE sales_order_id = so.id), 0) AS affiliate_commission,
  ROUND(COALESCE((SELECT SUM(retrocession_amount) FROM sales_order_items WHERE sales_order_id = so.id), 0) * 1.2, 2) AS affiliate_commission_ttc,
  ROUND(so.total_ht * 0.03, 2) AS linkme_commission,
  0.12 AS margin_rate_applied,
  0.03 AS linkme_rate_applied,
  0.2 AS tax_rate,
  CASE WHEN so.payment_status = 'paid' THEN 'validated' ELSE 'pending' END AS status,
  so.created_at
FROM sales_orders so
JOIN linkme_affiliates la ON la.enseigne_id = so.enseigne_id OR la.assigned_client_id = so.assigned_client_id
WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  AND so.status IN ('validated', 'shipped', 'partially_shipped', 'delivered')
  AND NOT EXISTS (SELECT 1 FROM linkme_commissions lc WHERE lc.order_id = so.id)
ON CONFLICT DO NOTHING;

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier que le trigger existe
  SELECT COUNT(*) INTO v_count
  FROM pg_trigger
  WHERE tgname = 'trg_create_linkme_commission';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Trigger trg_create_linkme_commission non créé';
  END IF;

  -- Compter commissions créées
  SELECT COUNT(*) INTO v_count FROM linkme_commissions;

  RAISE NOTICE '✅ Migration réussie - % commissions dans la table', v_count;
END $$;

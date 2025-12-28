-- ============================================
-- Migration: Fix idempotence du trigger commission LinkMe
-- Date: 2025-12-18
-- Description:
--   1. Ajouter contrainte UNIQUE sur order_id (1 commission par commande)
--   2. Modifier le trigger pour utiliser UPSERT (pas INSERT aveugle)
--   3. Figer la commission uniquement à 'delivered' (pas partially_shipped)
-- ============================================

-- ============================================
-- PHASE 1: Ajouter contrainte UNIQUE
-- ============================================

-- Supprimer d'abord les doublons éventuels (garder le plus récent)
DELETE FROM linkme_commissions lc1
WHERE EXISTS (
  SELECT 1 FROM linkme_commissions lc2
  WHERE lc2.order_id = lc1.order_id
    AND lc2.created_at > lc1.created_at
);

-- Ajouter la contrainte UNIQUE
ALTER TABLE linkme_commissions
DROP CONSTRAINT IF EXISTS uq_linkme_commissions_order_id;

ALTER TABLE linkme_commissions
ADD CONSTRAINT uq_linkme_commissions_order_id UNIQUE (order_id);

-- Ajouter colonne updated_at si elle n'existe pas
ALTER TABLE linkme_commissions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- PHASE 2: Nouvelle fonction trigger avec UPSERT
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

  -- ⚠️ CHANGEMENT: Figer la commission UNIQUEMENT à 'delivered'
  -- Les commandes validated/shipped/partially_shipped n'ont pas encore leur commission figée
  IF NEW.status != 'delivered' THEN
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

  -- ⚠️ CHANGEMENT: UPSERT au lieu d'INSERT simple (idempotent)
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
    created_at,
    updated_at
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
    NOW(),
    NOW()
  )
  ON CONFLICT (order_id) DO UPDATE SET
    affiliate_commission = EXCLUDED.affiliate_commission,
    affiliate_commission_ttc = EXCLUDED.affiliate_commission_ttc,
    order_amount_ht = EXCLUDED.order_amount_ht,
    status = EXCLUDED.status,
    updated_at = NOW();

  RAISE NOTICE '✅ Commission LinkMe créée/mise à jour pour commande % (delivered)', NEW.order_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 3: Recréer le Trigger
-- ============================================

DROP TRIGGER IF EXISTS trg_create_linkme_commission ON sales_orders;

CREATE TRIGGER trg_create_linkme_commission
  AFTER INSERT OR UPDATE OF status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_linkme_commission_on_order_update();

-- ============================================
-- PHASE 4: Commentaires et validation
-- ============================================

COMMENT ON FUNCTION create_linkme_commission_on_order_update() IS
'Crée ou met à jour une entrée dans linkme_commissions quand une commande LinkMe passe à "delivered".
IMPORTANT:
- La commission est figée UNIQUEMENT à "delivered" (pas validated/shipped/partially_shipped)
- Utilise UPSERT pour garantir l idempotence (pas de doublon)
- La contrainte UNIQUE(order_id) garantit 1 commission par commande';

-- Validation
DO $$
DECLARE
  v_unique_exists BOOLEAN;
BEGIN
  -- Vérifier que la contrainte UNIQUE existe
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_linkme_commissions_order_id'
  ) INTO v_unique_exists;

  IF NOT v_unique_exists THEN
    RAISE EXCEPTION 'Contrainte UNIQUE uq_linkme_commissions_order_id non créée';
  END IF;

  RAISE NOTICE '✅ Migration idempotence commission réussie';
END $$;

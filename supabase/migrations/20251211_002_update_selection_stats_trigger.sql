-- ============================================
-- Migration: Mise à jour stats sélection sur commande LinkMe
-- Date: 2025-12-11
-- Description: Modifier trigger pour maj orders_count et total_revenue
-- ============================================

-- ============================================
-- PHASE 1: Modifier la Fonction du Trigger
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

  -- ============================================
  -- NOUVEAU: Mettre à jour les stats de la sélection
  -- ============================================
  IF v_selection_id IS NOT NULL THEN
    UPDATE linkme_selections
    SET
      orders_count = COALESCE(orders_count, 0) + 1,
      total_revenue = COALESCE(total_revenue, 0) + COALESCE(NEW.total_ht, 0),
      updated_at = NOW()
    WHERE id = v_selection_id;

    RAISE NOTICE '📊 Stats sélection % mises à jour: +1 commande, +% EUR', v_selection_id, NEW.total_ht;
  END IF;

  RAISE NOTICE '✅ Commission LinkMe créée pour commande %', NEW.order_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_linkme_commission_on_order_update() IS
  'Crée automatiquement une entrée dans linkme_commissions et met à jour les stats de la sélection quand une commande LinkMe est validée/expédiée';

-- ============================================
-- PHASE 2: Backfill des stats existantes
-- ============================================

-- Recalculer orders_count et total_revenue pour toutes les sélections avec des commandes
UPDATE linkme_selections ls
SET
  orders_count = stats.order_count,
  total_revenue = stats.revenue,
  updated_at = NOW()
FROM (
  SELECT
    lc.selection_id,
    COUNT(DISTINCT lc.order_id) AS order_count,
    COALESCE(SUM(lc.order_amount_ht), 0) AS revenue
  FROM linkme_commissions lc
  WHERE lc.selection_id IS NOT NULL
  GROUP BY lc.selection_id
) stats
WHERE ls.id = stats.selection_id;

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated
  FROM linkme_selections
  WHERE orders_count > 0 OR total_revenue > 0;

  RAISE NOTICE '✅ Stats mises à jour pour % sélections', v_updated;
END $$;

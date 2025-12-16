-- Migration: Correction source marge affilié page Commandes LinkMe
-- Problème: La vue utilisait un calcul via items (échouait pour commandes importées Bubble)
-- Solution: Utiliser linkme_commissions.affiliate_commission (données Bubble stockées)

-- Recréer la vue linkme_orders_with_margins avec JOIN sur linkme_commissions
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

-- Ajouter index pour optimiser le JOIN
CREATE INDEX IF NOT EXISTS idx_linkme_commissions_order_id ON linkme_commissions(order_id);

COMMENT ON VIEW linkme_orders_with_margins IS 'Vue agrégée des commandes LinkMe avec marge affilié (priorité: données Bubble stockées, fallback: calcul items)';

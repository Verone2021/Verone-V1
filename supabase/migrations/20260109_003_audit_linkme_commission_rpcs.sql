-- Migration: Fonctions RPC pour audit LinkMe Commission Model
-- Date: 2026-01-09
-- Description: Fonctions d'audit pour détecter anomalies dans le modèle de commission

-- =====================================================
-- RPC 1: Audit produits affiliés avec margin_rate != 0
-- =====================================================
CREATE OR REPLACE FUNCTION audit_linkme_selection_items_margin_rate()
RETURNS TABLE (
  id uuid,
  margin_rate numeric,
  product_id uuid,
  product_name text,
  product_sku text,
  selection_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lsi.id,
    lsi.margin_rate,
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    lsi.linkme_selection_id AS selection_id
  FROM linkme_selection_items lsi
  JOIN products p ON p.id = lsi.product_id
  WHERE p.created_by_affiliate IS NOT NULL
    AND lsi.margin_rate != 0
    AND lsi.deleted_at IS NULL
  ORDER BY lsi.margin_rate DESC;
END;
$$;

-- =====================================================
-- RPC 2: Audit commissions à 0€ pour produits affiliés
-- =====================================================
CREATE OR REPLACE FUNCTION audit_zero_commissions_for_affiliate_products(
  limit_rows integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  order_id uuid,
  affiliate_commission numeric,
  order_total_ht numeric,
  product_name text,
  product_sku text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    lc.id,
    lc.order_id,
    lc.affiliate_commission,
    so.total_ht AS order_total_ht,
    p.name AS product_name,
    p.sku AS product_sku,
    lc.created_at
  FROM linkme_commissions lc
  JOIN sales_orders so ON so.id = lc.order_id
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  JOIN products p ON p.id = soi.product_id
  WHERE p.created_by_affiliate IS NOT NULL
    AND lc.affiliate_commission = 0
  ORDER BY lc.created_at DESC
  LIMIT limit_rows;
END;
$$;

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION audit_linkme_selection_items_margin_rate() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION audit_zero_commissions_for_affiliate_products(integer) TO authenticated, service_role;

COMMENT ON FUNCTION audit_linkme_selection_items_margin_rate() IS
'Audit: Détecte les produits affiliés avec margin_rate != 0 dans linkme_selection_items (violation règle métier)';

COMMENT ON FUNCTION audit_zero_commissions_for_affiliate_products(integer) IS
'Audit: Détecte les commissions à 0€ pour produits créés par affiliés';

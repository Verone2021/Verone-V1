-- =====================================================
-- MIGRATION: Fix RPC column name error
-- Date: 2025-12-20
-- Description: Fix o.name -> COALESCE(o.trade_name, o.legal_name) in get_all_storage_overview
-- =====================================================

-- The function get_all_storage_overview uses o.name which doesn't exist
-- in the organisations table. Fix by using COALESCE(o.trade_name, o.legal_name)

CREATE OR REPLACE FUNCTION get_all_storage_overview()
RETURNS TABLE (
  owner_id UUID,
  owner_type TEXT,
  owner_name TEXT,
  total_units BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Enseignes
  SELECT
    e.id AS owner_id,
    'enseigne'::TEXT AS owner_type,
    e.name::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(a.stock_quantity * calc_product_volume_m3(p.dimensions)), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(CASE WHEN a.billable_in_storage THEN a.stock_quantity * calc_product_volume_m3(p.dimensions) ELSE 0 END), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count
  FROM enseignes e
  INNER JOIN storage_allocations a ON a.owner_enseigne_id = e.id
  LEFT JOIN products p ON p.id = a.product_id
  GROUP BY e.id, e.name

  UNION ALL

  -- Organisations (FIX: use trade_name/legal_name instead of name)
  SELECT
    o.id AS owner_id,
    'organisation'::TEXT AS owner_type,
    COALESCE(o.trade_name, o.legal_name, 'Inconnu')::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(a.stock_quantity * calc_product_volume_m3(p.dimensions)), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(CASE WHEN a.billable_in_storage THEN a.stock_quantity * calc_product_volume_m3(p.dimensions) ELSE 0 END), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count
  FROM organisations o
  INNER JOIN storage_allocations a ON a.owner_organisation_id = o.id
  LEFT JOIN products p ON p.id = a.product_id
  GROUP BY o.id, o.trade_name, o.legal_name

  ORDER BY billable_volume_m3 DESC;
END;
$$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

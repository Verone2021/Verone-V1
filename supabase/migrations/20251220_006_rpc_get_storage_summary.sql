-- Migration: Create storage summary RPC functions
-- Description: KPIs for affiliate storage and volumetry

-- Drop if exists for idempotency
DROP FUNCTION IF EXISTS get_affiliate_storage_summary(UUID, UUID);
DROP FUNCTION IF EXISTS get_all_storage_overview();

-- Get storage summary for a specific owner (enseigne or organisation)
CREATE OR REPLACE FUNCTION get_affiliate_storage_summary(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_units INTEGER,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT,
  billable_products_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(asa.stock_quantity), 0)::INTEGER AS total_units,
    COALESCE(SUM(
      asa.stock_quantity * calc_product_volume_m3(p.dimensions::JSONB)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN asa.billable_in_storage THEN
        asa.stock_quantity * calc_product_volume_m3(p.dimensions::JSONB)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT asa.product_id) AS products_count,
    COUNT(DISTINCT CASE WHEN asa.billable_in_storage THEN asa.product_id END) AS billable_products_count
  FROM affiliate_storage_allocations asa
  JOIN products p ON p.id = asa.product_id
  WHERE
    (p_owner_enseigne_id IS NULL OR asa.owner_enseigne_id = p_owner_enseigne_id)
    AND (p_owner_organisation_id IS NULL OR asa.owner_organisation_id = p_owner_organisation_id)
    AND asa.stock_quantity > 0;
$$;

GRANT EXECUTE ON FUNCTION get_affiliate_storage_summary(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION get_affiliate_storage_summary IS
  'Returns storage KPIs (units, volume m3, billable volume) for a specific enseigne or organisation';


-- Get global storage overview (admin only)
CREATE OR REPLACE FUNCTION get_all_storage_overview()
RETURNS TABLE (
  owner_id UUID,
  owner_type TEXT,
  owner_name TEXT,
  total_units INTEGER,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Storage by enseigne
  SELECT
    e.id AS owner_id,
    'enseigne'::TEXT AS owner_type,
    e.name AS owner_name,
    COALESCE(SUM(asa.stock_quantity), 0)::INTEGER AS total_units,
    COALESCE(SUM(
      asa.stock_quantity * calc_product_volume_m3(p.dimensions::JSONB)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN asa.billable_in_storage THEN
        asa.stock_quantity * calc_product_volume_m3(p.dimensions::JSONB)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT asa.product_id) AS products_count
  FROM enseignes e
  LEFT JOIN affiliate_storage_allocations asa ON asa.owner_enseigne_id = e.id
  LEFT JOIN products p ON p.id = asa.product_id
  GROUP BY e.id, e.name

  UNION ALL

  -- Storage by organisation
  SELECT
    o.id AS owner_id,
    'organisation'::TEXT AS owner_type,
    o.legal_name AS owner_name,
    COALESCE(SUM(asa.stock_quantity), 0)::INTEGER AS total_units,
    COALESCE(SUM(
      asa.stock_quantity * calc_product_volume_m3(p.dimensions::JSONB)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN asa.billable_in_storage THEN
        asa.stock_quantity * calc_product_volume_m3(p.dimensions::JSONB)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT asa.product_id) AS products_count
  FROM organisations o
  LEFT JOIN affiliate_storage_allocations asa ON asa.owner_organisation_id = o.id
  LEFT JOIN products p ON p.id = asa.product_id
  WHERE o.type = 'customer'  -- Only customer orgs can have storage
  GROUP BY o.id, o.legal_name

  ORDER BY total_volume_m3 DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION get_all_storage_overview() TO authenticated;

COMMENT ON FUNCTION get_all_storage_overview IS
  'Returns storage overview for all affiliates (enseignes and organisations). Admin use.';


-- Get storage details for a specific owner with product breakdown
CREATE OR REPLACE FUNCTION get_storage_details(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  allocation_id UUID,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  stock_quantity INTEGER,
  unit_volume_m3 NUMERIC,
  total_volume_m3 NUMERIC,
  billable_in_storage BOOLEAN,
  allocated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    asa.id AS allocation_id,
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    asa.stock_quantity,
    calc_product_volume_m3(p.dimensions::JSONB) AS unit_volume_m3,
    asa.stock_quantity * calc_product_volume_m3(p.dimensions::JSONB) AS total_volume_m3,
    asa.billable_in_storage,
    asa.allocated_at
  FROM affiliate_storage_allocations asa
  JOIN products p ON p.id = asa.product_id
  WHERE
    (p_owner_enseigne_id IS NULL OR asa.owner_enseigne_id = p_owner_enseigne_id)
    AND (p_owner_organisation_id IS NULL OR asa.owner_organisation_id = p_owner_organisation_id)
    AND asa.stock_quantity > 0
  ORDER BY asa.allocated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_storage_details(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION get_storage_details IS
  'Returns detailed storage allocations with product info for a specific owner';

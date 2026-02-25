-- Migration: Add storage_start_date column + update RPCs with image URL
-- Context: Stockage improvements — configurable start date + product photos
-- Date: 2026-02-25

-- =====================================================
-- PART 1: Add storage_start_date column
-- =====================================================

ALTER TABLE storage_allocations
  ADD COLUMN IF NOT EXISTS storage_start_date DATE DEFAULT NULL;

-- Backfill existing allocations with allocated_at::date
UPDATE storage_allocations
  SET storage_start_date = allocated_at::date
  WHERE storage_start_date IS NULL;

COMMENT ON COLUMN storage_allocations.storage_start_date IS
  'Configurable storage start date. Defaults to allocated_at::date. Editable from back-office.';

-- =====================================================
-- PART 2: Update get_storage_details — add storage_start_date + product_image_url
-- Must DROP first because return type changed (new columns added)
-- =====================================================

DROP FUNCTION IF EXISTS get_storage_details(UUID, UUID);

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
  allocated_at TIMESTAMPTZ,
  storage_start_date DATE,
  product_image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS allocation_id,
    a.product_id,
    p.name::TEXT AS product_name,
    p.sku::TEXT AS product_sku,
    a.stock_quantity,
    calc_product_volume_m3(p.dimensions) AS unit_volume_m3,
    (a.stock_quantity * calc_product_volume_m3(p.dimensions)) AS total_volume_m3,
    a.billable_in_storage,
    a.allocated_at,
    COALESCE(a.storage_start_date, a.allocated_at::date) AS storage_start_date,
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.display_order ASC NULLS LAST
      LIMIT 1
    ) AS product_image_url
  FROM storage_allocations a
  LEFT JOIN products p ON p.id = a.product_id
  WHERE (
    (p_owner_enseigne_id IS NOT NULL AND a.owner_enseigne_id = p_owner_enseigne_id) OR
    (p_owner_organisation_id IS NOT NULL AND a.owner_organisation_id = p_owner_organisation_id)
  )
  ORDER BY a.allocated_at DESC;
END;
$$;

-- =====================================================
-- PART 3: Update get_storage_monthly_history — use storage_start_date
-- =====================================================

CREATE OR REPLACE FUNCTION get_storage_monthly_history(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL,
  p_months_back INTEGER DEFAULT 12
)
RETURNS TABLE(
  month_date DATE,
  month_label TEXT,
  year_val INTEGER,
  month_val INTEGER,
  total_units BIGINT,
  products_count BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', CURRENT_DATE - (p_months_back || ' months')::INTERVAL),
      date_trunc('month', CURRENT_DATE),
      '1 month'::INTERVAL
    )::DATE AS month_start
  ),
  allocations_at_month AS (
    SELECT
      m.month_start,
      a.product_id,
      a.stock_quantity,
      a.billable_in_storage,
      calc_product_volume_m3(p.dimensions) AS unit_vol
    FROM months m
    CROSS JOIN storage_allocations a
    LEFT JOIN products p ON p.id = a.product_id
    WHERE (
      (p_owner_enseigne_id IS NOT NULL AND a.owner_enseigne_id = p_owner_enseigne_id) OR
      (p_owner_organisation_id IS NOT NULL AND a.owner_organisation_id = p_owner_organisation_id)
    )
    -- Use storage_start_date for seniority filtering instead of allocated_at
    AND COALESCE(a.storage_start_date, a.allocated_at::date) <= (m.month_start + INTERVAL '1 month' - INTERVAL '1 day')::date
  )
  SELECT
    m.month_start AS month_date,
    TO_CHAR(m.month_start, 'Mon YYYY') AS month_label,
    EXTRACT(YEAR FROM m.month_start)::INTEGER AS year_val,
    EXTRACT(MONTH FROM m.month_start)::INTEGER AS month_val,
    COALESCE(SUM(aa.stock_quantity), 0)::BIGINT AS total_units,
    COUNT(DISTINCT aa.product_id)::BIGINT AS products_count,
    COALESCE(SUM(aa.stock_quantity * aa.unit_vol), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(CASE WHEN aa.billable_in_storage THEN aa.stock_quantity * aa.unit_vol ELSE 0 END), 0)::NUMERIC AS billable_volume_m3
  FROM months m
  LEFT JOIN allocations_at_month aa ON aa.month_start = m.month_start
  GROUP BY m.month_start
  ORDER BY m.month_start;
END;
$$;

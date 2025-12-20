-- =====================================================
-- MIGRATION: RPC for Storage Weighted Average Calculation
-- Date: 2025-12-20
-- Description: Calculate time-weighted average m3 for billing
-- =====================================================

-- =====================================================
-- PARTIE 1: Get storage weighted average for an owner
-- =====================================================

CREATE OR REPLACE FUNCTION get_storage_weighted_average(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_m3_days NUMERIC,
  days_in_period INTEGER,
  average_m3 NUMERIC,
  billable_m3_days NUMERIC,
  billable_average_m3 NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_days INTEGER;
BEGIN
  -- Default to current month if no dates provided
  IF p_start_date IS NULL THEN
    v_start := date_trunc('month', CURRENT_DATE);
  ELSE
    v_start := p_start_date::TIMESTAMPTZ;
  END IF;

  IF p_end_date IS NULL THEN
    v_end := LEAST(
      (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::TIMESTAMPTZ,
      NOW()
    );
  ELSE
    v_end := (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ;
  END IF;

  -- Calculate days in period
  v_days := GREATEST(1, EXTRACT(DAY FROM v_end - v_start)::INTEGER);

  RETURN QUERY
  WITH events_in_period AS (
    -- Get all events that affect the period
    SELECT
      e.happened_at,
      e.volume_m3_change,
      e.billable,
      e.qty_change
    FROM storage_billing_events e
    WHERE (
      (p_owner_enseigne_id IS NOT NULL AND e.owner_enseigne_id = p_owner_enseigne_id) OR
      (p_owner_organisation_id IS NOT NULL AND e.owner_organisation_id = p_owner_organisation_id)
    )
    AND e.happened_at <= v_end
    ORDER BY e.happened_at
  ),
  cumulative_stock AS (
    -- Calculate running total of stock at each event
    SELECT
      happened_at,
      SUM(volume_m3_change) OVER (ORDER BY happened_at) AS running_volume_m3,
      SUM(CASE WHEN billable THEN volume_m3_change ELSE 0 END) OVER (ORDER BY happened_at) AS running_billable_m3,
      LEAD(happened_at) OVER (ORDER BY happened_at) AS next_event_at
    FROM events_in_period
  ),
  intervals AS (
    -- Calculate the volume * days for each interval
    SELECT
      running_volume_m3,
      running_billable_m3,
      -- Interval start: max of (event time, period start)
      GREATEST(happened_at, v_start) AS interval_start,
      -- Interval end: min of (next event time, period end)
      LEAST(COALESCE(next_event_at, v_end), v_end) AS interval_end
    FROM cumulative_stock
    WHERE happened_at <= v_end
      AND COALESCE(next_event_at, v_end) > v_start
  ),
  weighted AS (
    SELECT
      SUM(
        GREATEST(0, running_volume_m3) *
        GREATEST(0, EXTRACT(EPOCH FROM (interval_end - interval_start)) / 86400.0)
      ) AS total_m3_days,
      SUM(
        GREATEST(0, running_billable_m3) *
        GREATEST(0, EXTRACT(EPOCH FROM (interval_end - interval_start)) / 86400.0)
      ) AS billable_m3_days
    FROM intervals
    WHERE interval_end > interval_start
  )
  SELECT
    COALESCE(w.total_m3_days, 0)::NUMERIC,
    v_days,
    ROUND(COALESCE(w.total_m3_days, 0) / v_days, 6)::NUMERIC,
    COALESCE(w.billable_m3_days, 0)::NUMERIC,
    ROUND(COALESCE(w.billable_m3_days, 0) / v_days, 6)::NUMERIC
  FROM weighted w;
END;
$$;

GRANT EXECUTE ON FUNCTION get_storage_weighted_average(UUID, UUID, DATE, DATE) TO authenticated;

-- =====================================================
-- PARTIE 2: Get storage events history for an owner
-- =====================================================

CREATE OR REPLACE FUNCTION get_storage_events_history(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  qty_change INTEGER,
  volume_m3_change NUMERIC,
  billable BOOLEAN,
  happened_at TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.product_id,
    p.name::TEXT AS product_name,
    p.sku::TEXT AS product_sku,
    e.qty_change,
    e.volume_m3_change,
    e.billable,
    e.happened_at,
    e.source,
    e.created_at
  FROM storage_billing_events e
  LEFT JOIN products p ON p.id = e.product_id
  WHERE (
    (p_owner_enseigne_id IS NOT NULL AND e.owner_enseigne_id = p_owner_enseigne_id) OR
    (p_owner_organisation_id IS NOT NULL AND e.owner_organisation_id = p_owner_organisation_id)
  )
  ORDER BY e.happened_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_storage_events_history(UUID, UUID, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- PARTIE 3: Get global storage overview for all owners
-- =====================================================

CREATE OR REPLACE FUNCTION get_global_storage_overview()
RETURNS TABLE (
  owner_type TEXT,
  owner_id UUID,
  owner_name TEXT,
  total_units BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT,
  billable_products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  -- Enseigne owners
  SELECT
    'enseigne'::TEXT AS owner_type,
    e.id AS owner_id,
    e.name::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(
      a.stock_quantity * calc_product_volume_m3(p.dimensions)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN a.billable_in_storage THEN
        a.stock_quantity * calc_product_volume_m3(p.dimensions)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count,
    COUNT(DISTINCT CASE WHEN a.billable_in_storage THEN a.product_id END)::BIGINT AS billable_products_count
  FROM enseignes e
  LEFT JOIN affiliate_storage_allocations a ON a.owner_enseigne_id = e.id
  LEFT JOIN products p ON p.id = a.product_id
  WHERE EXISTS (
    SELECT 1 FROM affiliate_storage_allocations asa
    WHERE asa.owner_enseigne_id = e.id
  )
  GROUP BY e.id, e.name

  UNION ALL

  -- Organisation owners
  SELECT
    'organisation'::TEXT AS owner_type,
    o.id AS owner_id,
    COALESCE(o.trade_name, o.legal_name, 'Inconnu')::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(
      a.stock_quantity * calc_product_volume_m3(p.dimensions)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN a.billable_in_storage THEN
        a.stock_quantity * calc_product_volume_m3(p.dimensions)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count,
    COUNT(DISTINCT CASE WHEN a.billable_in_storage THEN a.product_id END)::BIGINT AS billable_products_count
  FROM organisations o
  LEFT JOIN affiliate_storage_allocations a ON a.owner_organisation_id = o.id
  LEFT JOIN products p ON p.id = a.product_id
  WHERE EXISTS (
    SELECT 1 FROM affiliate_storage_allocations asa
    WHERE asa.owner_organisation_id = o.id
  )
  GROUP BY o.id, o.trade_name, o.legal_name

  ORDER BY billable_volume_m3 DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_global_storage_overview() TO authenticated;

-- =====================================================
-- PARTIE 4: Get storage KPIs totals
-- =====================================================

CREATE OR REPLACE FUNCTION get_storage_totals()
RETURNS TABLE (
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  total_units BIGINT,
  active_owners BIGINT,
  products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(
      a.stock_quantity * calc_product_volume_m3(p.dimensions)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN a.billable_in_storage THEN
        a.stock_quantity * calc_product_volume_m3(p.dimensions)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    (
      COUNT(DISTINCT a.owner_enseigne_id) +
      COUNT(DISTINCT a.owner_organisation_id)
    )::BIGINT AS active_owners,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count
  FROM affiliate_storage_allocations a
  LEFT JOIN products p ON p.id = a.product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_storage_totals() TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

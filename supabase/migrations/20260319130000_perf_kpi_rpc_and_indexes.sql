-- Performance optimization: server-side KPI aggregation + indexes
-- Replaces O(N) client-side fetch with server-side aggregation

-- ============================================
-- RPC: get_kpi_alltime_summary
-- Returns aggregated all-time KPI data in a single row
-- RLS-aware: uses the caller's auth context
-- ============================================
CREATE OR REPLACE FUNCTION get_kpi_alltime_summary(p_channel_id uuid)
RETURNS TABLE (
  orders_count bigint,
  total_ht numeric,
  total_ttc numeric,
  commissions_ht numeric,
  commissions_ttc numeric,
  distinct_months bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(o.orders_count, 0),
    COALESCE(o.total_ht, 0),
    COALESCE(o.total_ttc, 0),
    COALESCE(c.commissions_ht, 0),
    COALESCE(c.commissions_ttc, 0),
    COALESCE(o.distinct_months, 1)
  FROM (
    SELECT
      COUNT(*) AS orders_count,
      SUM(so.total_ht) AS total_ht,
      SUM(so.total_ttc) AS total_ttc,
      COUNT(DISTINCT (EXTRACT(YEAR FROM so.created_at) || '-' || EXTRACT(MONTH FROM so.created_at))) AS distinct_months
    FROM sales_orders so
    WHERE so.channel_id = p_channel_id
  ) o
  CROSS JOIN (
    SELECT
      SUM(lc.affiliate_commission) AS commissions_ht,
      SUM(lc.affiliate_commission_ttc) AS commissions_ttc
    FROM linkme_commissions lc
  ) c;
$$;

-- ============================================
-- Index: sales_orders(channel_id, status, created_at DESC)
-- Optimizes: status tab filtering on LinkMe orders page
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_channel_status_created
  ON sales_orders (channel_id, status, created_at DESC);

-- ============================================
-- Index: sales_orders(channel_id, created_at DESC)
-- Optimizes: date-filtered queries on LinkMe orders
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_channel_created
  ON sales_orders (channel_id, created_at DESC);

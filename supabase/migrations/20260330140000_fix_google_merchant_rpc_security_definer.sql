-- Fix Google Merchant RPC functions: add SECURITY DEFINER to bypass RLS
-- The functions were returning 404 because RLS blocked access

DROP FUNCTION IF EXISTS get_google_merchant_products();

CREATE OR REPLACE FUNCTION get_google_merchant_products()
RETURNS TABLE (
  id UUID, product_id UUID, sku TEXT, product_name TEXT,
  google_product_id TEXT, sync_status TEXT, google_status TEXT,
  google_status_detail JSONB, impressions INTEGER, clicks INTEGER,
  conversions INTEGER, revenue_ht DECIMAL, synced_at TIMESTAMPTZ,
  google_status_checked_at TIMESTAMPTZ, error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gms.id, gms.product_id, p.sku, p.name AS product_name,
    gms.google_product_id, gms.sync_status, gms.google_status,
    gms.google_status_detail, gms.impressions, gms.clicks,
    gms.conversions, gms.revenue_ht, gms.synced_at,
    gms.google_status_checked_at, gms.error_message
  FROM google_merchant_syncs gms
  INNER JOIN products p ON p.id = gms.product_id
  WHERE gms.sync_status != 'deleted'
  ORDER BY gms.synced_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_google_merchant_stats()
RETURNS TABLE (
  total_products BIGINT, approved_products BIGINT, pending_products BIGINT,
  rejected_products BIGINT, error_products BIGINT, total_impressions BIGINT,
  total_clicks BIGINT, total_conversions BIGINT, total_revenue_ht DECIMAL,
  conversion_rate DECIMAL, last_sync_at TIMESTAMPTZ, refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_products,
    COUNT(*) FILTER (WHERE gms.google_status = 'approved')::BIGINT AS approved_products,
    COUNT(*) FILTER (WHERE gms.google_status = 'pending')::BIGINT AS pending_products,
    COUNT(*) FILTER (WHERE gms.google_status = 'rejected')::BIGINT AS rejected_products,
    COUNT(*) FILTER (WHERE gms.sync_status = 'error')::BIGINT AS error_products,
    COALESCE(SUM(gms.impressions), 0)::BIGINT AS total_impressions,
    COALESCE(SUM(gms.clicks), 0)::BIGINT AS total_clicks,
    COALESCE(SUM(gms.conversions), 0)::BIGINT AS total_conversions,
    COALESCE(SUM(gms.revenue_ht), 0) AS total_revenue_ht,
    CASE WHEN COALESCE(SUM(gms.clicks), 0) > 0
      THEN (COALESCE(SUM(gms.conversions), 0)::DECIMAL / SUM(gms.clicks) * 100)
      ELSE 0
    END AS conversion_rate,
    MAX(gms.synced_at) AS last_sync_at,
    NOW() AS refreshed_at
  FROM google_merchant_syncs gms
  WHERE gms.sync_status != 'deleted';
END;
$$;

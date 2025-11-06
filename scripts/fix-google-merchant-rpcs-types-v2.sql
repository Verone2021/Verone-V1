-- Script: Fix Google Merchant RPCs types mismatch (avec DROP)
-- Date: 2025-11-06

-- =====================================================
-- STEP 1: DROP existing functions
-- =====================================================

DROP FUNCTION IF EXISTS get_google_merchant_stats();
DROP FUNCTION IF EXISTS get_google_merchant_products();

-- =====================================================
-- STEP 2: RE-CREATE avec types corrects
-- =====================================================

-- get_google_merchant_stats() - Types BIGINT pour aggregates
CREATE OR REPLACE FUNCTION get_google_merchant_stats()
RETURNS TABLE (
  total_products BIGINT,
  approved_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT,
  error_products BIGINT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue_ht NUMERIC,
  conversion_rate NUMERIC,
  last_sync_at TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.total_products,
    s.approved_products,
    s.pending_products,
    s.rejected_products,
    s.error_products,
    s.total_impressions,
    s.total_clicks,
    s.total_conversions,
    s.total_revenue_ht,
    s.conversion_rate,
    s.last_sync_at,
    s.refreshed_at
  FROM google_merchant_stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_google_merchant_products()
CREATE OR REPLACE FUNCTION get_google_merchant_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  sku TEXT,
  product_name TEXT,
  google_product_id TEXT,
  sync_status TEXT,
  google_status TEXT,
  google_status_detail JSONB,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_ht DECIMAL,
  synced_at TIMESTAMPTZ,
  google_status_checked_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gms.id,
    gms.product_id,
    p.sku,
    p.name AS product_name,
    gms.google_product_id,
    gms.sync_status,
    gms.google_status,
    gms.google_status_detail,
    gms.impressions,
    gms.clicks,
    gms.conversions,
    gms.revenue_ht,
    gms.synced_at,
    gms.google_status_checked_at,
    gms.error_message
  FROM google_merchant_syncs gms
  JOIN products p ON gms.product_id = p.id
  ORDER BY gms.synced_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérification
SELECT 'RPCs fixed successfully!' AS status;

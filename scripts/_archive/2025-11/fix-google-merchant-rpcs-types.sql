-- Script: Fix Google Merchant RPCs types mismatch
-- Date: 2025-11-06
-- Fix: Aligner types de retour avec types réels de google_merchant_stats materialized view

-- =====================================================
-- FIX: get_google_merchant_stats() - Corriger types
-- =====================================================

CREATE OR REPLACE FUNCTION get_google_merchant_stats()
RETURNS TABLE (
  total_products BIGINT,           -- BIGINT (COUNT retourne BIGINT)
  approved_products BIGINT,         -- BIGINT
  pending_products BIGINT,          -- BIGINT
  rejected_products BIGINT,         -- BIGINT
  error_products BIGINT,            -- BIGINT
  total_impressions BIGINT,         -- BIGINT (SUM(INTEGER) retourne BIGINT)
  total_clicks BIGINT,              -- BIGINT
  total_conversions BIGINT,         -- BIGINT
  total_revenue_ht NUMERIC,         -- NUMERIC (OK - SUM(DECIMAL))
  conversion_rate NUMERIC,          -- NUMERIC (OK - ROUND() retourne NUMERIC)
  last_sync_at TIMESTAMPTZ,         -- TIMESTAMPTZ (OK)
  refreshed_at TIMESTAMPTZ          -- TIMESTAMPTZ (OK)
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

-- =====================================================
-- Vérification
-- =====================================================

SELECT 'RPC get_google_merchant_stats() fixed!' AS status;

-- Test direct
SELECT * FROM get_google_merchant_stats() LIMIT 1;

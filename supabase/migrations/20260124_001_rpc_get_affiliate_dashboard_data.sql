-- ============================================================================
-- Migration: RPC get_affiliate_dashboard_data
-- Date: 2026-01-24
-- Description: Consolidated RPC function for dashboard data.
--              Replaces 6+ client-side queries with 1 server-side call.
--
-- Performance gains:
-- - Single round-trip instead of 6+ sequential requests
-- - Aggregation done in PostgreSQL (not JavaScript)
-- - Proper indexes for fast queries
-- - Returns JSONB for efficient transfer
--
-- Best Practices 2026:
-- - SECURITY INVOKER: Respects RLS policies of the calling user
-- - STABLE: Allows query optimization
-- - Input validation
-- ============================================================================

-- ============================================================================
-- STEP 1: Create optimized indexes
-- ============================================================================

-- Index for filtering commissions by affiliate
CREATE INDEX IF NOT EXISTS idx_linkme_commissions_affiliate_id
ON public.linkme_commissions(affiliate_id);

-- Composite index for status filtering (most common dashboard queries)
CREATE INDEX IF NOT EXISTS idx_linkme_commissions_affiliate_status
ON public.linkme_commissions(affiliate_id, status);

-- Index for order items by sales_order_id (used in top products query)
CREATE INDEX IF NOT EXISTS idx_sales_order_items_sales_order_id
ON public.sales_order_items(sales_order_id);

-- Index for product images primary lookup
CREATE INDEX IF NOT EXISTS idx_product_images_product_primary
ON public.product_images(product_id, is_primary) WHERE is_primary = true;

-- ============================================================================
-- STEP 2: Create the RPC function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard_data(p_affiliate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate input
  IF p_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'affiliate_id cannot be null';
  END IF;

  -- Build result with commissions by status and top products
  SELECT jsonb_build_object(
    'commissionsByStatus', (
      SELECT jsonb_build_object(
        'total', jsonb_build_object(
          'count', COUNT(*)::int,
          'amountHT', COALESCE(SUM(affiliate_commission), 0)::numeric,
          'amountTTC', COALESCE(SUM(affiliate_commission_ttc), 0)::numeric
        ),
        'pending', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status = 'pending' OR status IS NULL)::int,
          'amountTTC', COALESCE(SUM(affiliate_commission_ttc) FILTER (WHERE status = 'pending' OR status IS NULL), 0)::numeric
        ),
        'validated', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status IN ('validated', 'payable'))::int,
          'amountTTC', COALESCE(SUM(affiliate_commission_ttc) FILTER (WHERE status IN ('validated', 'payable')), 0)::numeric
        ),
        'requested', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status = 'requested')::int,
          'amountTTC', COALESCE(SUM(affiliate_commission_ttc) FILTER (WHERE status = 'requested'), 0)::numeric
        ),
        'paid', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status = 'paid')::int,
          'amountTTC', COALESCE(SUM(affiliate_commission_ttc) FILTER (WHERE status = 'paid'), 0)::numeric
        )
      )
      FROM public.linkme_commissions
      WHERE affiliate_id = p_affiliate_id
    ),
    'topProducts', (
      SELECT COALESCE(jsonb_agg(tp ORDER BY tp."commissionHT" DESC), '[]'::jsonb)
      FROM (
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "productSku",
          (
            SELECT pi.public_url
            FROM public.product_images pi
            WHERE pi.product_id = p.id AND pi.is_primary = true
            LIMIT 1
          ) AS "productImageUrl",
          SUM(loi.quantity)::int AS "quantitySold",
          SUM(loi.total_ht)::numeric AS "revenueHT",
          SUM(loi.affiliate_margin)::numeric AS "commissionHT",
          COALESCE(p.created_by_affiliate, false) AS "isRevendeur"
        FROM public.linkme_order_items_enriched loi
        JOIN public.linkme_commissions lc ON lc.order_id = loi.sales_order_id
        LEFT JOIN public.products p ON p.id = loi.product_id
        WHERE lc.affiliate_id = p_affiliate_id
          AND p.id IS NOT NULL
        GROUP BY p.id, p.name, p.sku, p.created_by_affiliate
        ORDER BY SUM(loi.affiliate_margin) DESC NULLS LAST
        LIMIT 10
      ) tp
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (function respects RLS via SECURITY INVOKER)
GRANT EXECUTE ON FUNCTION public.get_affiliate_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_dashboard_data(UUID) TO service_role;

COMMENT ON FUNCTION public.get_affiliate_dashboard_data IS
'Consolidated dashboard data for LinkMe affiliates. Returns commissions by status and top 10 products in a single call. (2026-01-24)';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260124_001: Created get_affiliate_dashboard_data RPC + indexes';
  RAISE NOTICE 'Expected improvement: 6+ queries -> 1 query, 15s+ -> <500ms';
END $$;

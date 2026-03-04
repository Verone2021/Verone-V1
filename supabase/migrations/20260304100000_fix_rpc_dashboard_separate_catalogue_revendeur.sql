-- ============================================================================
-- Migration: Fix RPC get_affiliate_dashboard_data - Separate catalogue/revendeur
-- Date: 2026-03-04
-- Description: Return top 5 catalogue + top 5 revendeur separately
--   instead of a global top 10 that mixes both categories.
--
-- Bug: LIMIT 10 global caused catalogue products (higher margins) to push
--   revendeur products out of the list entirely.
-- Solution: Two separate sub-queries with LIMIT 5 each.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_affiliate_dashboard_data(UUID);

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

  -- Build result with commissions by status and top products (catalogue + revendeur separated)
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
    -- Top 5 catalogue products (created_by_affiliate IS NULL)
    'topProductsCatalogue', (
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
          false AS "isRevendeur"
        FROM public.linkme_order_items_enriched loi
        JOIN public.linkme_commissions lc ON lc.order_id = loi.sales_order_id
        LEFT JOIN public.products p ON p.id = loi.product_id
        WHERE lc.affiliate_id = p_affiliate_id
          AND p.id IS NOT NULL
          AND p.created_by_affiliate IS NULL
        GROUP BY p.id, p.name, p.sku
        ORDER BY SUM(loi.affiliate_margin) DESC NULLS LAST
        LIMIT 5
      ) tp
    ),
    -- Top 5 revendeur products (created_by_affiliate IS NOT NULL)
    'topProductsRevendeur', (
      SELECT COALESCE(jsonb_agg(tp ORDER BY tp."revenueHT" DESC), '[]'::jsonb)
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
          true AS "isRevendeur"
        FROM public.linkme_order_items_enriched loi
        JOIN public.linkme_commissions lc ON lc.order_id = loi.sales_order_id
        LEFT JOIN public.products p ON p.id = loi.product_id
        WHERE lc.affiliate_id = p_affiliate_id
          AND p.id IS NOT NULL
          AND p.created_by_affiliate IS NOT NULL
        GROUP BY p.id, p.name, p.sku
        ORDER BY SUM(loi.total_ht) DESC NULLS LAST
        LIMIT 5
      ) tp
    )
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_affiliate_dashboard_data IS
'Consolidated dashboard data for LinkMe affiliates. Returns commissions by status, top 5 catalogue products, and top 5 revendeur products separately. (2026-03-04) - Fixed global LIMIT 10 that mixed catalogue/revendeur.';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260304_100000: Fixed get_affiliate_dashboard_data - separate catalogue/revendeur top products';
END $$;

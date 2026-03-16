-- ============================================================================
-- Migration: Fix RPC get_affiliate_dashboard_data - Use total_payout for KPIs
-- Date: 2026-03-16
-- Description:
--   1. commissionsByStatus: Use COALESCE(total_payout_ht/ttc, affiliate_commission/ttc)
--      so Dashboard matches Page Commissions (total_payout = source of truth)
--   2. topProductsRevendeur: Use total_ht * 0.15 for commissionHT instead of
--      affiliate_margin (which is 0 for revendeur products, margin_rate=0)
--   3. Fix amountHT in total to also use total_payout_ht
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_affiliate_dashboard_data(UUID);

CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard_data(p_affiliate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate input
  IF p_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'affiliate_id cannot be null';
  END IF;

  -- Build result with commissions by status, top products, and order stats
  SELECT jsonb_build_object(
    'commissionsByStatus', (
      SELECT jsonb_build_object(
        'total', jsonb_build_object(
          'count', COUNT(*)::int,
          'amountHT', COALESCE(SUM(COALESCE(total_payout_ht, affiliate_commission)), 0)::numeric,
          'amountTTC', COALESCE(SUM(COALESCE(total_payout_ttc, affiliate_commission_ttc)), 0)::numeric
        ),
        'pending', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status = 'pending' OR status IS NULL)::int,
          'amountTTC', COALESCE(SUM(COALESCE(total_payout_ttc, affiliate_commission_ttc)) FILTER (WHERE status = 'pending' OR status IS NULL), 0)::numeric
        ),
        'validated', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status IN ('validated', 'payable'))::int,
          'amountTTC', COALESCE(SUM(COALESCE(total_payout_ttc, affiliate_commission_ttc)) FILTER (WHERE status IN ('validated', 'payable')), 0)::numeric
        ),
        'requested', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status = 'requested')::int,
          'amountTTC', COALESCE(SUM(COALESCE(total_payout_ttc, affiliate_commission_ttc)) FILTER (WHERE status = 'requested'), 0)::numeric
        ),
        'paid', jsonb_build_object(
          'count', COUNT(*) FILTER (WHERE status = 'paid')::int,
          'amountTTC', COALESCE(SUM(COALESCE(total_payout_ttc, affiliate_commission_ttc)) FILTER (WHERE status = 'paid'), 0)::numeric
        )
      )
      FROM public.linkme_commissions
      WHERE affiliate_id = p_affiliate_id
    ),
    -- Order stats for collaborateur KPIs (no commission data)
    'orderStats', jsonb_build_object(
      'ordersCount', (
        SELECT COUNT(DISTINCT lc.order_id)::int
        FROM linkme_commissions lc
        WHERE lc.affiliate_id = p_affiliate_id
      ),
      'totalHT', (
        SELECT COALESCE(SUM(loi.total_ht), 0)::numeric
        FROM linkme_order_items_enriched loi
        JOIN linkme_commissions lc ON lc.order_id = loi.sales_order_id
        WHERE lc.affiliate_id = p_affiliate_id
      ),
      'productsOrdered', (
        SELECT COALESCE(SUM(loi.quantity), 0)::int
        FROM linkme_order_items_enriched loi
        JOIN linkme_commissions lc ON lc.order_id = loi.sales_order_id
        WHERE lc.affiliate_id = p_affiliate_id
      ),
      'catalogProductsCount', (
        SELECT COALESCE(SUM(ls.products_count), 0)::int
        FROM linkme_selections ls
        WHERE ls.affiliate_id = p_affiliate_id
      )
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
          ROUND(SUM(loi.total_ht * 0.15), 2)::numeric AS "commissionHT",
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
'Consolidated dashboard data for LinkMe affiliates. SECURITY DEFINER to bypass RLS for enseigne_collaborateur. Uses COALESCE(total_payout, affiliate_commission) for commission KPIs to match Page Commissions. Uses 15% rate for revendeur commissionHT. (2026-03-16)';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260316_180000: Fixed get_affiliate_dashboard_data - total_payout for KPIs + 15pct revendeur commission';
END $$;

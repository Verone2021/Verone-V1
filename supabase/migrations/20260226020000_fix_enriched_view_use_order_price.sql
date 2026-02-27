-- ============================================================================
-- Migration: Fix linkme_order_items_enriched to use actual order price
-- Date: 2026-02-26
--
-- BUG: COALESCE(lsi.selling_price_ht, soi.unit_price_ht) always returns catalog
--      price (lsi.selling_price_ht) even when affiliate modified the price.
--      Result: back-office shows 15.88€ instead of 30€ for modified orders.
--
-- FIX: Use soi.unit_price_ht as selling_price_ht (source of truth for order price)
--      Use soi.retrocession_rate for affiliate_margin (aligned with DB triggers)
--
-- ALSO: Add retrocession_rate to the view for front-end commission display
--
-- Impact: Views linkme_order_items_enriched + linkme_orders_with_margins
-- ============================================================================

-- Step 1: Drop views in dependency order
DROP VIEW IF EXISTS public.linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS public.linkme_order_items_enriched CASCADE;

-- Step 2: Recreate linkme_order_items_enriched with corrected price logic
CREATE VIEW public.linkme_order_items_enriched AS
SELECT
  soi.id,
  soi.sales_order_id,
  soi.product_id,
  soi.quantity,
  soi.unit_price_ht,
  soi.total_ht,
  soi.linkme_selection_item_id,
  soi.tax_rate,
  p.name AS product_name,
  p.sku AS product_sku,
  pi.public_url AS product_image_url,
  COALESCE(lsi.base_price_ht, soi.unit_price_ht) AS base_price_ht,
  COALESCE(lsi.margin_rate, 0::numeric) AS margin_rate,
  COALESCE(cp.channel_commission_rate, 0::numeric) AS commission_rate,
  -- FIX: Use actual order item price (may differ from catalog if user edited it)
  soi.unit_price_ht AS selling_price_ht,
  -- FIX: Use retrocession_rate formula aligned with lock_prices_on_order_validation() trigger
  -- Previously: COALESCE(lsi.selling_price_ht, soi.unit_price_ht) * (margin_rate / 100) * qty
  -- Now: unit_price_ht * retrocession_rate * qty (same formula as DB trigger)
  ROUND(soi.unit_price_ht * COALESCE(soi.retrocession_rate, 0::numeric) * soi.quantity::numeric, 2) AS affiliate_margin,
  -- Expose retrocession_rate for front-end display
  COALESCE(soi.retrocession_rate, 0::numeric) AS retrocession_rate
FROM sales_order_items soi
  LEFT JOIN products p ON p.id = soi.product_id
  LEFT JOIN product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true
  LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  LEFT JOIN channel_pricing cp ON cp.product_id = soi.product_id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
WHERE (EXISTS (
  SELECT 1
  FROM sales_orders so
  WHERE so.id = soi.sales_order_id AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
));

-- Step 3: Recreate linkme_orders_with_margins (depends on above)
CREATE VIEW public.linkme_orders_with_margins AS
SELECT loe.id,
    loe.order_number,
    loe.status,
    loe.payment_status,
    loe.total_ht,
    loe.total_ttc,
    loe.customer_type,
    loe.customer_id,
    loe.created_at,
    loe.updated_at,
    loe.channel_id,
    loe.customer_name,
    loe.customer_address,
    loe.customer_postal_code,
    loe.customer_city,
    loe.customer_email,
    loe.customer_phone,
    loe.affiliate_name,
    loe.affiliate_type,
    loe.selection_name,
    loe.selection_id,
    COALESCE(lc.affiliate_commission, margins.total_affiliate_margin, 0::numeric) AS total_affiliate_margin,
    COALESCE(margins.items_count, 0::bigint) AS items_count
FROM linkme_orders_enriched loe
  LEFT JOIN linkme_commissions lc ON lc.order_id = loe.id
  LEFT JOIN (
    SELECT linkme_order_items_enriched.sales_order_id,
      sum(linkme_order_items_enriched.affiliate_margin) AS total_affiliate_margin,
      count(*) AS items_count
    FROM linkme_order_items_enriched
    GROUP BY linkme_order_items_enriched.sales_order_id
  ) margins ON margins.sales_order_id = loe.id;

-- Step 4: Grant permissions
GRANT SELECT ON public.linkme_order_items_enriched TO authenticated;
GRANT SELECT ON public.linkme_order_items_enriched TO anon;
GRANT SELECT ON public.linkme_orders_with_margins TO authenticated;
GRANT SELECT ON public.linkme_orders_with_margins TO anon;

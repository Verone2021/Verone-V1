-- ============================================================================
-- Migration: Fix linkme_order_items_enriched view formula
-- Date: 2026-02-12
-- Context:
--   BUG 6: View uses base_price_ht for affiliate_margin and selling_price_ht calculation
--          Should use selling_price_ht from GENERATED column (taux de marque)
--
--   BEFORE (incorrect):
--     selling_price_ht = base_price * (1 + commission_rate/100 + margin_rate/100) [additive]
--     affiliate_margin = base_price * (margin_rate / 100) * quantity
--
--   AFTER (correct, matches SSOT margin-calculation.ts):
--     selling_price_ht = COALESCE(lsi.selling_price_ht, soi.unit_price_ht) [GENERATED column]
--     affiliate_margin = selling_price_ht * (margin_rate / 100) * quantity
--
--   Impact: For margin_rate=15%, old formula under-estimates by ~17.6%
--
--   Note: Must DROP CASCADE because linkme_orders_with_margins depends on this view
-- ============================================================================

BEGIN;

-- Drop dependent view first
DROP VIEW IF EXISTS linkme_orders_with_margins;
-- Drop main view
DROP VIEW IF EXISTS linkme_order_items_enriched;

-- Recreate main view with corrected formula
CREATE VIEW linkme_order_items_enriched AS
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
  -- FIX: Use selling_price_ht from GENERATED column (taux de marque)
  -- Previously: base_price * (1 + commission_rate/100 + margin_rate/100) -- additive, incorrect
  COALESCE(lsi.selling_price_ht, soi.unit_price_ht) AS selling_price_ht,
  -- FIX: Use selling_price_ht for affiliate_margin (taux de marque, not taux de marge)
  -- Previously: base_price * (margin_rate / 100) * quantity -- under-estimates by ~17.6%
  COALESCE(lsi.selling_price_ht, soi.unit_price_ht) * (COALESCE(lsi.margin_rate, 0::numeric) / 100::numeric) * soi.quantity::numeric AS affiliate_margin
FROM sales_order_items soi
  LEFT JOIN products p ON p.id = soi.product_id
  LEFT JOIN product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true
  LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  LEFT JOIN channel_pricing cp ON cp.product_id = soi.product_id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
WHERE EXISTS (
  SELECT 1
  FROM sales_orders so
  WHERE so.id = soi.sales_order_id AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
);

-- Recreate dependent view (definition preserved from before)
CREATE VIEW linkme_orders_with_margins AS
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

COMMIT;

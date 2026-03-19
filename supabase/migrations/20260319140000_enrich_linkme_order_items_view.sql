-- Migration: Add created_by_affiliate and affiliate_commission_rate to linkme_order_items_enriched
-- Why: affiliate_margin = retrocession_amount = 0 for affiliate products (inverted model)
-- The view needs to expose the product's affiliate info so the frontend can calculate correctly.
-- Also adds a computed affiliate_margin that works for BOTH catalogue and affiliate products.

CREATE OR REPLACE VIEW linkme_order_items_enriched AS
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
  COALESCE(soi.base_price_ht_locked, lsi.base_price_ht, soi.unit_price_ht) AS base_price_ht,
  COALESCE(lsi.margin_rate, 0::numeric) AS margin_rate,
  COALESCE(cp.channel_commission_rate, 0::numeric) AS commission_rate,
  COALESCE(soi.selling_price_ht_locked, lsi.selling_price_ht)::numeric(10,2) AS selling_price_ht,
  -- affiliate_margin: for catalogue products = retrocession_amount, for affiliate products = total_ht * commission_rate
  CASE
    WHEN p.created_by_affiliate IS NOT NULL THEN
      ROUND(soi.total_ht * COALESCE(p.affiliate_commission_rate, 15) / 100, 2)
    ELSE
      COALESCE(soi.retrocession_amount, 0::numeric)
  END::numeric(10,2) AS affiliate_margin,
  COALESCE(soi.retrocession_rate, 0::numeric) AS retrocession_rate,
  -- New columns for affiliate product identification
  p.created_by_affiliate,
  p.affiliate_commission_rate
FROM sales_order_items soi
LEFT JOIN products p ON p.id = soi.product_id
LEFT JOIN product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true
LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
LEFT JOIN channel_pricing cp ON cp.product_id = soi.product_id
  AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
WHERE EXISTS (
  SELECT 1 FROM sales_orders so
  WHERE so.id = soi.sales_order_id
    AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
);

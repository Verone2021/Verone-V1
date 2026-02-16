-- Migration: Fix LINK-240xxx commissions alignment (Bubble vs DB)
--
-- Root cause: retrocession was recalculated with CURRENT prices instead of LOCKED prices
-- Fix formula: ROUND(selling_locked * 0.15, 2) * quantity (verified against Bubble)
--
-- Step 1: Fix PRD-0132 selling_locked in LINK-240006 (was 1681.05 = TTC total, should be 500.00)
-- Step 2: Recalculate ALL retrocessions for LINK-240xxx using locked prices
-- Step 3: Sync linkme_commissions table

BEGIN;

-- ============================================================
-- STEP 1: Fix PRD-0132 selling_price_ht_locked in LINK-240006
-- ============================================================
-- selling_locked was set to 1681.05 (the TTC order total) instead of 500.00 (the actual product price)
UPDATE sales_order_items soi
SET selling_price_ht_locked = 500.00
FROM sales_orders so, products p
WHERE so.id = soi.sales_order_id
  AND p.id = soi.product_id
  AND so.order_number = 'LINK-240006'
  AND p.sku = 'PRD-0132';

-- ============================================================
-- STEP 2: Recalculate ALL retrocessions for LINK-240xxx
-- ============================================================
-- Formula: ROUND(selling_locked * 0.15, 2) * quantity
-- Exception: catalogue products with margin=0 at order time (selling_locked = base_locked) → commission = 0
-- Affiliate products always get 15% regardless of margin
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  -- Catalogue product with no margin at time of order (selling = base)
  -- e.g. PRD-0130 had 0% margin → commission = 0
  WHEN soi.selling_price_ht_locked = soi.base_price_ht_locked
       AND p.created_by_affiliate IS NULL
  THEN 0
  -- All others: catalogue with margin + affiliate products → 15% of selling * qty
  ELSE ROUND(soi.selling_price_ht_locked * 0.15, 2) * soi.quantity
END
FROM products p, sales_orders so
WHERE p.id = soi.product_id
  AND so.id = soi.sales_order_id
  AND so.order_number LIKE 'LINK-240%';

-- ============================================================
-- STEP 3: Sync linkme_commissions from recalculated retrocessions
-- ============================================================
UPDATE linkme_commissions lc
SET
  affiliate_commission = sub.sum_retro,
  affiliate_commission_ttc = ROUND(sub.sum_retro * 1.2, 2),
  updated_at = NOW()
FROM (
  SELECT so.order_number,
    COALESCE(SUM(soi.retrocession_amount), 0) as sum_retro
  FROM sales_orders so
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  WHERE so.order_number LIKE 'LINK-240%'
  GROUP BY so.order_number
) sub
WHERE lc.order_number = sub.order_number
  AND lc.affiliate_commission IS DISTINCT FROM sub.sum_retro;

COMMIT;

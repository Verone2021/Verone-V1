-- Migration: Lock prices for verified invoices
--
-- For each verified invoice (LINK-230001, LINK-230002, LINK-230003):
-- 1. Copy current prices from linkme_selection_items to *_locked columns
-- 2. Recalculate retrocession_amount with correct formula
-- 3. Set price_locked_at = NOW()
-- 4. Update affiliate_total_ht on sales_orders
-- 5. Update linkme_commissions (trigger only fires on status change, not on amount changes)
--
-- This ensures these invoices are permanently protected from future price changes.

-- Step 1: Lock all LinkMe order items for the 3 verified invoices
-- Sets locked prices + recalculates retrocession_amount
UPDATE sales_order_items soi
SET
  base_price_ht_locked = lsi.base_price_ht,
  selling_price_ht_locked = lsi.selling_price_ht,
  price_locked_at = NOW(),
  -- Recalculate commission with correct formula
  retrocession_amount = ROUND(
    (soi.unit_price_ht - lsi.base_price_ht) * soi.quantity, 2
  )
FROM linkme_selection_items lsi, sales_orders so
WHERE soi.linkme_selection_item_id = lsi.id
  AND so.id = soi.sales_order_id
  AND so.order_number IN ('LINK-230001', 'LINK-230002', 'LINK-230003');

-- Step 2: Recalculate affiliate_total_ht on each order
-- (trg_update_affiliate_totals fires on ANY update of sales_order_items,
--  but we do it explicitly for clarity and idempotency)
UPDATE sales_orders so
SET affiliate_total_ht = sub.total_retrocession
FROM (
  SELECT soi.sales_order_id, SUM(soi.retrocession_amount) as total_retrocession
  FROM sales_order_items soi
  JOIN sales_orders so2 ON so2.id = soi.sales_order_id
  WHERE so2.order_number IN ('LINK-230001', 'LINK-230002', 'LINK-230003')
  GROUP BY soi.sales_order_id
) sub
WHERE so.id = sub.sales_order_id;

-- Step 3: Update linkme_commissions directly
-- The commission trigger (trg_create_linkme_commission) only fires on INSERT OR UPDATE OF status.
-- Since we're not changing order status, we must update commissions manually.
UPDATE linkme_commissions lc
SET
  affiliate_commission = sub.total_retrocession,
  affiliate_commission_ttc = ROUND(sub.total_retrocession * (1 + lc.tax_rate), 2),
  order_amount_ht = sub.order_total_ht,
  margin_rate_applied = ROUND(sub.total_retrocession / NULLIF(sub.order_total_ht, 0), 4),
  updated_at = NOW()
FROM (
  SELECT
    so.id as order_id,
    so.total_ht as order_total_ht,
    SUM(soi.retrocession_amount) as total_retrocession
  FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id
  WHERE so.order_number IN ('LINK-230001', 'LINK-230002', 'LINK-230003')
  GROUP BY so.id, so.total_ht
) sub
WHERE lc.order_id = sub.order_id;

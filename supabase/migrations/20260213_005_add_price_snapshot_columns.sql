-- Migration: Add price snapshot columns to sales_order_items
-- Purpose: Allow locking prices at order validation time so future price changes
--          in channel_pricing/linkme_selection_items don't corrupt past commissions.
--
-- These columns are nullable:
--   - NULL = prices not yet locked (new orders, pre-validation)
--   - NOT NULL = prices locked (validated/invoiced orders)

ALTER TABLE sales_order_items
  ADD COLUMN base_price_ht_locked NUMERIC,
  ADD COLUMN selling_price_ht_locked NUMERIC,
  ADD COLUMN price_locked_at TIMESTAMPTZ;

COMMENT ON COLUMN sales_order_items.base_price_ht_locked IS
  'Base price (prix achat) frozen at validation time. NULL = not yet locked.';
COMMENT ON COLUMN sales_order_items.selling_price_ht_locked IS
  'Selling price (prix vente) frozen at validation time. NULL = not yet locked.';
COMMENT ON COLUMN sales_order_items.price_locked_at IS
  'Timestamp when prices were locked. NULL = not yet locked.';

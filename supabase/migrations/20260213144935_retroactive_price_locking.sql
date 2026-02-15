-- Migration: Retroactive Price Locking for Shipped Orders
-- Date: 2026-02-13
-- Context: Lock prices for 118 shipped orders created BEFORE migrations 008-010
-- Garantie: After this migration, modifying channel_pricing won't impact past shipped invoices

-- Lock prices for all shipped orders that don't have locked prices yet
UPDATE sales_order_items soi
SET
  base_price_ht_locked = COALESCE(
    (SELECT base_price_ht FROM linkme_selection_items WHERE id = soi.linkme_selection_item_id),
    soi.unit_price_ht
  ),
  selling_price_ht_locked = soi.unit_price_ht
WHERE EXISTS (
  SELECT 1 FROM sales_orders so
  WHERE so.id = soi.sales_order_id
    AND so.status = 'shipped'
)
AND soi.base_price_ht_locked IS NULL;

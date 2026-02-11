/**
 * Migration: Allow Negative Quantities for Product Returns
 * Date: 2026-02-09
 *
 * Context:
 * - Credit notes (avoirs) with product returns need negative quantities
 * - Current CHECK constraints prevent negative quantities in sales_order_items
 * - 2 avoirs have product returns: AV-25-004 (17 plateaux) and AV-25-006 (30 plateaux)
 *
 * Changes:
 * - Remove sales_order_items_quantity_check (quantity > 0)
 * - Remove sales_order_items_check (quantity_shipped <= quantity fails with negatives)
 *
 * Note:
 * - For credit notes, quantity is negative, unit_price_ht stays positive
 * - total_ht is GENERATED: quantity × unit_price_ht × (1 - discount_percentage/100)
 * - Example: -17 × 15.88€ × 1.0 = -269.96€
 */

-- Drop constraints blocking negative quantities for returns
ALTER TABLE sales_order_items DROP CONSTRAINT IF EXISTS sales_order_items_quantity_check;
ALTER TABLE sales_order_items DROP CONSTRAINT IF EXISTS sales_order_items_check;

-- Add table comment
COMMENT ON TABLE sales_order_items IS
  'Sales order line items and credit note returns. ' ||
  'For returns: quantity is negative, unit_price_ht stays positive, total_ht is calculated as negative.';

-- ============================================================================
-- Migration: Sync commission order_numbers from sales_orders (live source)
-- Purpose: 21/99 commissions have stale LINK-240XXX numbers while real orders
--          have been renamed to F-25-XXX. This syncs the frozen copies.
-- Note: Frontend now reads from JOIN (live), but DB copies should stay in sync
--       for direct SQL exports and other consumers.
-- ============================================================================

UPDATE linkme_commissions lc
SET order_number = so.order_number,
    updated_at = NOW()
FROM sales_orders so
WHERE so.id = lc.order_id
  AND lc.order_number IS DISTINCT FROM so.order_number;

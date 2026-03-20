-- Add quote linking fields to sales_orders (same pattern as invoice linking)
-- Qonto API remains the source of truth for quotes, these are just FK pointers
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS quote_qonto_id TEXT DEFAULT NULL;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS quote_number TEXT DEFAULT NULL;

COMMENT ON COLUMN sales_orders.quote_qonto_id IS 'Qonto quote ID linked to this order';
COMMENT ON COLUMN sales_orders.quote_number IS 'Qonto quote number (e.g. D-2026-020)';

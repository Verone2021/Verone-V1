-- Add shipping cost estimate and shipping class to products
-- Used for per-product shipping cost calculation in site-internet checkout

ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost_estimate NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_class TEXT DEFAULT 'standard';

COMMENT ON COLUMN products.shipping_cost_estimate IS 'Estimated shipping cost in EUR for this product (manual or via Packlink API)';
COMMENT ON COLUMN products.shipping_class IS 'Shipping class: small (<5kg), medium (5-30kg), large (>30kg), oversized';

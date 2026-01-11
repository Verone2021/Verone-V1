-- Migration: Add fees_vat_rate column to sales_orders
-- Purpose: Store the VAT rate applied to service fees (shipping, handling, insurance)
-- Default: 20% (0.20) which is the standard French VAT rate for services

-- Add fees_vat_rate column to sales_orders
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS fees_vat_rate DECIMAL(5,4) DEFAULT 0.20;

-- Add comment for documentation
COMMENT ON COLUMN sales_orders.fees_vat_rate IS 'VAT rate applied to service fees (shipping, handling, insurance). Default 20% (0.20)';

-- Also add to purchase_orders for consistency (supplier side)
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS fees_vat_rate DECIMAL(5,4) DEFAULT 0.20;

COMMENT ON COLUMN purchase_orders.fees_vat_rate IS 'VAT rate applied to service fees (shipping, handling, insurance). Default 20% (0.20)';

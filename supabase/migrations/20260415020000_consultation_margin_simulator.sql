-- ============================================================
-- Migration: Consultation Margin Simulator
-- Adds shipping cost, cost price override, sample flag, and
-- line-level acceptance status to consultation_products.
-- Adds TVA rate to client_consultations.
-- ============================================================

-- 1. consultation_products: shipping cost per line
ALTER TABLE consultation_products
  ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_cost_currency text DEFAULT 'EUR';

COMMENT ON COLUMN consultation_products.shipping_cost IS 'Transport cost for this specific product line in this consultation';
COMMENT ON COLUMN consultation_products.shipping_cost_currency IS 'Currency of shipping cost (EUR/USD)';

-- 2. consultation_products: cost price override (negotiated price different from catalog)
ALTER TABLE consultation_products
  ADD COLUMN IF NOT EXISTS cost_price_override numeric;

COMMENT ON COLUMN consultation_products.cost_price_override IS 'Overrides products.cost_price for this consultation if negotiated differently';

-- 3. consultation_products: sample flag
ALTER TABLE consultation_products
  ADD COLUMN IF NOT EXISTS is_sample boolean DEFAULT false;

COMMENT ON COLUMN consultation_products.is_sample IS 'True if this line is a sample (echantillon), not a regular product';

-- 4. client_consultations: TVA rate for client presentation
ALTER TABLE client_consultations
  ADD COLUMN IF NOT EXISTS tva_rate numeric DEFAULT 20;

COMMENT ON COLUMN client_consultations.tva_rate IS 'VAT rate (%) used for client-facing documents and presentations';

-- 5. Update status values for line-level acceptance (future use)
-- Current values: 'pending'
-- New possible values: pending, accepted, rejected, ordered
-- No constraint needed — text field allows flexibility
COMMENT ON COLUMN consultation_products.status IS 'Line status: pending, accepted, rejected, ordered';

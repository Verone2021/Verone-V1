-- Add internal_notes and sourcing_channel columns to products table
-- Phase 3 of Sourcing Module Audit

-- Internal notes: free-text notes for sourcing team
ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Sourcing channel: how the product was discovered
-- Values: 'online', 'trade_show', 'referral', 'visit', 'other'
ALTER TABLE products ADD COLUMN IF NOT EXISTS sourcing_channel TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.internal_notes IS 'Internal notes for sourcing team (not visible to customers)';
COMMENT ON COLUMN products.sourcing_channel IS 'How the product was sourced: online, trade_show, referral, visit, other';

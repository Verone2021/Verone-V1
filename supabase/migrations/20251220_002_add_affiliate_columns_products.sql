-- Migration: Add affiliate product columns to products table
-- Description: Extends products table to support affiliate-created products with inverted commission model

-- Add columns for affiliate-created products
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_approval_status affiliate_product_approval_status DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_payout_ht NUMERIC(10,2) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_commission_rate NUMERIC(5,2) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_approved_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_approved_by UUID REFERENCES auth.users(id) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  created_by_affiliate UUID REFERENCES linkme_affiliates(id) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_rejection_reason TEXT DEFAULT NULL;

-- Create partial index for pending approvals (fast queue lookup)
CREATE INDEX IF NOT EXISTS idx_products_affiliate_pending_approval
  ON products(affiliate_approval_status, created_at DESC)
  WHERE affiliate_approval_status = 'pending_approval';

-- Create index for affiliate's own products
CREATE INDEX IF NOT EXISTS idx_products_created_by_affiliate
  ON products(created_by_affiliate)
  WHERE created_by_affiliate IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN products.affiliate_approval_status IS
  'Approval workflow status for affiliate-created products (NULL for Verone catalog products)';

COMMENT ON COLUMN products.affiliate_payout_ht IS
  'Amount the affiliate wants to receive HT (inverted commission model)';

COMMENT ON COLUMN products.affiliate_commission_rate IS
  'Platform commission rate for this affiliate product (default 15%)';

COMMENT ON COLUMN products.affiliate_approved_at IS
  'Timestamp when admin approved the product';

COMMENT ON COLUMN products.affiliate_approved_by IS
  'Admin user who approved the product';

COMMENT ON COLUMN products.created_by_affiliate IS
  'Reference to the linkme_affiliate who created this product';

COMMENT ON COLUMN products.affiliate_rejection_reason IS
  'Reason provided by admin when rejecting the product';

-- Constraint: If product is affiliate-created, must have payout
ALTER TABLE products ADD CONSTRAINT chk_affiliate_product_payout
  CHECK (
    (created_by_affiliate IS NULL) OR
    (created_by_affiliate IS NOT NULL AND affiliate_payout_ht IS NOT NULL AND affiliate_payout_ht > 0)
  );

-- Constraint: Commission rate must be between 0 and 100
ALTER TABLE products ADD CONSTRAINT chk_affiliate_commission_rate_range
  CHECK (
    affiliate_commission_rate IS NULL OR
    (affiliate_commission_rate >= 0 AND affiliate_commission_rate <= 100)
  );

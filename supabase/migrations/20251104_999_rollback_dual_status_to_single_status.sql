-- Migration Rollback: Dual Status → Single Status
-- Revert product_status + stock_status back to status

-- 1. Add back the status column
ALTER TABLE products
ADD COLUMN status availability_status_type;

-- 2. Migrate data: Copy product_status → status
UPDATE products
SET status = product_status::text::availability_status_type
WHERE product_status IS NOT NULL;

-- 3. Drop the new columns
ALTER TABLE products
DROP COLUMN IF EXISTS product_status CASCADE;

ALTER TABLE products
DROP COLUMN IF EXISTS stock_status CASCADE;

-- 4. Make status NOT NULL with default
ALTER TABLE products
ALTER COLUMN status SET DEFAULT 'active'::availability_status_type;

ALTER TABLE products
ALTER COLUMN status SET NOT NULL;

-- 5. Drop the new ENUMs if they exist
DROP TYPE IF EXISTS product_status_type CASCADE;
DROP TYPE IF EXISTS stock_status_type CASCADE;

-- Comment
COMMENT ON COLUMN products.status IS 'Product availability status (reverted from dual status system)';

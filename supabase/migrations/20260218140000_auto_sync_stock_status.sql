-- ============================================================================
-- Migration: Auto-sync stock_status with stock_real
-- Purpose: Ensure stock_status is always consistent with stock_real
-- Rules:
--   stock_real > 0  → 'in_stock'
--   stock_real <= 0 → 'out_of_stock'
--   'coming_soon'   → never overwritten (manual status)
-- ============================================================================

-- Step 1: Fix existing inconsistencies (83 products)
-- 39 products marked 'in_stock' with stock_real = 0
UPDATE products
SET stock_status = 'out_of_stock'::stock_status_type,
    updated_at = CURRENT_TIMESTAMP
WHERE stock_real <= 0
  AND stock_status::text = 'in_stock'
  AND archived_at IS NULL;

-- 44 products marked 'out_of_stock' with stock_real > 0
UPDATE products
SET stock_status = 'in_stock'::stock_status_type,
    updated_at = CURRENT_TIMESTAMP
WHERE stock_real > 0
  AND stock_status::text = 'out_of_stock'
  AND archived_at IS NULL;

-- Step 2: Create trigger function for automatic sync
CREATE OR REPLACE FUNCTION sync_stock_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip 'coming_soon' products (manual marketing status)
  IF NEW.stock_status::text = 'coming_soon' THEN
    RETURN NEW;
  END IF;

  -- Auto-sync stock_status based on stock_real
  IF NEW.stock_real > 0 THEN
    NEW.stock_status = 'in_stock'::stock_status_type;
  ELSE
    NEW.stock_status = 'out_of_stock'::stock_status_type;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 3: Create BEFORE UPDATE trigger on stock_real column
DROP TRIGGER IF EXISTS trg_sync_stock_status ON products;

CREATE TRIGGER trg_sync_stock_status
  BEFORE UPDATE OF stock_real ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_status();

-- Step 4: Add comment for documentation
COMMENT ON FUNCTION sync_stock_status() IS
  'Auto-syncs stock_status with stock_real. Rules: >0=in_stock, <=0=out_of_stock, coming_soon=never touched.';

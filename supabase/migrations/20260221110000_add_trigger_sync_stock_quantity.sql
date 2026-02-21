-- Migration: Add trigger to keep stock_quantity in sync with stock_real
-- Context: stock_real is the source of truth (maintained by 5 triggers since Nov 2025)
--          stock_quantity is a legacy column still referenced in 97 files
--          This trigger ensures stock_quantity always mirrors stock_real
--          so no existing code breaks and no divergence accumulates.
--
-- Option A from audit: safe, additive, zero code changes required.

-- Step 1: Re-sync the 21 products that diverged since the 2026-02-21 one-shot migration
UPDATE products
SET stock_quantity = stock_real
WHERE stock_real IS NOT NULL
  AND stock_quantity IS DISTINCT FROM stock_real;

-- Step 2: Function that copies stock_real → stock_quantity on every update
CREATE OR REPLACE FUNCTION sync_stock_quantity_from_stock_real()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.stock_quantity := NEW.stock_real;
  RETURN NEW;
END;
$$;

-- Step 3: Trigger fires BEFORE each UPDATE that touches stock_real
--         BEFORE = value is set before the row is written to disk
--         OF stock_real = only fires when stock_real actually changes (performance)
DROP TRIGGER IF EXISTS trg_sync_stock_quantity ON products;

CREATE TRIGGER trg_sync_stock_quantity
BEFORE UPDATE OF stock_real ON products
FOR EACH ROW
EXECUTE FUNCTION sync_stock_quantity_from_stock_real();

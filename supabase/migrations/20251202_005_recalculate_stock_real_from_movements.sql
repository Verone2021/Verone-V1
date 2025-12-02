-- Migration: Recalculate stock_real from stock_movements
-- Date: 2025-12-02
-- Issue: stock_real values were set directly without corresponding stock_movements
-- Solution: Recalculate stock_real = SUM(quantity_change) from stock_movements

-- 1. Create audit table to track corrections (for traceability)
CREATE TABLE IF NOT EXISTS _stock_audit_2025_12_02 AS
SELECT
  p.id,
  p.sku,
  p.name,
  p.stock_real as stock_before,
  COALESCE((SELECT SUM(sm.quantity_change) FROM stock_movements sm WHERE sm.product_id = p.id), 0) as calculated_stock,
  p.stock_real - COALESCE((SELECT SUM(sm.quantity_change) FROM stock_movements sm WHERE sm.product_id = p.id), 0) as ecart,
  NOW() as audit_date
FROM products p
WHERE p.stock_real != COALESCE((SELECT SUM(sm.quantity_change) FROM stock_movements sm WHERE sm.product_id = p.id), 0);

-- 2. Log the number of products affected
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM _stock_audit_2025_12_02;
  RAISE NOTICE 'Stock audit: % produits avec écarts identifiés', v_count;
END $$;

-- 3. Recalculate stock_real = sum of stock_movements
UPDATE products p
SET
  stock_real = COALESCE((
    SELECT SUM(sm.quantity_change)
    FROM stock_movements sm
    WHERE sm.product_id = p.id
  ), 0),
  updated_at = NOW()
WHERE stock_real != COALESCE((
  SELECT SUM(sm.quantity_change)
  FROM stock_movements sm
  WHERE sm.product_id = p.id
), 0);

-- 4. Add comment to audit table
COMMENT ON TABLE _stock_audit_2025_12_02 IS 'Audit table for stock_real recalculation. Products had stock_real values set without stock_movements. Created 2025-12-02.';

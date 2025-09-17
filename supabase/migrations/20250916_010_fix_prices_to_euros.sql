-- Migration: Fix price columns to euros NUMERIC(10,2)
-- Date: 2025-09-16
-- Description: Convert price columns from INTEGER to NUMERIC(10,2) for proper euro handling

-- 1. Backup existing data and verify current values
CREATE TEMP TABLE products_backup AS
SELECT id, name, price_ht, cost_price, estimated_selling_price
FROM products;

-- 2. Add new columns with correct NUMERIC(10,2) type
ALTER TABLE products
ADD COLUMN price_ht_new NUMERIC(10,2);

ALTER TABLE products
ADD COLUMN cost_price_new NUMERIC(10,2);

-- 3. Convert existing data (assuming current values are already in euros)
-- Based on the data inspection, values like 1299, 899 seem to be euros, not centimes
UPDATE products
SET
  price_ht_new = price_ht::NUMERIC(10,2),
  cost_price_new = CASE
    WHEN cost_price IS NOT NULL THEN cost_price::NUMERIC(10,2)
    ELSE NULL
  END;

-- 4. Verify conversion before dropping old columns
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM products
  WHERE price_ht != price_ht_new OR
        (cost_price IS NOT NULL AND cost_price != cost_price_new);

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Data conversion mismatch detected. Aborting migration.';
  END IF;
END $$;

-- 5. Drop old columns and rename new ones
ALTER TABLE products DROP COLUMN price_ht;
ALTER TABLE products DROP COLUMN cost_price;

ALTER TABLE products RENAME COLUMN price_ht_new TO price_ht;
ALTER TABLE products RENAME COLUMN cost_price_new TO cost_price;

-- 6. Add NOT NULL constraint to price_ht (business requirement)
ALTER TABLE products ALTER COLUMN price_ht SET NOT NULL;

-- 7. Fix estimated_selling_price to ensure proper precision
ALTER TABLE products
ALTER COLUMN estimated_selling_price TYPE NUMERIC(10,2);

-- 8. Same fixes for product_drafts table
ALTER TABLE product_drafts
ADD COLUMN supplier_price_new NUMERIC(10,2);

ALTER TABLE product_drafts
ADD COLUMN estimated_selling_price_new NUMERIC(10,2);

-- Convert product_drafts data
UPDATE product_drafts
SET
  supplier_price_new = CASE
    WHEN supplier_price IS NOT NULL THEN supplier_price::NUMERIC(10,2)
    ELSE NULL
  END,
  estimated_selling_price_new = CASE
    WHEN estimated_selling_price IS NOT NULL THEN estimated_selling_price::NUMERIC(10,2)
    ELSE NULL
  END;

-- Drop old columns and rename
ALTER TABLE product_drafts DROP COLUMN supplier_price;
ALTER TABLE product_drafts DROP COLUMN estimated_selling_price;

ALTER TABLE product_drafts RENAME COLUMN supplier_price_new TO supplier_price;
ALTER TABLE product_drafts RENAME COLUMN estimated_selling_price_new TO estimated_selling_price;

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_price_ht
ON products(price_ht)
WHERE price_ht IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_cost_price
ON products(cost_price)
WHERE cost_price IS NOT NULL;

-- 10. Update constraints on product_drafts to match
ALTER TABLE product_drafts
ALTER COLUMN margin_percentage TYPE NUMERIC(5,2);

-- 11. Add comments for documentation
COMMENT ON COLUMN products.price_ht IS 'Prix HT en euros avec 2 décimales (ex: 1299.99)';
COMMENT ON COLUMN products.cost_price IS 'Prix de revient en euros avec 2 décimales (ex: 899.50)';
COMMENT ON COLUMN products.estimated_selling_price IS 'Prix de vente estimé en euros avec 2 décimales';

COMMENT ON COLUMN product_drafts.supplier_price IS 'Prix fournisseur en euros avec 2 décimales (ex: 150.00)';
COMMENT ON COLUMN product_drafts.estimated_selling_price IS 'Prix de vente estimé en euros avec 2 décimales';

-- 12. Validation finale
DO $$
DECLARE
  products_count INTEGER;
  drafts_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO products_count FROM products WHERE price_ht IS NOT NULL;
  SELECT COUNT(*) INTO drafts_count FROM product_drafts;

  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE '- Products with prices: %', products_count;
  RAISE NOTICE '- Product drafts: %', drafts_count;
  RAISE NOTICE '- All price columns now use NUMERIC(10,2) for euros';
END $$;
-- Migration: Add has_images boolean column to products
-- Purpose: Track whether a product has at least one image for incomplete-product filtering

-- 1. Add boolean column with default false
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_images boolean NOT NULL DEFAULT false;

-- 2. Backfill existing data
UPDATE products SET has_images = EXISTS (
  SELECT 1 FROM product_images pi WHERE pi.product_id = products.id
);

-- 3. Trigger function to keep has_images in sync on INSERT/DELETE in product_images
CREATE OR REPLACE FUNCTION update_product_has_images()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id uuid;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE products SET has_images = EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = target_product_id
  ) WHERE id = target_product_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on product_images table
DROP TRIGGER IF EXISTS trg_update_product_has_images ON product_images;
CREATE TRIGGER trg_update_product_has_images
AFTER INSERT OR DELETE ON product_images
FOR EACH ROW EXECUTE FUNCTION update_product_has_images();

-- 5. Index for fast filtering of incomplete products
CREATE INDEX IF NOT EXISTS idx_products_has_images ON products (has_images) WHERE has_images = false;

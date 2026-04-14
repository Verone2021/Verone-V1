-- [BO-PROD-CLEAN] Add product_id FK to sample_order_items
-- Problem: sample_order_items only has sample_description (text free),
-- no link to products table. Impossible to track which product has a sample in progress.

ALTER TABLE sample_order_items
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sample_order_items_product_id
  ON sample_order_items(product_id) WHERE product_id IS NOT NULL;

COMMENT ON COLUMN sample_order_items.product_id IS 'Optional link to the product being sampled. Enables tracking sample status per product.';

-- Migration: Remove primary_image_url columns after normalizing to product_images tables
-- Date: 2025-09-16
-- Purpose: Clean up old single image columns now that we have normalized image tables

-- Drop the primary_image_url column from products table
-- (Data has already been migrated in previous migration)
ALTER TABLE products DROP COLUMN IF EXISTS primary_image_url;

-- Drop the primary_image_url column from product_drafts table
-- (Data has already been migrated in previous migration)
ALTER TABLE product_drafts DROP COLUMN IF EXISTS primary_image_url;

-- Add comments for documentation
COMMENT ON TABLE products IS 'Product catalog with images now stored in normalized product_images table';
COMMENT ON TABLE product_drafts IS 'Product drafts with images now stored in normalized product_draft_images table';
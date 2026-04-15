-- [BO-PROD-CLEAN] Remove redundant SKU trigger
-- Problem: Two triggers generate SKU on INSERT BEFORE:
--   1. products_auto_sku_trigger → generate_product_sku() — handles empty string + NULL + special mappings
--   2. trigger_set_product_sku → trigger_generate_product_sku() → generate_product_sku(subcategory_id)
-- The first is more robust. The second is redundant (if sku IS NULL, the first already handles it).
-- PostgreSQL runs triggers alphabetically: products_auto_sku_trigger runs first, sets sku,
-- then trigger_set_product_sku sees sku is NOT NULL and does nothing. Net effect: wasted execution.

-- Drop the redundant trigger
DROP TRIGGER IF EXISTS trigger_set_product_sku ON products;

-- Drop the wrapper function (the standalone generate_product_sku(subcategory_id) overload is kept
-- because trigger_generate_product_sku depends on it, but since the trigger is gone, clean up)
DROP FUNCTION IF EXISTS trigger_generate_product_sku() CASCADE;

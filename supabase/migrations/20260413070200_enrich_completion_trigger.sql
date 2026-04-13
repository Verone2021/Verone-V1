-- [BO-PROD-CLEAN] Enrich product completion trigger with descriptions + meta
-- Problem: current trigger counts 7 fields + images (8 total) but ignores
-- description content and meta_description. A product can be "82% complete"
-- with zero editorial content. This is misleading for publication readiness.
--
-- New criteria (10 total):
-- 1. name (+10%), 2. sku (+10%), 3. description (+10%), 4. supplier (+10%),
-- 5. subcategory (+10%), 6. condition (+10%), 7. min_stock (+10%),
-- 8. images (+10%), 9. meta_description (+10%), 10. cost_price (+10%)

CREATE OR REPLACE FUNCTION calculate_product_completion_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  required_fields_count INTEGER := 9; -- 9 fields + images = 10 total
  filled_fields_count INTEGER := 0;
  has_images BOOLEAN := FALSE;
  completion_percentage INTEGER;
  new_status TEXT;
BEGIN
  -- 1. Nom produit
  IF NEW.name IS NOT NULL AND trim(NEW.name) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 2. SKU
  IF NEW.sku IS NOT NULL AND trim(NEW.sku) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 3. Description (editorial content — critical for publication)
  IF NEW.description IS NOT NULL AND trim(NEW.description) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 4. Fournisseur
  IF NEW.supplier_id IS NOT NULL THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 5. Sous-categorie
  IF NEW.subcategory_id IS NOT NULL THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 6. Condition
  IF NEW.condition IS NOT NULL AND trim(NEW.condition) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 7. Stock minimum
  IF NEW.min_stock IS NOT NULL AND NEW.min_stock >= 0 THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 8. Meta description (SEO — critical for site/Meta/Google publication)
  IF NEW.meta_description IS NOT NULL AND trim(NEW.meta_description) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 9. Cost price (needed for margin calculation)
  IF NEW.cost_price IS NOT NULL AND NEW.cost_price > 0 THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 10. Images (at least 1 required)
  SELECT EXISTS(
    SELECT 1 FROM product_images
    WHERE product_id = NEW.id
  ) INTO has_images;

  -- Calcul du pourcentage (9 fields + images = 10 criteria, each worth 10%)
  completion_percentage := ROUND((filled_fields_count + CASE WHEN has_images THEN 1 ELSE 0 END) * 100.0 / (required_fields_count + 1));

  -- Determination du statut automatique
  IF completion_percentage = 100 THEN
    new_status := 'active';
  ELSE
    new_status := 'draft';
  END IF;

  -- Mise a jour des valeurs calculees
  NEW.completion_percentage := completion_percentage;
  NEW.completion_status := new_status;

  RETURN NEW;
END;
$$;

-- Recalculate completion for ALL existing products
-- (touch each product to re-trigger the calculation)
UPDATE products SET updated_at = NOW();

-- BO-PUBLICATION-001 — Garde-fou publication + extension trigger completion
--
-- 1) CHECK constraint JSONB sur products.dimensions (règle R-JSONB de
--    .claude/rules/database.md : toute colonne JSONB doit avoir une CHECK
--    sur jsonb_typeof pour éviter les bugs « stringified object »).
-- 2) Étend la fonction calculate_product_completion_status de 10 à 12
--    critères en ajoutant `weight > 0` et `dimensions non vide`.
-- 3) Force le recalcul du score sur tous les produits existants.

-- ------------------------------------------------------------------
-- 1. CHECK constraint dimensions = object only
-- ------------------------------------------------------------------
ALTER TABLE products
  ADD CONSTRAINT products_dimensions_object_only
  CHECK (dimensions IS NULL OR jsonb_typeof(dimensions) = 'object');

-- ------------------------------------------------------------------
-- 2. Étendre la fonction calculate_product_completion_status à 12 critères
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_product_completion_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  total_fields_count INTEGER := 12;
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

  -- 3. Description
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

  -- 8. Meta description
  IF NEW.meta_description IS NOT NULL AND trim(NEW.meta_description) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 9. Cost price
  IF NEW.cost_price IS NOT NULL AND NEW.cost_price > 0 THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 10. Images
  SELECT EXISTS(
    SELECT 1 FROM product_images WHERE product_id = NEW.id
  ) INTO has_images;
  IF has_images THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 11. Weight (BO-PUBLICATION-001 — nouveau critère)
  IF NEW.weight IS NOT NULL AND NEW.weight > 0 THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 12. Dimensions (BO-PUBLICATION-001 — nouveau critère)
  IF NEW.dimensions IS NOT NULL
     AND jsonb_typeof(NEW.dimensions) = 'object'
     AND NEW.dimensions <> '{}'::jsonb THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  completion_percentage := ROUND(filled_fields_count * 100.0 / total_fields_count);

  IF completion_percentage = 100 THEN
    new_status := 'active';
  ELSE
    new_status := 'draft';
  END IF;

  NEW.completion_percentage := completion_percentage;
  NEW.completion_status := new_status;

  RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------------
-- 3. Force recalcul score sur tous les produits existants
-- ------------------------------------------------------------------
UPDATE products SET updated_at = NOW();

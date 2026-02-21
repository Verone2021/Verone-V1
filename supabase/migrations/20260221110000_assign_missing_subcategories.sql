-- Migration: Assigner les sous-catégories manquantes (Groupe C)
-- 20 produits sans subcategory_id, tous identifiés avec leur sous-catégorie correcte.
-- Toutes les sous-catégories existent déjà en base (aucune création requise).

-- Fleurs séchées (feed8c6b-2736-4b56-ad92-fc30c88a678a)
-- PRD-0026 à PRD-0038 : 13 compositions florales
UPDATE products
SET subcategory_id = 'feed8c6b-2736-4b56-ad92-fc30c88a678a'
WHERE sku IN (
  'PRD-0026', 'PRD-0027', 'PRD-0028', 'PRD-0029', 'PRD-0030',
  'PRD-0031', 'PRD-0032', 'PRD-0033', 'PRD-0034', 'PRD-0035',
  'PRD-0036', 'PRD-0037', 'PRD-0038'
)
AND subcategory_id IS NULL;

-- Plateaux & Supports (9dec49fa-1c35-453c-8354-d9c991cdf6a3)
UPDATE products
SET subcategory_id = '9dec49fa-1c35-453c-8354-d9c991cdf6a3'
WHERE sku IN ('PRD-0081', 'PRD-0082')
AND subcategory_id IS NULL;

-- Séparateur de terrasse (cloison) (b5e8f01b-c8f6-4b57-b1a5-c6cce132b089)
UPDATE products
SET subcategory_id = 'b5e8f01b-c8f6-4b57-b1a5-c6cce132b089'
WHERE sku IN ('PRD-0130', 'PRE-BW-001')
AND subcategory_id IS NULL;

-- Applique murale (30a8b695-006f-4a95-9c70-69a07054b777)
UPDATE products
SET subcategory_id = '30a8b695-006f-4a95-9c70-69a07054b777'
WHERE sku = 'PRD-0131'
AND subcategory_id IS NULL;

-- Poubelle (98e08ad2-72c8-4c54-85b9-233e33c603a1)
UPDATE products
SET subcategory_id = '98e08ad2-72c8-4c54-85b9-233e33c603a1'
WHERE sku = 'PRD-0132'
AND subcategory_id IS NULL;

-- Meuble console (6fc33476-a09e-46fc-b149-8e96ecb85579)
UPDATE products
SET subcategory_id = '6fc33476-a09e-46fc-b149-8e96ecb85579'
WHERE sku = 'PRD-0309'
AND subcategory_id IS NULL;

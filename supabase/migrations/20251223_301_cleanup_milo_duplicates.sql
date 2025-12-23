-- ============================================================================
-- Migration: Suppression des doublons Fauteuil Milo
-- Date: 2025-12-23
-- Description: Supprime les variantes Milo créées en doublon (sans images)
-- Critère: Garder ceux avec images, supprimer ceux sans images
-- ============================================================================

BEGIN;

-- Rapport avant suppression
DO $$
DECLARE
  v_total_milo INTEGER;
  v_with_images INTEGER;
  v_without_images INTEGER;
  v_in_orders INTEGER;
BEGIN
  -- Total Milo
  SELECT COUNT(*) INTO v_total_milo
  FROM products WHERE name ILIKE '%milo%';

  -- Avec images
  SELECT COUNT(*) INTO v_with_images
  FROM products p
  WHERE p.name ILIKE '%milo%'
    AND EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

  -- Sans images (doublons à supprimer)
  SELECT COUNT(*) INTO v_without_images
  FROM products p
  WHERE p.name ILIKE '%milo%'
    AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

  -- Vérifier s'ils sont dans des commandes
  SELECT COUNT(DISTINCT p.id) INTO v_in_orders
  FROM products p
  JOIN sales_order_items soi ON soi.product_id = p.id
  WHERE p.name ILIKE '%milo%'
    AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

  RAISE NOTICE '=== RAPPORT MILO ===';
  RAISE NOTICE 'Total produits Milo: %', v_total_milo;
  RAISE NOTICE 'Avec images (à garder): %', v_with_images;
  RAISE NOTICE 'Sans images (doublons): %', v_without_images;
  RAISE NOTICE 'Doublons dans commandes: %', v_in_orders;

  IF v_in_orders > 0 THEN
    RAISE WARNING 'Attention: % doublons sont référencés dans des commandes!', v_in_orders;
  END IF;
END $$;

-- Soft-delete des doublons (sans images)
-- On utilise archived_at si la colonne existe
UPDATE products
SET archived_at = NOW()
WHERE name ILIKE '%milo%'
  AND archived_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = products.id);

-- Rapport après suppression
DO $$
DECLARE
  v_remaining INTEGER;
  v_archived INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM products
  WHERE name ILIKE '%milo%' AND archived_at IS NULL;

  SELECT COUNT(*) INTO v_archived
  FROM products
  WHERE name ILIKE '%milo%' AND archived_at IS NOT NULL;

  RAISE NOTICE '=== RÉSULTAT ===';
  RAISE NOTICE 'Variantes Milo actives: %', v_remaining;
  RAISE NOTICE 'Variantes Milo archivées: %', v_archived;
END $$;

COMMIT;

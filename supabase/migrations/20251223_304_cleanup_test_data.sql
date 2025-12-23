-- ============================================================================
-- Migration: Nettoyage des données de test
-- Date: 2025-12-23
-- Description: Supprimer les produits affiliés et commandes contenant "test"
--              SAUF les produits Pokawa
-- ============================================================================

BEGIN;

-- Rapport avant nettoyage
DO $$
DECLARE
  v_test_products INTEGER;
  v_test_orders INTEGER;
BEGIN
  -- Produits affiliés "test" (excluant Pokawa)
  SELECT COUNT(*) INTO v_test_products
  FROM products
  WHERE created_by_affiliate IS NOT NULL
    AND (name ILIKE '%test%' OR sku ILIKE '%test%')
    AND name NOT ILIKE '%pokawa%';

  -- Commandes "test"
  SELECT COUNT(*) INTO v_test_orders
  FROM sales_orders
  WHERE order_number ILIKE '%test%';

  RAISE NOTICE '=== DONNÉES TEST À NETTOYER ===';
  RAISE NOTICE 'Produits affiliés test: %', v_test_products;
  RAISE NOTICE 'Commandes test: %', v_test_orders;
END $$;

-- 1. Soft-delete des produits affiliés "test" (exclure Pokawa!)
UPDATE products
SET archived_at = NOW()
WHERE created_by_affiliate IS NOT NULL
  AND (name ILIKE '%test%' OR sku ILIKE '%test%')
  AND name NOT ILIKE '%pokawa%'
  AND archived_at IS NULL;

-- 2. Annuler les commandes "test"
UPDATE sales_orders
SET status = 'cancelled'
WHERE order_number ILIKE '%test%'
  AND status NOT IN ('cancelled', 'closed');

-- Rapport après nettoyage
DO $$
DECLARE
  v_archived_products INTEGER;
  v_cancelled_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_archived_products
  FROM products
  WHERE created_by_affiliate IS NOT NULL
    AND (name ILIKE '%test%' OR sku ILIKE '%test%')
    AND name NOT ILIKE '%pokawa%'
    AND archived_at IS NOT NULL;

  SELECT COUNT(*) INTO v_cancelled_orders
  FROM sales_orders
  WHERE order_number ILIKE '%test%'
    AND status = 'cancelled';

  RAISE NOTICE '=== RÉSULTAT NETTOYAGE ===';
  RAISE NOTICE 'Produits test archivés: %', v_archived_products;
  RAISE NOTICE 'Commandes test annulées: %', v_cancelled_orders;
END $$;

COMMIT;

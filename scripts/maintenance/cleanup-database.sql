-- ============================================================================
-- Script Cleanup Database - Suppression COMPLÈTE
-- ============================================================================
-- Objectif : Supprimer TOUTES les données de test (commandes + stocks)
-- Date     : 2025-11-04
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Suppression Commandes Clients
-- ============================================================================
DELETE FROM sales_orders;

-- ============================================================================
-- 2. Suppression Commandes Fournisseurs
-- ============================================================================
DELETE FROM purchase_orders;

-- ============================================================================
-- 3. Suppression TOUS les Mouvements de Stock
-- ============================================================================
DELETE FROM stock_movements;

-- ============================================================================
-- 4. Réinitialisation Stocks Produits à ZÉRO
-- ============================================================================
UPDATE products
SET
  stock_real = 0,
  stock_quantity = 0,
  stock_forecasted_in = 0,
  stock_forecasted_out = 0,
  updated_at = NOW()
WHERE archived_at IS NULL;

-- ============================================================================
-- Vérifications Finales
-- ============================================================================
SELECT 'Cleanup Complete' AS status;

SELECT
  'sales_orders' AS table_name,
  COUNT(*) AS remaining_count
FROM sales_orders
UNION ALL
SELECT
  'purchase_orders',
  COUNT(*)
FROM purchase_orders
UNION ALL
SELECT
  'stock_movements',
  COUNT(*)
FROM stock_movements
UNION ALL
SELECT
  'products_avec_stock',
  COUNT(*)
FROM products
WHERE stock_real > 0 AND archived_at IS NULL;

COMMIT;

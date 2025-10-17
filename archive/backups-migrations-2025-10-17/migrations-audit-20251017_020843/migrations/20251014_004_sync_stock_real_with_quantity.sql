-- =============================================
-- MIGRATION 004: Synchronisation stock_real avec stock_quantity
-- Date: 2025-10-14
-- =============================================
-- Objectif: Corriger l'affichage du stock dans le formulaire de commandes
-- Problème: stock_real est NULL pour certains produits → stock affiché incorrect
-- Solution: Synchroniser stock_real avec stock_quantity pour tous les produits

\echo '========================================';
\echo 'SYNCHRONISATION: stock_real ← stock_quantity';
\echo '========================================';
\echo '';

-- Statistiques AVANT
\echo '=== AVANT: État du stock ===';
SELECT
    COUNT(*) FILTER (WHERE stock_real IS NULL) as stock_real_null_count,
    COUNT(*) FILTER (WHERE stock_real = 0 AND stock_quantity > 0) as stock_real_zero_but_quantity_exists,
    COUNT(*) FILTER (WHERE stock_real > 0) as stock_real_populated,
    COUNT(*) as total_products
FROM products
WHERE archived_at IS NULL;

\echo '';
\echo '=== Synchronisation stock_real avec stock_quantity ===';

-- Synchroniser tous les produits où stock_real est NULL ou 0 alors que stock_quantity existe
UPDATE products
SET
    stock_real = COALESCE(stock_quantity, 0),
    updated_at = NOW()
WHERE archived_at IS NULL
  AND (
    stock_real IS NULL
    OR (stock_real = 0 AND stock_quantity > 0)
  );

\echo '✅ Synchronisation effectuée';

-- Statistiques APRÈS
\echo '';
\echo '=== APRÈS: État du stock ===';
SELECT
    COUNT(*) FILTER (WHERE stock_real IS NULL) as stock_real_null_count,
    COUNT(*) FILTER (WHERE stock_real = 0 AND stock_quantity > 0) as stock_real_zero_but_quantity_exists,
    COUNT(*) FILTER (WHERE stock_real > 0) as stock_real_populated,
    COUNT(*) as total_products
FROM products
WHERE archived_at IS NULL;

\echo '';
\echo '=== Exemples de produits synchronisés ===';
SELECT
    sku,
    name,
    stock_quantity,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out
FROM products
WHERE archived_at IS NULL
  AND stock_real > 0
ORDER BY created_at DESC
LIMIT 5;

\echo '';
\echo '========================================';
\echo 'Migration 004 terminée avec succès';
\echo 'Stock réel synchronisé avec stock quantity';
\echo '========================================';

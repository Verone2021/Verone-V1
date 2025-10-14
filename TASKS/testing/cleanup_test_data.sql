-- =============================================
-- SCRIPT: Nettoyage Données Test
-- Date: 2025-10-13
-- Objectif: Supprimer TOUTES données test pour repartir proprement
-- =============================================

\echo '========================================'
\echo 'PHASE 1: NETTOYAGE DONNÉES TEST'
\echo '========================================'
\echo ''

-- =============================================
-- ÉTAPE 1: État AVANT nettoyage
-- =============================================

\echo '=== ÉTAT AVANT NETTOYAGE ==='
\echo ''

SELECT 'Stock Movements:' as table_name, COUNT(*) as count FROM stock_movements
UNION ALL
SELECT 'Purchase Order Items:', COUNT(*) FROM purchase_order_items
UNION ALL
SELECT 'Purchase Orders:', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Sales Order Items:', COUNT(*) FROM sales_order_items
UNION ALL
SELECT 'Sales Orders:', COUNT(*) FROM sales_orders;

\echo ''
\echo '=== STOCKS PRODUITS AVANT ==='
SELECT
  name,
  stock_real,
  stock_quantity,
  stock_forecasted_in,
  stock_forecasted_out
FROM products
WHERE name LIKE 'Fauteuil Milo%'
ORDER BY name;

\echo ''
\echo '========================================'
\echo 'SUPPRESSION EN COURS...'
\echo '========================================'
\echo ''

-- =============================================
-- ÉTAPE 2: Suppression (ordre inverse dépendances)
-- =============================================

-- 1. Mouvements stock (aucune dépendance)
\echo '1. Suppression stock_movements...'
DELETE FROM stock_movements WHERE created_at > '2025-01-01';
SELECT COUNT(*) || ' mouvements supprimés' as result FROM stock_movements WHERE FALSE;

\echo ''

-- 2. Sales Order Items (dépend de sales_orders)
\echo '2. Suppression sales_order_items...'
DELETE FROM sales_order_items WHERE created_at > '2025-01-01';

\echo ''

-- 3. Sales Orders
\echo '3. Suppression sales_orders...'
DELETE FROM sales_orders WHERE created_at > '2025-01-01';

\echo ''

-- 4. Purchase Order Items (dépend de purchase_orders)
\echo '4. Suppression purchase_order_items...'
DELETE FROM purchase_order_items WHERE created_at > '2025-01-01';

\echo ''

-- 5. Purchase Orders
\echo '5. Suppression purchase_orders...'
DELETE FROM purchase_orders WHERE created_at > '2025-01-01';

\echo ''

-- 6. Notifications liées (si existent)
\echo '6. Suppression notifications...'
DELETE FROM notifications WHERE created_at > '2025-01-01';

\echo ''

-- =============================================
-- ÉTAPE 3: Remise à zéro stocks produits test
-- =============================================

\echo '7. Remise à zéro stocks produits Milo...'
UPDATE products
SET
  stock_real = 0,
  stock_quantity = 0,
  stock_forecasted_in = 0,
  stock_forecasted_out = 0,
  updated_at = NOW()
WHERE name LIKE 'Fauteuil Milo%';

SELECT COUNT(*) || ' produits mis à jour' as result
FROM products
WHERE name LIKE 'Fauteuil Milo%';

\echo ''
\echo '========================================'
\echo 'VALIDATION NETTOYAGE'
\echo '========================================'
\echo ''

-- =============================================
-- ÉTAPE 4: Validation APRÈS nettoyage
-- =============================================

\echo '=== COMPTEURS APRÈS NETTOYAGE ==='
SELECT 'Stock Movements:' as table_name, COUNT(*) as count FROM stock_movements
UNION ALL
SELECT 'Purchase Order Items:', COUNT(*) FROM purchase_order_items
UNION ALL
SELECT 'Purchase Orders:', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Sales Order Items:', COUNT(*) FROM sales_order_items
UNION ALL
SELECT 'Sales Orders:', COUNT(*) FROM sales_orders;

\echo ''
\echo '=== STOCKS PRODUITS APRÈS (doivent être 0) ==='
SELECT
  name,
  stock_real,
  stock_quantity,
  stock_forecasted_in,
  stock_forecasted_out
FROM products
WHERE name LIKE 'Fauteuil Milo%'
ORDER BY name;

\echo ''

-- =============================================
-- ÉTAPE 5: Validation stricte
-- =============================================

\echo '=== VALIDATION STRICTE ==='

DO $$
DECLARE
  v_movements_count INTEGER;
  v_po_count INTEGER;
  v_so_count INTEGER;
  v_stock_non_zero INTEGER;
BEGIN
  -- Compter mouvements restants
  SELECT COUNT(*) INTO v_movements_count FROM stock_movements;

  -- Compter commandes restantes
  SELECT COUNT(*) INTO v_po_count FROM purchase_orders;
  SELECT COUNT(*) INTO v_so_count FROM sales_orders;

  -- Compter produits Milo avec stock non nul
  SELECT COUNT(*) INTO v_stock_non_zero
  FROM products
  WHERE name LIKE 'Fauteuil Milo%'
    AND (stock_real != 0 OR stock_quantity != 0
         OR stock_forecasted_in != 0 OR stock_forecasted_out != 0);

  -- Afficher résultats
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSULTATS VALIDATION:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Mouvements restants: %', v_movements_count;
  RAISE NOTICE 'Purchase Orders restants: %', v_po_count;
  RAISE NOTICE 'Sales Orders restants: %', v_so_count;
  RAISE NOTICE 'Produits Milo avec stock non-zéro: %', v_stock_non_zero;
  RAISE NOTICE '';

  -- Validation
  IF v_movements_count = 0 AND v_po_count = 0 AND v_so_count = 0 AND v_stock_non_zero = 0 THEN
    RAISE NOTICE '✅ NETTOYAGE RÉUSSI - Toutes données test supprimées';
    RAISE NOTICE '✅ Tous stocks produits Milo remis à 0';
  ELSE
    RAISE WARNING '⚠️ ATTENTION: Certaines données restent';
    IF v_movements_count > 0 THEN
      RAISE WARNING '  - % mouvements restants', v_movements_count;
    END IF;
    IF v_po_count > 0 OR v_so_count > 0 THEN
      RAISE WARNING '  - % PO + % SO restants', v_po_count, v_so_count;
    END IF;
    IF v_stock_non_zero > 0 THEN
      RAISE WARNING '  - % produits Milo ont encore du stock', v_stock_non_zero;
    END IF;
  END IF;
  RAISE NOTICE '========================================';
END $$;

\echo ''
\echo '✅ Script cleanup_test_data.sql terminé'
\echo ''

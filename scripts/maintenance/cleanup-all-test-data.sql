-- =============================================
-- CLEANUP ALL TEST DATA - RESET COMPLET
-- =============================================
-- Supprime toutes les commandes, mouvements et réservations
-- Conserve les produits mais reset stock à zéro
-- Usage: Exécuter avant tests manuels pour état vierge
-- =============================================

BEGIN;

-- ============================================
-- ÉTAPE 1: Supprimer les items de commandes (enfants en premier)
-- ============================================
DELETE FROM sales_order_items;
DELETE FROM purchase_order_items;

-- ============================================
-- ÉTAPE 2: Supprimer les commandes principales
-- ============================================
DELETE FROM sales_orders;
DELETE FROM purchase_orders;

-- ============================================
-- ÉTAPE 3: Supprimer les réservations stock
-- ============================================
DELETE FROM stock_reservations;

-- ============================================
-- ÉTAPE 4: Supprimer les mouvements stock
-- ============================================
DELETE FROM stock_movements;

-- ============================================
-- ÉTAPE 5: Reset les séquences de numéros de commandes
-- ============================================
-- Reset compteur séquences pour commencer à 1
ALTER SEQUENCE IF EXISTS sales_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stock_movements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stock_reservations_id_seq RESTART WITH 1;

-- ============================================
-- ÉTAPE 6: Reset les stocks produits à zéro
-- ============================================
UPDATE products SET
  stock_quantity = 0,
  stock_real = 0,
  stock_forecasted_in = 0,
  stock_forecasted_out = 0
WHERE archived_at IS NULL;

-- ============================================
-- VÉRIFICATION: Compter les enregistrements restants
-- ============================================
DO $$
DECLARE
  so_count INT;
  po_count INT;
  sm_count INT;
  sr_count INT;
  products_with_stock INT;
BEGIN
  SELECT COUNT(*) INTO so_count FROM sales_orders;
  SELECT COUNT(*) INTO po_count FROM purchase_orders;
  SELECT COUNT(*) INTO sm_count FROM stock_movements;
  SELECT COUNT(*) INTO sr_count FROM stock_reservations;
  SELECT COUNT(*) INTO products_with_stock FROM products WHERE stock_real > 0 OR stock_quantity > 0;

  RAISE NOTICE '=== RÉSULTAT CLEANUP ===';
  RAISE NOTICE 'Commandes clients restantes: %', so_count;
  RAISE NOTICE 'Commandes fournisseurs restantes: %', po_count;
  RAISE NOTICE 'Mouvements stock restants: %', sm_count;
  RAISE NOTICE 'Réservations restantes: %', sr_count;
  RAISE NOTICE 'Produits avec stock > 0: %', products_with_stock;
  RAISE NOTICE '========================';

  -- Validation: Tous les compteurs doivent être à zéro
  IF so_count > 0 OR po_count > 0 OR sm_count > 0 OR sr_count > 0 OR products_with_stock > 0 THEN
    RAISE WARNING 'ATTENTION: Certaines données n''ont pas été supprimées complètement!';
  ELSE
    RAISE NOTICE 'SUCCESS: Toutes les données de test ont été supprimées.';
  END IF;
END $$;

COMMIT;

-- ============================================
-- POST-CLEANUP: Vérifier l'intégrité de la base
-- ============================================
SELECT
  'sales_orders' AS table_name,
  COUNT(*) AS count
FROM sales_orders
UNION ALL
SELECT
  'purchase_orders' AS table_name,
  COUNT(*) AS count
FROM purchase_orders
UNION ALL
SELECT
  'stock_movements' AS table_name,
  COUNT(*) AS count
FROM stock_movements
UNION ALL
SELECT
  'stock_reservations' AS table_name,
  COUNT(*) AS count
FROM stock_reservations
UNION ALL
SELECT
  'products (stock > 0)' AS table_name,
  COUNT(*) AS count
FROM products
WHERE stock_real > 0 OR stock_quantity > 0 OR stock_forecasted_in > 0 OR stock_forecasted_out < 0;

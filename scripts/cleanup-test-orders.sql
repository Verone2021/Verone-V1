-- ============================================================================
-- 🧹 Script Cleanup Database - Suppression Données Test
-- ============================================================================
-- Objectif : Supprimer toutes les commandes clients/fournisseurs de test
--            pour permettre tests manuels avec base de données propre
-- Date     : 2025-11-04
-- Phase    : Phase 3.8 - Préparation tests workflow complet
-- ============================================================================

-- AVERTISSEMENT : Ce script supprime TOUTES les commandes et données associées
-- Exécuter uniquement en environnement de développement/test

BEGIN;

-- ============================================================================
-- 1. Suppression Commandes Clients (Sales Orders)
-- ============================================================================
-- Suppression CASCADE automatique de :
-- - sales_order_items
-- - shipments → shipping_parcels → parcel_items
-- - stock_movements liés (via trigger automatique)
-- - invoices liés (via trigger automatique)

DELETE FROM sales_orders;

-- Vérification
SELECT COUNT(*) AS remaining_sales_orders FROM sales_orders;

-- ============================================================================
-- 2. Suppression Commandes Fournisseurs (Purchase Orders)
-- ============================================================================
-- Suppression CASCADE automatique de :
-- - purchase_order_items
-- - stock_movements liés (via trigger automatique)
-- - purchase_bills liés (via trigger automatique)

DELETE FROM purchase_orders;

-- Vérification
SELECT COUNT(*) AS remaining_purchase_orders FROM purchase_orders;

-- ============================================================================
-- 3. Réinitialisation Stocks (OPTIONNEL)
-- ============================================================================
-- Décommenter si vous souhaitez réinitialiser TOUS les stocks à 0
-- ATTENTION : Cela affecte TOUS les produits

-- UPDATE products
-- SET
--   stock_real = 0,
--   stock_forecasted_in = 0,
--   stock_forecasted_out = 0,
--   updated_at = NOW()
-- WHERE organisation_id = 'YOUR_ORG_ID';

-- Vérification
-- SELECT
--   COUNT(*) AS total_products,
--   SUM(stock_real) AS total_stock_real,
--   SUM(stock_forecasted_in) AS total_forecasted_in,
--   SUM(stock_forecasted_out) AS total_forecasted_out
-- FROM products
-- WHERE archived_at IS NULL;

-- ============================================================================
-- 4. Cleanup Stock Movements Orphelins (OPTIONNEL)
-- ============================================================================
-- Supprimer mouvements stock non liés à commandes (si nécessaire)
-- Décommenter si besoin

-- DELETE FROM stock_movements
-- WHERE reference_type IN ('purchase_order', 'sales_order', 'shipment')
-- AND (
--   (reference_type = 'purchase_order' AND NOT EXISTS (
--     SELECT 1 FROM purchase_orders WHERE id::text = reference_id
--   ))
--   OR
--   (reference_type = 'sales_order' AND NOT EXISTS (
--     SELECT 1 FROM sales_orders WHERE id::text = reference_id
--   ))
--   OR
--   (reference_type = 'shipment' AND NOT EXISTS (
--     SELECT 1 FROM shipments WHERE id::text = reference_id
--   ))
-- );

-- ============================================================================
-- 5. Reset Séquences (OPTIONNEL)
-- ============================================================================
-- Réinitialiser compteurs de numéros de commandes
-- Décommenter si vous souhaitez recommencer à partir de 1

-- SELECT setval('sales_orders_order_number_seq', 1, false);
-- SELECT setval('purchase_orders_po_number_seq', 1, false);

-- ============================================================================
-- Commit Transaction
-- ============================================================================
-- Si tout est OK, commit. Sinon ROLLBACK manuel.

COMMIT;

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
  'purchase_orders' AS table_name,
  COUNT(*) AS remaining_count
FROM purchase_orders
UNION ALL
SELECT
  'sales_order_items' AS table_name,
  COUNT(*) AS remaining_count
FROM sales_order_items
UNION ALL
SELECT
  'purchase_order_items' AS table_name,
  COUNT(*) AS remaining_count
FROM purchase_order_items
UNION ALL
SELECT
  'shipments' AS table_name,
  COUNT(*) AS remaining_count
FROM shipments
UNION ALL
SELECT
  'stock_movements (orders)' AS table_name,
  COUNT(*) AS remaining_count
FROM stock_movements
WHERE reference_type IN ('purchase_order', 'sales_order', 'shipment');

-- ============================================================================
-- Notes d'Exécution
-- ============================================================================
-- Pour exécuter ce script :
--
-- Option 1 : Via psql (ligne de commande)
-- PGPASSWORD="YOUR_PASSWORD" psql -h HOST -p 5432 -U USER -d DATABASE -f scripts/cleanup-test-orders.sql
--
-- Option 2 : Via Supabase Dashboard
-- Copier/coller le contenu dans SQL Editor
--
-- Option 3 : Via code (MCP Supabase)
-- Read script et execute via mcp__supabase__execute_sql
--
-- ============================================================================

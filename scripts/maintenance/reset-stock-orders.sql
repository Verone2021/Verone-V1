-- ============================================================
-- SCRIPT DE RÉINITIALISATION STOCK & COMMANDES
-- NE TOUCHE PAS : produits, organisations, clients, etc.
-- ============================================================

BEGIN;

-- 1. Supprimer les mouvements de stock
TRUNCATE TABLE stock_movements CASCADE;

-- 2. Réinitialiser le stock produits
UPDATE products SET
  available_stock = 0,
  reserved_stock = 0,
  total_stock = 0;

-- 3. Supprimer les réservations de stock
TRUNCATE TABLE stock_reservations CASCADE;

-- 4. Supprimer les lignes de commandes clients
TRUNCATE TABLE sales_order_items CASCADE;

-- 5. Supprimer les commandes clients
TRUNCATE TABLE sales_orders CASCADE;

-- 6. Supprimer les lignes de commandes fournisseurs
TRUNCATE TABLE purchase_order_items CASCADE;

-- 7. Supprimer les commandes fournisseurs
TRUNCATE TABLE purchase_orders CASCADE;

-- 8. Supprimer les inventaires
TRUNCATE TABLE inventory_sessions CASCADE;
TRUNCATE TABLE inventory_items CASCADE;

COMMIT;

-- Note: Les alertes de stock minimum s'afficheront (comportement normal)
-- Exécution: supabase db execute --file scripts/reset-stock-orders.sql

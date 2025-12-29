-- ============================================================================
-- Migration: Backup avant nettoyage Pokawa/Milo
-- Date: 2025-12-23
-- Description: Sauvegarde des données avant modifications (doublons Milo, Pokawa affilié)
-- ============================================================================

-- Backup des produits Milo et Pokawa
CREATE TABLE IF NOT EXISTS _backup_products_20251223 AS
SELECT * FROM products
WHERE name ILIKE '%milo%' OR name ILIKE '%pokawa%';

-- Backup des lignes de commande pour produits Pokawa
CREATE TABLE IF NOT EXISTS _backup_sales_order_items_20251223 AS
SELECT soi.*
FROM sales_order_items soi
JOIN products p ON p.id = soi.product_id
WHERE p.name ILIKE '%pokawa%';

-- Backup des commissions LinkMe existantes
CREATE TABLE IF NOT EXISTS _backup_linkme_commissions_20251223 AS
SELECT * FROM linkme_commissions;

-- Log du backup
DO $$
DECLARE
  v_products_count INTEGER;
  v_order_items_count INTEGER;
  v_commissions_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_products_count FROM _backup_products_20251223;
  SELECT COUNT(*) INTO v_order_items_count FROM _backup_sales_order_items_20251223;
  SELECT COUNT(*) INTO v_commissions_count FROM _backup_linkme_commissions_20251223;

  RAISE NOTICE 'Backup créé: % produits, % lignes commande, % commissions',
    v_products_count, v_order_items_count, v_commissions_count;
END $$;

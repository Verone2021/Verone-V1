-- ========================================================================
-- NETTOYAGE COMPLET BASE DE DONNÉES VÉRONE
-- ========================================================================
-- Date : 2025-11-16
-- Objectif : Supprimer toutes commandes, stock, consultations pour tests
-- Conserve : Produits, variantes, collections, catégories, clients
-- ========================================================================

BEGIN;

-- ========================================================================
-- ÉTAPE 1 : VÉRIFICATIONS PRÉALABLES
-- ========================================================================

DO $$
DECLARE
  v_sales_orders_count INTEGER;
  v_purchase_orders_count INTEGER;
  v_stock_movements_count INTEGER;
  v_consultations_count INTEGER;
BEGIN
  -- Compter les données actuelles
  SELECT COUNT(*) INTO v_sales_orders_count FROM sales_orders;
  SELECT COUNT(*) INTO v_purchase_orders_count FROM purchase_orders;
  SELECT COUNT(*) INTO v_stock_movements_count FROM stock_movements;
  SELECT COUNT(*) INTO v_consultations_count FROM client_consultations;

  RAISE NOTICE '=== ÉTAT INITIAL DATABASE ===';
  RAISE NOTICE 'Commandes clients : %', v_sales_orders_count;
  RAISE NOTICE 'Commandes fournisseurs : %', v_purchase_orders_count;
  RAISE NOTICE 'Mouvements stock : %', v_stock_movements_count;
  RAISE NOTICE 'Consultations : %', v_consultations_count;
  RAISE NOTICE '================================';
END $$;

-- ========================================================================
-- ÉTAPE 2 : SUPPRESSION DONNÉES (ORDRE RESPECTANT FK)
-- ========================================================================

-- --------------------
-- 2.1 Facturation & Paiements
-- --------------------
DO $$ BEGIN RAISE NOTICE '>>> Suppression facturation...'; END $$;

DELETE FROM financial_payments;
DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM financial_document_lines;
DELETE FROM financial_documents;

-- --------------------
-- 2.2 Commandes Clients
-- --------------------
DO $$ BEGIN RAISE NOTICE '>>> Suppression commandes clients...'; END $$;

-- Supprimer expéditions (enfants de sales_orders)
DELETE FROM parcel_items;
DELETE FROM shipping_parcels;
DELETE FROM shipments;

-- Supprimer lignes puis commandes
DELETE FROM sales_order_items;
DELETE FROM sales_orders;

-- --------------------
-- 2.3 Commandes Fournisseurs
-- --------------------
DO $$ BEGIN RAISE NOTICE '>>> Suppression commandes fournisseurs...'; END $$;

-- Supprimer échantillons
DELETE FROM sample_order_items;
DELETE FROM sample_orders;

-- Supprimer réceptions puis lignes puis commandes
DELETE FROM purchase_order_receptions;
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;

-- --------------------
-- 2.4 Stock
-- --------------------
DO $$ BEGIN RAISE NOTICE '>>> Suppression stock...'; END $$;

DELETE FROM stock_movements;
DELETE FROM stock_reservations;

-- Supprimer alertes stock si table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_alert_tracking') THEN
    DELETE FROM stock_alert_tracking;
    RAISE NOTICE '    stock_alert_tracking supprimée';
  END IF;
END $$;

-- --------------------
-- 2.5 Consultations
-- --------------------
DO $$ BEGIN RAISE NOTICE '>>> Suppression consultations...'; END $$;

DELETE FROM consultation_products;
DELETE FROM consultation_images;
DELETE FROM client_consultations;

-- ========================================================================
-- ÉTAPE 3 : RÉINITIALISATION COLONNES STOCK PRODUITS
-- ========================================================================

DO $$ BEGIN RAISE NOTICE '>>> Réinitialisation stock produits...'; END $$;

UPDATE products
SET
  stock_quantity = 0,
  stock_real = 0,
  stock_forecasted_in = 0,
  stock_forecasted_out = 0,
  updated_at = now()
WHERE
  stock_quantity != 0
  OR stock_real != 0
  OR stock_forecasted_in != 0
  OR stock_forecasted_out != 0;

-- ========================================================================
-- ÉTAPE 4 : VALIDATION POST-NETTOYAGE
-- ========================================================================

DO $$
DECLARE
  v_sales_orders_after INTEGER;
  v_purchase_orders_after INTEGER;
  v_stock_movements_after INTEGER;
  v_consultations_after INTEGER;
  v_shipments_after INTEGER;
  v_invoices_after INTEGER;
  v_products_nonzero_stock INTEGER;
  v_validation_ok BOOLEAN := TRUE;
BEGIN
  -- Vérifier que tout est à zéro
  SELECT COUNT(*) INTO v_sales_orders_after FROM sales_orders;
  SELECT COUNT(*) INTO v_purchase_orders_after FROM purchase_orders;
  SELECT COUNT(*) INTO v_stock_movements_after FROM stock_movements;
  SELECT COUNT(*) INTO v_consultations_after FROM client_consultations;
  SELECT COUNT(*) INTO v_shipments_after FROM shipments;
  SELECT COUNT(*) INTO v_invoices_after FROM invoices;

  -- Vérifier stock produits
  SELECT COUNT(*) INTO v_products_nonzero_stock
  FROM products
  WHERE stock_quantity != 0
    OR stock_real != 0
    OR stock_forecasted_in != 0
    OR stock_forecasted_out != 0;

  RAISE NOTICE '';
  RAISE NOTICE '=== VALIDATION NETTOYAGE ===';
  RAISE NOTICE 'Commandes clients : % (attendu: 0)', v_sales_orders_after;
  RAISE NOTICE 'Commandes fournisseurs : % (attendu: 0)', v_purchase_orders_after;
  RAISE NOTICE 'Mouvements stock : % (attendu: 0)', v_stock_movements_after;
  RAISE NOTICE 'Consultations : % (attendu: 0)', v_consultations_after;
  RAISE NOTICE 'Expéditions : % (attendu: 0)', v_shipments_after;
  RAISE NOTICE 'Factures : % (attendu: 0)', v_invoices_after;
  RAISE NOTICE 'Produits stock non-zéro : % (attendu: 0)', v_products_nonzero_stock;
  RAISE NOTICE '============================';

  -- Validation stricte
  IF v_sales_orders_after != 0
    OR v_purchase_orders_after != 0
    OR v_stock_movements_after != 0
    OR v_consultations_after != 0
    OR v_shipments_after != 0
    OR v_invoices_after != 0
    OR v_products_nonzero_stock != 0 THEN

    v_validation_ok := FALSE;
    RAISE EXCEPTION 'Validation échouée : Certaines tables ne sont pas vides !';
  END IF;

  IF v_validation_ok THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ VALIDATION RÉUSSIE - TOUTES LES TABLES SONT VIDES';
    RAISE NOTICE '✅ Stock produits réinitialisé à zéro';
  END IF;
END $$;

-- ========================================================================
-- ÉTAPE 5 : DONNÉES CONSERVÉES (VÉRIFICATION)
-- ========================================================================

DO $$
DECLARE
  v_products_count INTEGER;
  v_organisations_count INTEGER;
  v_categories_count INTEGER;
  v_collections_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_products_count FROM products;
  SELECT COUNT(*) INTO v_organisations_count FROM organisations;
  SELECT COUNT(*) INTO v_categories_count FROM categories;
  SELECT COUNT(*) INTO v_collections_count FROM collections;

  RAISE NOTICE '';
  RAISE NOTICE '=== DONNÉES CONSERVÉES ===';
  RAISE NOTICE 'Produits : %', v_products_count;
  RAISE NOTICE 'Organisations : %', v_organisations_count;
  RAISE NOTICE 'Catégories : %', v_categories_count;
  RAISE NOTICE 'Collections : %', v_collections_count;
  RAISE NOTICE '==========================';
END $$;

-- ========================================================================
-- FIN TRANSACTION
-- ========================================================================

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 NETTOYAGE COMPLET TERMINÉ AVEC SUCCÈS';
  RAISE NOTICE 'La base de données est prête pour de nouveaux tests';
END $$;

-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 1.2 : Validation Libération Forecasted à l'Expédition
-- Migration: 20251113_002_fix_sales_order_release_forecasted_on_shipment.sql
-- Date: 2025-11-13
-- ═══════════════════════════════════════════════════

\echo '🧪 DÉBUT TESTS ÉTAPE 1.2 - Libération Forecasted à l''Expédition'
\echo ''

BEGIN;

-- ═══════════════════════════════════════════════════
-- SETUP : Récupérer supplier et créer customer
-- ═══════════════════════════════════════════════════

DO $$
DECLARE
  v_supplier_id uuid;
  v_customer_id uuid;
BEGIN
  -- Récupérer premier fournisseur existant
  SELECT id INTO v_supplier_id
  FROM organisations
  WHERE type = 'supplier'
  LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Aucun fournisseur trouvé. Créer un fournisseur d''abord.';
  END IF;

  -- Créer customer test
  INSERT INTO organisations (
    id, legal_name, type, is_active
  ) VALUES (
    '10000000-0000-0000-0000-000000000001', 'Customer Test E12', 'customer', true
  );

  RAISE NOTICE 'Fournisseur utilisé: %', v_supplier_id;
  RAISE NOTICE 'Customer créé: 10000000-0000-0000-0000-000000000001';
END $$;

-- ═══════════════════════════════════════════════════
-- TEST 1 : Commande confirmée → forecasted_out décrémenté
-- ═══════════════════════════════════════════════════

\echo 'TEST 1 : Commande confirmée → forecasted_out décrémenté'

-- SETUP : Créer produit avec stock initial
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '20000000-0000-0000-0000-000000000001', 'TEST-001-E12', 'Produit Test 1 Étape 1.2', 10,
  50, 0, 0,  -- Stock initial : real=50, forecasted_out=0
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer commande client
INSERT INTO sales_orders (
  id, order_number, customer_id, status, customer_type, total_ht, total_ttc, created_by
) VALUES (
  '30000000-0000-0000-0000-000000000001', 'SO-TEST-E12-001', '10000000-0000-0000-0000-000000000001', 'draft', 'organization', 1000, 1200, (SELECT id FROM auth.users LIMIT 1)
);

-- Ajouter item commande
INSERT INTO sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 10, 100
);

-- Confirmer commande
UPDATE sales_orders SET
  status = 'confirmed',
  confirmed_by = (SELECT id FROM auth.users LIMIT 1),
  confirmed_at = NOW()
WHERE id = '30000000-0000-0000-0000-000000000001';

-- VÉRIFICATION : forecasted_out décrémenté
SELECT
  'TEST 1 : forecasted_out décrémenté' AS test,
  CASE
    WHEN stock_forecasted_out = -10 THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_out = ' || stock_forecasted_out::text || ' (attendu: -10)'
  END AS resultat
FROM products
WHERE id = '20000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 2 : Expédition → stock_real décrémenté
-- ═══════════════════════════════════════════════════

\echo 'TEST 2 : Expédition → stock_real décrémenté'

-- ACTION : Marquer expédition
UPDATE sales_orders SET
  warehouse_exit_at = NOW()
WHERE id = '30000000-0000-0000-0000-000000000001';

-- VÉRIFICATION : stock_real décrémenté
SELECT
  'TEST 2 : stock_real décrémenté' AS test,
  CASE
    WHEN stock_real = 40 THEN '✅ PASS'
    ELSE '❌ FAIL - stock_real = ' || stock_real::text || ' (attendu: 40)'
  END AS resultat
FROM products
WHERE id = '20000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 3 : Expédition → forecasted_out libéré (0)
-- ═══════════════════════════════════════════════════

\echo 'TEST 3 : Expédition → forecasted_out libéré (revenu à 0)'

-- VÉRIFICATION : forecasted_out revenu à 0
SELECT
  'TEST 3 : forecasted_out libéré' AS test,
  CASE
    WHEN stock_forecasted_out = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_out = ' || stock_forecasted_out::text || ' (attendu: 0)'
  END AS resultat
FROM products
WHERE id = '20000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 4 : Mouvement IN créé avec affects_forecast=true
-- ═══════════════════════════════════════════════════

\echo 'TEST 4 : Mouvement IN de libération créé correctement'

-- VÉRIFICATION : Mouvement IN existe avec bons attributs
SELECT
  'TEST 4 : Mouvement IN libération' AS test,
  CASE
    WHEN COUNT(*) = 1 AND
         MIN(movement_type) = 'IN' AND
         MIN(affects_forecast::text) = 'true' AND
         MIN(forecast_type) = 'out' AND
         MIN(reason_code) = 'sale'
    THEN '✅ PASS'
    ELSE '❌ FAIL - Mouvement libération incorrect (count=' || COUNT(*)::text || ', type=' || COALESCE(MIN(movement_type), 'NULL') || ', forecast=' || COALESCE(MIN(forecast_type), 'NULL') || ', reason=' || COALESCE(MIN(reason_code), 'NULL') || ')'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = '30000000-0000-0000-0000-000000000001'
  AND product_id = '20000000-0000-0000-0000-000000000001'
  AND affects_forecast = true
  AND movement_type = 'IN';

-- ═══════════════════════════════════════════════════
-- TEST 5 : Multiple items - forecasted_out libéré pour tous
-- ═══════════════════════════════════════════════════

\echo 'TEST 5 : Multiple items - forecasted_out libéré pour tous produits'

-- SETUP : Créer 2 produits avec stock
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '20000000-0000-0000-0000-000000000002', 'TEST-002-E12', 'Produit Test 2 Étape 1.2', 5,
  30, 0, 0,
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
),
(
  '20000000-0000-0000-0000-000000000003', 'TEST-003-E12', 'Produit Test 3 Étape 1.2', 5,
  20, 0, 0,
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer commande avec 2 items
INSERT INTO sales_orders (
  id, order_number, customer_id, status, customer_type, total_ht, total_ttc, created_by,
  confirmed_by, confirmed_at, warehouse_exit_at
) VALUES (
  '30000000-0000-0000-0000-000000000002', 'SO-TEST-E12-002', '10000000-0000-0000-0000-000000000001', 'confirmed', 'organization', 1500, 1800, (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1), NOW(), NOW()
);

INSERT INTO sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 5, 100
),
(
  '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 10, 100
);

-- VÉRIFICATION : forecasted_out libéré pour les 2 produits
SELECT
  'TEST 5 : Multiple items libérés' AS test,
  CASE
    WHEN COUNT(*) = 2 AND MIN(stock_forecasted_out) = 0 AND MAX(stock_forecasted_out) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_out non libéré pour tous (count=' || COUNT(*)::text || ')'
  END AS resultat
FROM products
WHERE id IN ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003');

-- ═══════════════════════════════════════════════════
-- TEST 6 : quantity_after cohérent (pas négatif)
-- ═══════════════════════════════════════════════════

\echo 'TEST 6 : quantity_after cohérent (contrainte CHECK respectée)'

-- VÉRIFICATION : Aucun mouvement avec quantity_after négatif
SELECT
  'TEST 6 : quantity_after >= 0' AS test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' mouvements avec quantity_after < 0 trouvés'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002')
  AND quantity_after < 0;

-- ═══════════════════════════════════════════════════
-- TEST 7 : Régression - Dévalidation fonctionne toujours
-- ═══════════════════════════════════════════════════

\echo 'TEST 7 : Régression - Dévalidation libère toujours forecasted_out'

-- SETUP : Créer produit et commande
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '20000000-0000-0000-0000-000000000004', 'TEST-004-E12', 'Produit Test 4 Étape 1.2', 5,
  25, 0, 0,
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

INSERT INTO sales_orders (
  id, order_number, customer_id, status, customer_type, total_ht, total_ttc, created_by
) VALUES (
  '30000000-0000-0000-0000-000000000003', 'SO-TEST-E12-003', '10000000-0000-0000-0000-000000000001', 'draft', 'organization', 500, 600, (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 5, 100
);

-- Confirmer puis dévalider
UPDATE sales_orders SET
  status = 'confirmed',
  confirmed_by = (SELECT id FROM auth.users LIMIT 1),
  confirmed_at = NOW()
WHERE id = '30000000-0000-0000-0000-000000000003';

UPDATE sales_orders SET
  status = 'draft'
WHERE id = '30000000-0000-0000-0000-000000000003';

-- VÉRIFICATION : forecasted_out revenu à 0 après dévalidation
SELECT
  'TEST 7 : Régression dévalidation' AS test,
  CASE
    WHEN stock_forecasted_out = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_out = ' || stock_forecasted_out::text || ' (attendu: 0)'
  END AS resultat
FROM products
WHERE id = '20000000-0000-0000-0000-000000000004';

-- ═══════════════════════════════════════════════════
-- CLEANUP : Supprimer données test
-- ═══════════════════════════════════════════════════

\echo ''
\echo '🧹 Nettoyage données test...'

DELETE FROM sales_order_items WHERE id IN ('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004');
DELETE FROM sales_orders WHERE id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003');
DELETE FROM stock_movements WHERE reference_type = 'sales_order' AND reference_id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003');
DELETE FROM products WHERE id IN ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004');
DELETE FROM organisations WHERE id = '10000000-0000-0000-0000-000000000001';

ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSUMÉ ATTENDU
-- ═══════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════'
\echo 'RÉSULTAT ATTENDU : 7 tests ✅ PASS'
\echo '═══════════════════════════════════════════════════'
\echo ''
\echo 'Si tous les tests passent, la correction Bug #2 est validée ✅'
\echo ''

-- ═══════════════════════════════════════════════════
-- TEST BUG #5 : Validation Modification Quantity Items Confirmés
-- Migrations: 20251114_001 & 20251114_002
-- Date: 2025-11-14
-- ═══════════════════════════════════════════════════

\echo '🧪 DÉBUT TESTS BUG #5 - Modification Quantity et Stock Prévisionnel'
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
    '11000000-0000-0000-0000-000000000001', 'Customer Test Bug5', 'customer', true
  );

  RAISE NOTICE 'Fournisseur utilisé: %', v_supplier_id;
  RAISE NOTICE 'Customer créé: 11000000-0000-0000-0000-000000000001';
END $$;

-- ═══════════════════════════════════════════════════
-- SCENARIO 1 : PO confirmée → Quantity VERS LE BAS (sous seuil alerte)
-- ═══════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════'
\echo 'SCENARIO 1 : PO Quantity VERS LE BAS → Alerte Créée'
\echo '═══════════════════════════════════════════════════'

-- SETUP : Produit avec stock bas + PO quantity haute
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '21000000-0000-0000-0000-000000000001', 'TEST-BUG5-001', 'Produit Test Scenario 1', 50,
  10, 0, 0,  -- Stock initial : real=10, forecasted_in=0 → Prévisionnel=10 < min_stock (alerte existe)
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer PO draft puis confirmer avec quantity haute
INSERT INTO purchase_orders (
  id, po_number, supplier_id, status, created_by
) VALUES (
  '31000000-0000-0000-0000-000000000001', 'PO-TEST-BUG5-S1',
  (SELECT id FROM organisations WHERE type='supplier' LIMIT 1),
  'draft', (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO purchase_order_items (
  id, purchase_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '41000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001', 100, 100
);

-- Confirmer PO (déclenche CAS 1 du trigger handle_purchase_order_forecast)
UPDATE purchase_orders SET
  status = 'confirmed',
  validated_by = (SELECT id FROM auth.users LIMIT 1),
  validated_at = NOW(),
  sent_by = (SELECT id FROM auth.users LIMIT 1),
  sent_at = NOW()
WHERE id = '31000000-0000-0000-0000-000000000001';

-- Vérifier état AVANT modification
SELECT
  'SCENARIO 1 - AVANT modification' AS test,
  CASE
    WHEN stock_forecasted_in = 100 AND (stock_real - stock_forecasted_out + stock_forecasted_in) = 110
    THEN '✅ PASS - forecasted_in=100, prévisionnel=110 (OK, pas d''alerte)'
    ELSE '❌ FAIL - forecasted_in=' || stock_forecasted_in::text || ', prévisionnel=' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000001';

-- ✅ ACTION : Modifier quantity 100 → 30 (VERS LE BAS)
UPDATE purchase_order_items
SET quantity = 30
WHERE id = '41000000-0000-0000-0000-000000000001';

-- TEST 1A : forecasted_in ajusté à 30
SELECT
  'TEST 1A : forecasted_in ajusté' AS test,
  CASE
    WHEN stock_forecasted_in = 30
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_in = ' || stock_forecasted_in::text || ' (attendu: 30)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000001';

-- TEST 1B : stock_prévisionnel = 40 (10 + 30)
SELECT
  'TEST 1B : stock prévisionnel calculé' AS test,
  CASE
    WHEN (stock_real - stock_forecasted_out + stock_forecasted_in) = 40
    THEN '✅ PASS'
    ELSE '❌ FAIL - prévisionnel = ' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text || ' (attendu: 40)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000001';

-- TEST 1C : Alerte créée car prévisionnel (40) < min_stock (50)
SELECT
  'TEST 1C : Alerte créée (prévisionnel < min)' AS test,
  CASE
    WHEN COUNT(*) = 1 AND MIN(validated::text) = 'false'
    THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' alertes trouvées (attendu: 1 non validée)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '21000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- SCENARIO 2 : PO confirmée → Quantity VERS LE HAUT (alerte supprimée)
-- ═══════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════'
\echo 'SCENARIO 2 : PO Quantity VERS LE HAUT → Alerte Supprimée'
\echo '═══════════════════════════════════════════════════'

-- SETUP : Produit avec stock bas + PO quantity basse (alerte existe)
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '21000000-0000-0000-0000-000000000002', 'TEST-BUG5-002', 'Produit Test Scenario 2', 100,
  10, 0, 0,  -- Stock initial : real=10 < min_stock=100 → Alerte
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer PO avec quantity basse (50)
INSERT INTO purchase_orders (
  id, po_number, supplier_id, status, created_by
) VALUES (
  '31000000-0000-0000-0000-000000000002', 'PO-TEST-BUG5-S2',
  (SELECT id FROM organisations WHERE type='supplier' LIMIT 1),
  'draft', (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO purchase_order_items (
  id, purchase_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '41000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000002',
  '21000000-0000-0000-0000-000000000002', 50, 100
);

-- Confirmer PO
UPDATE purchase_orders SET
  status = 'confirmed',
  validated_by = (SELECT id FROM auth.users LIMIT 1),
  validated_at = NOW(),
  sent_by = (SELECT id FROM auth.users LIMIT 1),
  sent_at = NOW()
WHERE id = '31000000-0000-0000-0000-000000000002';

-- Vérifier état AVANT modification
SELECT
  'SCENARIO 2 - AVANT modification' AS test,
  CASE
    WHEN stock_forecasted_in = 50 AND (stock_real - stock_forecasted_out + stock_forecasted_in) = 60
    THEN '✅ PASS - forecasted_in=50, prévisionnel=60 (< min_stock, alerte existe)'
    ELSE '❌ FAIL - forecasted_in=' || stock_forecasted_in::text || ', prévisionnel=' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000002';

-- ✅ ACTION : Modifier quantity 50 → 150 (VERS LE HAUT)
UPDATE purchase_order_items
SET quantity = 150
WHERE id = '41000000-0000-0000-0000-000000000002';

-- TEST 2A : forecasted_in ajusté à 150
SELECT
  'TEST 2A : forecasted_in ajusté' AS test,
  CASE
    WHEN stock_forecasted_in = 150
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_in = ' || stock_forecasted_in::text || ' (attendu: 150)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000002';

-- TEST 2B : stock_prévisionnel = 160 (10 + 150)
SELECT
  'TEST 2B : stock prévisionnel calculé' AS test,
  CASE
    WHEN (stock_real - stock_forecasted_out + stock_forecasted_in) = 160
    THEN '✅ PASS'
    ELSE '❌ FAIL - prévisionnel = ' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text || ' (attendu: 160)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000002';

-- TEST 2C : Alerte supprimée car prévisionnel (160) >= min_stock (100)
SELECT
  'TEST 2C : Alerte supprimée (prévisionnel >= min)' AS test,
  CASE
    WHEN COUNT(*) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' alertes encore présentes (attendu: 0)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '21000000-0000-0000-0000-000000000002'
  AND validated = false;

-- ═══════════════════════════════════════════════════
-- SCENARIO 3 : SO confirmée → Quantity VERS LE HAUT (augmente réservation)
-- ═══════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════'
\echo 'SCENARIO 3 : SO Quantity VERS LE HAUT → Réservation Augmente'
\echo '═══════════════════════════════════════════════════'

-- SETUP : Produit avec stock OK initialement
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '21000000-0000-0000-0000-000000000003', 'TEST-BUG5-003', 'Produit Test Scenario 3', 50,
  100, 0, 0,  -- Stock initial : real=100, prévisionnel=100 (OK)
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer SO confirmed avec quantity basse
INSERT INTO sales_orders (
  id, order_number, customer_id, status, customer_type, total_ht, total_ttc, created_by
) VALUES (
  '32000000-0000-0000-0000-000000000001', 'SO-TEST-BUG5-S3', '11000000-0000-0000-0000-000000000001',
  'draft', 'organization', 1000, 1200, (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '42000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000003', 10, 100
);

-- Confirmer SO
UPDATE sales_orders SET
  status = 'confirmed',
  confirmed_by = (SELECT id FROM auth.users LIMIT 1),
  confirmed_at = NOW()
WHERE id = '32000000-0000-0000-0000-000000000001';

-- Vérifier état AVANT modification
SELECT
  'SCENARIO 3 - AVANT modification' AS test,
  CASE
    WHEN stock_forecasted_out = 10 AND (stock_real - stock_forecasted_out + stock_forecasted_in) = 90
    THEN '✅ PASS - forecasted_out=10, prévisionnel=90 (OK)'
    ELSE '❌ FAIL - forecasted_out=' || stock_forecasted_out::text || ', prévisionnel=' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000003';

-- ✅ ACTION : Modifier quantity 10 → 80 (VERS LE HAUT, augmente réservation)
UPDATE sales_order_items
SET quantity = 80
WHERE id = '42000000-0000-0000-0000-000000000001';

-- TEST 3A : forecasted_out ajusté à 80
SELECT
  'TEST 3A : forecasted_out ajusté' AS test,
  CASE
    WHEN stock_forecasted_out = 80
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_out = ' || stock_forecasted_out::text || ' (attendu: 80)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000003';

-- TEST 3B : stock_prévisionnel = 20 (100 - 80 + 0)
SELECT
  'TEST 3B : stock prévisionnel calculé' AS test,
  CASE
    WHEN (stock_real - stock_forecasted_out + stock_forecasted_in) = 20
    THEN '✅ PASS'
    ELSE '❌ FAIL - prévisionnel = ' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text || ' (attendu: 20)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000003';

-- TEST 3C : Alerte créée car prévisionnel = 20 < min_stock = 50
SELECT
  'TEST 3C : Alerte créée (shortage détecté)' AS test,
  CASE
    WHEN COUNT(*) >= 1
    THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' alertes créées (attendu: >= 1)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '21000000-0000-0000-0000-000000000003'
  AND validated = false;

-- ═══════════════════════════════════════════════════
-- SCENARIO 4 : SO confirmée → Quantity VERS LE BAS (diminue réservation)
-- ═══════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════'
\echo 'SCENARIO 4 : SO Quantity VERS LE BAS → Réservation Diminue'
\echo '═══════════════════════════════════════════════════'

-- SETUP : Produit avec forte réservation SO (alerte shortage)
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '21000000-0000-0000-0000-000000000004', 'TEST-BUG5-004', 'Produit Test Scenario 4', 50,
  30, 0, 0,  -- Stock initial : real=30
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer SO avec quantity haute (80)
INSERT INTO sales_orders (
  id, order_number, customer_id, status, customer_type, total_ht, total_ttc, created_by
) VALUES (
  '32000000-0000-0000-0000-000000000002', 'SO-TEST-BUG5-S4', '11000000-0000-0000-0000-000000000001',
  'draft', 'organization', 8000, 9600, (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '42000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002',
  '21000000-0000-0000-0000-000000000004', 80, 100
);

-- Confirmer SO
UPDATE sales_orders SET
  status = 'confirmed',
  confirmed_by = (SELECT id FROM auth.users LIMIT 1),
  confirmed_at = NOW()
WHERE id = '32000000-0000-0000-0000-000000000002';

-- Vérifier état AVANT modification (alerte existe car prévisionnel négatif)
SELECT
  'SCENARIO 4 - AVANT modification' AS test,
  CASE
    WHEN stock_forecasted_out = 80 AND (stock_real - stock_forecasted_out + stock_forecasted_in) = -50
    THEN '✅ PASS - forecasted_out=80, prévisionnel=-50'
    ELSE '❌ FAIL - forecasted_out=' || stock_forecasted_out::text || ', prévisionnel=' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000004';

-- ✅ ACTION : Modifier quantity 80 → 20 (VERS LE BAS, diminue réservation)
UPDATE sales_order_items
SET quantity = 20
WHERE id = '42000000-0000-0000-0000-000000000002';

-- TEST 4A : forecasted_out ajusté à 20
SELECT
  'TEST 4A : forecasted_out ajusté' AS test,
  CASE
    WHEN stock_forecasted_out = 20
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_out = ' || stock_forecasted_out::text || ' (attendu: 20)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000004';

-- TEST 4B : stock_prévisionnel = 10 (30 - 20 + 0)
SELECT
  'TEST 4B : stock prévisionnel calculé' AS test,
  CASE
    WHEN (stock_real - stock_forecasted_out + stock_forecasted_in) = 10
    THEN '✅ PASS'
    ELSE '❌ FAIL - prévisionnel = ' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text || ' (attendu: 10)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000004';

-- TEST 4C : Alerte toujours présente car prévisionnel = 10 < min_stock = 50
SELECT
  'TEST 4C : Alerte encore présente (shortage persiste)' AS test,
  CASE
    WHEN COUNT(*) >= 1
    THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' alertes actives (attendu: >= 1)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '21000000-0000-0000-0000-000000000004'
  AND validated = false;

-- ═══════════════════════════════════════════════════
-- SCENARIO 5 : Stock Prévisionnel NÉGATIF → Alerte Critique
-- ═══════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════'
\echo 'SCENARIO 5 : Stock Prévisionnel NÉGATIF → Alerte Critique'
\echo '═══════════════════════════════════════════════════'

-- SETUP : Produit avec stock réel bas + commandes clients fortes
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '21000000-0000-0000-0000-000000000005', 'TEST-BUG5-005', 'Produit Test Scenario 5', 50,
  10, 0, 0,  -- Stock initial : real=10
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer PO avec 20 unités
INSERT INTO purchase_orders (
  id, po_number, supplier_id, status, created_by
) VALUES (
  '31000000-0000-0000-0000-000000000003', 'PO-TEST-BUG5-S5',
  (SELECT id FROM organisations WHERE type='supplier' LIMIT 1),
  'draft', (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO purchase_order_items (
  id, purchase_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '41000000-0000-0000-0000-000000000003', '31000000-0000-0000-0000-000000000003',
  '21000000-0000-0000-0000-000000000005', 20, 100
);

UPDATE purchase_orders SET
  status = 'confirmed',
  validated_by = (SELECT id FROM auth.users LIMIT 1),
  validated_at = NOW(),
  sent_by = (SELECT id FROM auth.users LIMIT 1),
  sent_at = NOW()
WHERE id = '31000000-0000-0000-0000-000000000003';

-- Créer SO avec 50 unités (plus que disponible!)
INSERT INTO sales_orders (
  id, order_number, customer_id, status, customer_type, total_ht, total_ttc, created_by
) VALUES (
  '32000000-0000-0000-0000-000000000003', 'SO-TEST-BUG5-S5', '11000000-0000-0000-0000-000000000001',
  'draft', 'organization', 5000, 6000, (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO sales_order_items (
  id, sales_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '42000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000003',
  '21000000-0000-0000-0000-000000000005', 50, 100
);

UPDATE sales_orders SET
  status = 'confirmed',
  confirmed_by = (SELECT id FROM auth.users LIMIT 1),
  confirmed_at = NOW()
WHERE id = '32000000-0000-0000-0000-000000000003';

-- TEST 5A : Stock prévisionnel NÉGATIF
SELECT
  'TEST 5A : Stock prévisionnel négatif calculé' AS test,
  CASE
    WHEN (stock_real - stock_forecasted_out + stock_forecasted_in) = -20
    THEN '✅ PASS - prévisionnel = -20 (10 - 50 + 20)'
    ELSE '❌ FAIL - prévisionnel = ' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text || ' (attendu: -20)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000005';

-- TEST 5B : forecasted_in = 20
SELECT
  'TEST 5B : forecasted_in correct' AS test,
  CASE
    WHEN stock_forecasted_in = 20
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_in = ' || stock_forecasted_in::text || ' (attendu: 20)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000005';

-- TEST 5C : forecasted_out = 50
SELECT
  'TEST 5C : forecasted_out correct' AS test,
  CASE
    WHEN stock_forecasted_out = 50
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_out = ' || stock_forecasted_out::text || ' (attendu: 50)'
  END AS resultat
FROM products
WHERE id = '21000000-0000-0000-0000-000000000005';

-- TEST 5D : Alerte existe (prévisionnel négatif = situation critique)
SELECT
  'TEST 5D : Alerte détectée (prévisionnel négatif)' AS test,
  CASE
    WHEN COUNT(*) >= 1
    THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' alertes trouvées (attendu: >= 1)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '21000000-0000-0000-0000-000000000005';

-- ═══════════════════════════════════════════════════
-- CLEANUP : Supprimer données test
-- ═══════════════════════════════════════════════════

\echo ''
\echo '🧹 Nettoyage données test...'\echo ''

DELETE FROM sales_order_items WHERE id IN (
  '42000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000002',
  '42000000-0000-0000-0000-000000000003'
);

DELETE FROM sales_orders WHERE id IN (
  '32000000-0000-0000-0000-000000000001',
  '32000000-0000-0000-0000-000000000002',
  '32000000-0000-0000-0000-000000000003'
);

DELETE FROM purchase_order_items WHERE id IN (
  '41000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000002',
  '41000000-0000-0000-0000-000000000003'
);

DELETE FROM purchase_orders WHERE id IN (
  '31000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000002',
  '31000000-0000-0000-0000-000000000003'
);

DELETE FROM stock_movements WHERE reference_type IN ('purchase_order', 'sales_order')
  AND reference_id IN (
    '31000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000002',
    '31000000-0000-0000-0000-000000000003',
    '32000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000002',
    '32000000-0000-0000-0000-000000000003'
  );

DELETE FROM stock_alert_tracking WHERE product_id IN (
  '21000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000002',
  '21000000-0000-0000-0000-000000000003',
  '21000000-0000-0000-0000-000000000004',
  '21000000-0000-0000-0000-000000000005'
);

DELETE FROM products WHERE id IN (
  '21000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000002',
  '21000000-0000-0000-0000-000000000003',
  '21000000-0000-0000-0000-000000000004',
  '21000000-0000-0000-0000-000000000005'
);

DELETE FROM organisations WHERE id = '11000000-0000-0000-0000-000000000001';

ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSUMÉ ATTENDU
-- ═══════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════'
\echo 'RÉSULTAT ATTENDU : 17 tests ✅ PASS'
\echo '═══════════════════════════════════════════════════'
\echo ''
\echo 'SCENARIO 1 (PO quantity BAISSE) : 4 tests'
\echo 'SCENARIO 2 (PO quantity HAUSSE) : 4 tests'
\echo 'SCENARIO 3 (SO quantity HAUSSE) : 4 tests'
\echo 'SCENARIO 4 (SO quantity BAISSE) : 4 tests'
\echo 'SCENARIO 5 (Prévisionnel NÉGATIF): 4 tests'
\echo ''
\echo 'Si tous les tests passent, BUG #5 est complètement validé ✅'
\echo ''

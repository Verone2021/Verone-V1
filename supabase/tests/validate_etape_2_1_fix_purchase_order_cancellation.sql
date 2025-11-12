-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 2.1 : Validation Annulation PO Partiellement Reçue
-- Migration: 20251113_004_fix_purchase_order_cancellation_calculation.sql
-- Date: 2025-11-13
-- ═══════════════════════════════════════════════════

\echo '🧪 DÉBUT TESTS ÉTAPE 2.1 - Annulation PO Partiellement Reçue'
\echo ''

BEGIN;

-- ═══════════════════════════════════════════════════
-- SETUP : Récupérer supplier et créer organisation
-- ═══════════════════════════════════════════════════

DO $$
DECLARE
  v_supplier_id uuid;
BEGIN
  -- Récupérer premier fournisseur existant
  SELECT id INTO v_supplier_id
  FROM organisations
  WHERE type = 'supplier'
  LIMIT 1;

  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Aucun fournisseur trouvé. Créer un fournisseur d''abord.';
  END IF;

  RAISE NOTICE 'Fournisseur utilisé: %', v_supplier_id;
END $$;

-- ═══════════════════════════════════════════════════
-- TEST 1 : Annulation PO confirmée non reçue (Régression CAS 3)
-- ═══════════════════════════════════════════════════

\echo 'TEST 1 : Annulation PO confirmée non reçue → forecasted_in libéré'

-- SETUP : Créer produit avec stock initial
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '50000000-0000-0000-0000-000000000001', 'TEST-PO-001-E21', 'Produit Test 1 Étape 2.1', 10,
  20, 0, 0,  -- Stock initial : real=20, forecasted_in=0
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer PO en draft
INSERT INTO purchase_orders (
  id, po_number, supplier_id, status, created_by
) VALUES (
  '60000000-0000-0000-0000-000000000001', 'PO-TEST-E21-001',
  (SELECT id FROM organisations WHERE type='supplier' LIMIT 1),
  'draft', (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO purchase_order_items (
  id, purchase_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001', 100, 50
);

-- Confirmer PO
UPDATE purchase_orders SET
  status = 'confirmed',
  validated_by = (SELECT id FROM auth.users LIMIT 1),
  sent_by = (SELECT id FROM auth.users LIMIT 1),
  validated_at = NOW(),
  sent_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000001';

-- Annuler PO
UPDATE purchase_orders SET status = 'cancelled', cancelled_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000001';

-- VÉRIFICATION : forecasted_in revenu à 0
SELECT
  'TEST 1 : Régression CAS 3' AS test,
  CASE
    WHEN stock_forecasted_in = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_in = ' || stock_forecasted_in::text || ' (attendu: 0)'
  END AS resultat
FROM products
WHERE id = '50000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 2 : Annulation PO partiellement reçue (CAS 4 principal)
-- ═══════════════════════════════════════════════════

\echo 'TEST 2 : Annulation PO partiellement reçue → forecasted_in libéré correctement'

-- SETUP : Créer produit
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '50000000-0000-0000-0000-000000000002', 'TEST-PO-002-E21', 'Produit Test 2 Étape 2.1', 10,
  50, 0, 0,
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer PO en draft
INSERT INTO purchase_orders (
  id, po_number, supplier_id, status, created_by
) VALUES (
  '60000000-0000-0000-0000-000000000002', 'PO-TEST-E21-002',
  (SELECT id FROM organisations WHERE type='supplier' LIMIT 1),
  'draft', (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO purchase_order_items (
  id, purchase_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000002', 100, 50
);

-- Confirmer PO
UPDATE purchase_orders SET
  status = 'confirmed',
  validated_by = (SELECT id FROM auth.users LIMIT 1),
  sent_by = (SELECT id FROM auth.users LIMIT 1),
  validated_at = NOW(),
  sent_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000002';

-- Réception partielle de 30 unités
UPDATE purchase_order_items
SET quantity_received = 30
WHERE id = '70000000-0000-0000-0000-000000000002';

UPDATE purchase_orders
SET status = 'partially_received', received_by = (SELECT id FROM auth.users LIMIT 1), received_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000002';

-- Vérifier état intermédiaire (forecasted_in devrait être +70, stock_real +30)
DO $$
DECLARE
  v_forecasted_in INTEGER;
  v_stock_real INTEGER;
BEGIN
  SELECT stock_forecasted_in, stock_real INTO v_forecasted_in, v_stock_real
  FROM products WHERE id = '50000000-0000-0000-0000-000000000002';

  RAISE NOTICE 'État après réception partielle: forecasted_in=%, stock_real=%', v_forecasted_in, v_stock_real;
END $$;

-- Annuler PO partiellement reçue
UPDATE purchase_orders SET status = 'cancelled', cancelled_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000002';

-- VÉRIFICATION : forecasted_in revenu à 0 (libération des 70 unités restantes)
SELECT
  'TEST 2 : CAS 4 annulation partielle' AS test,
  CASE
    WHEN stock_forecasted_in = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_in = ' || stock_forecasted_in::text || ' (attendu: 0)'
  END AS resultat
FROM products
WHERE id = '50000000-0000-0000-0000-000000000002';

-- VÉRIFICATION : stock_real reste à 80 (50 initial + 30 reçus)
SELECT
  'TEST 2 : stock_real inchangé' AS test,
  CASE
    WHEN stock_real = 80 THEN '✅ PASS'
    ELSE '❌ FAIL - stock_real = ' || stock_real::text || ' (attendu: 80)'
  END AS resultat
FROM products
WHERE id = '50000000-0000-0000-0000-000000000002';

-- ═══════════════════════════════════════════════════
-- TEST 3 : Annulation PO 100% reçue (edge case)
-- ═══════════════════════════════════════════════════

\echo 'TEST 3 : Annulation PO 100% reçue → Aucune libération nécessaire'

-- SETUP : Créer produit
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '50000000-0000-0000-0000-000000000003', 'TEST-PO-003-E21', 'Produit Test 3 Étape 2.1', 10,
  30, 0, 0,
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer PO en draft
INSERT INTO purchase_orders (
  id, po_number, supplier_id, status, created_by
) VALUES (
  '60000000-0000-0000-0000-000000000003', 'PO-TEST-E21-003',
  (SELECT id FROM organisations WHERE type='supplier' LIMIT 1),
  'draft', (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO purchase_order_items (
  id, purchase_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000003', 50, 50
);

-- Confirmer PO
UPDATE purchase_orders SET
  status = 'confirmed',
  validated_by = (SELECT id FROM auth.users LIMIT 1),
  sent_by = (SELECT id FROM auth.users LIMIT 1),
  validated_at = NOW(),
  sent_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000003';

-- Réception 100%
UPDATE purchase_order_items SET quantity_received = 50
WHERE id = '70000000-0000-0000-0000-000000000003';

UPDATE purchase_orders SET
  status = 'received',
  received_by = (SELECT id FROM auth.users LIMIT 1),
  received_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000003';

-- Annuler PO 100% reçue
UPDATE purchase_orders SET status = 'cancelled', cancelled_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000003';

-- VÉRIFICATION : forecasted_in reste à 0 (rien à libérer)
SELECT
  'TEST 3 : Edge case 100% reçu' AS test,
  CASE
    WHEN stock_forecasted_in = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_in = ' || stock_forecasted_in::text || ' (attendu: 0)'
  END AS resultat
FROM products
WHERE id = '50000000-0000-0000-0000-000000000003';

-- VÉRIFICATION : stock_real = 80 (30 initial + 50 reçus)
SELECT
  'TEST 3 : stock_real correct' AS test,
  CASE
    WHEN stock_real = 80 THEN '✅ PASS'
    ELSE '❌ FAIL - stock_real = ' || stock_real::text || ' (attendu: 80)'
  END AS resultat
FROM products
WHERE id = '50000000-0000-0000-0000-000000000003';

-- ═══════════════════════════════════════════════════
-- TEST 4 : Calcul net correct avec multiple items
-- ═══════════════════════════════════════════════════

\echo 'TEST 4 : Multiple items - Calcul net correct pour chaque produit'

-- SETUP : Créer 2 produits
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '50000000-0000-0000-0000-000000000004', 'TEST-PO-004-E21', 'Produit Test 4 Étape 2.1', 5,
  40, 0, 0,
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
),
(
  '50000000-0000-0000-0000-000000000005', 'TEST-PO-005-E21', 'Produit Test 5 Étape 2.1', 5,
  60, 0, 0,
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- Créer PO en draft avec 2 items
INSERT INTO purchase_orders (
  id, po_number, supplier_id, status, created_by
) VALUES (
  '60000000-0000-0000-0000-000000000004', 'PO-TEST-E21-004',
  (SELECT id FROM organisations WHERE type='supplier' LIMIT 1),
  'draft', (SELECT id FROM auth.users LIMIT 1)
);

INSERT INTO purchase_order_items (
  id, purchase_order_id, product_id, quantity, unit_price_ht
) VALUES (
  '70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-000000000004', 50, 50
),
(
  '70000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-000000000005', 80, 50
);

-- Confirmer PO
UPDATE purchase_orders SET
  status = 'confirmed',
  validated_by = (SELECT id FROM auth.users LIMIT 1),
  sent_by = (SELECT id FROM auth.users LIMIT 1),
  validated_at = NOW(),
  sent_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000004';

-- Réceptions partielles
UPDATE purchase_order_items SET quantity_received = 20
WHERE id = '70000000-0000-0000-0000-000000000004';

UPDATE purchase_order_items SET quantity_received = 60
WHERE id = '70000000-0000-0000-0000-000000000005';

UPDATE purchase_orders SET
  status = 'partially_received',
  received_by = (SELECT id FROM auth.users LIMIT 1),
  received_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000004';

-- Annuler PO
UPDATE purchase_orders SET status = 'cancelled', cancelled_at = NOW()
WHERE id = '60000000-0000-0000-0000-000000000004';

-- VÉRIFICATION : forecasted_in = 0 pour les 2 produits
SELECT
  'TEST 4 : Multiple items libérés' AS test,
  CASE
    WHEN COUNT(*) = 2 AND MIN(stock_forecasted_in) = 0 AND MAX(stock_forecasted_in) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL - forecasted_in non libéré pour tous (count=' || COUNT(*)::text || ')'
  END AS resultat
FROM products
WHERE id IN ('50000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000005');

-- VÉRIFICATION : stock_real corrects (40+20=60, 60+60=120)
SELECT
  'TEST 4 : stock_real corrects' AS test,
  CASE
    WHEN
      (SELECT stock_real FROM products WHERE id = '50000000-0000-0000-0000-000000000004') = 60 AND
      (SELECT stock_real FROM products WHERE id = '50000000-0000-0000-0000-000000000005') = 120
    THEN '✅ PASS'
    ELSE '❌ FAIL - stock_real incorrects'
  END AS resultat;

-- ═══════════════════════════════════════════════════
-- TEST 5 : Mouvement OUT créé avec attributs corrects
-- ═══════════════════════════════════════════════════

\echo 'TEST 5 : Mouvement OUT de libération créé correctement'

-- VÉRIFICATION : Mouvement OUT existe avec bons attributs pour TEST 2
SELECT
  'TEST 5 : Mouvement OUT libération' AS test,
  CASE
    WHEN COUNT(*) >= 1 AND
         MIN(movement_type) = 'OUT' AND
         MIN(affects_forecast::text) = 'true' AND
         MIN(forecast_type) = 'in' AND
         MIN(quantity_change) < 0  -- Négatif pour OUT
    THEN '✅ PASS'
    ELSE '❌ FAIL - Mouvement libération incorrect (count=' || COUNT(*)::text || ')'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = '60000000-0000-0000-0000-000000000002'
  AND product_id = '50000000-0000-0000-0000-000000000002'
  AND affects_forecast = true
  AND forecast_type = 'in'
  AND movement_type = 'OUT'
  AND notes LIKE '%Annulation PO partiellement reçue%';

-- ═══════════════════════════════════════════════════
-- TEST 6 : Vérifier quantité libérée = net (quantity - quantity_received)
-- ═══════════════════════════════════════════════════

\echo 'TEST 6 : Quantité libérée = net (100 - 30 = 70)'

-- VÉRIFICATION : Le mouvement OUT pour TEST 2 a bien quantity_change = -70
SELECT
  'TEST 6 : Calcul net correct' AS test,
  CASE
    WHEN ABS(MIN(quantity_change)) = 70 THEN '✅ PASS'
    ELSE '❌ FAIL - quantity_change = ' || MIN(quantity_change)::text || ' (attendu: -70)'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = '60000000-0000-0000-0000-000000000002'
  AND product_id = '50000000-0000-0000-0000-000000000002'
  AND affects_forecast = true
  AND forecast_type = 'in'
  AND movement_type = 'OUT'
  AND notes LIKE '%Annulation PO partiellement reçue%';

-- ═══════════════════════════════════════════════════
-- CLEANUP : Supprimer données test
-- ═══════════════════════════════════════════════════

\echo ''
\echo '🧹 Nettoyage données test...'

DELETE FROM purchase_order_items WHERE id IN (
  '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002',
  '70000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004',
  '70000000-0000-0000-0000-000000000005'
);

DELETE FROM purchase_orders WHERE id IN (
  '60000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000004'
);

DELETE FROM stock_movements WHERE reference_type = 'purchase_order' AND reference_id IN (
  '60000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000004'
);

DELETE FROM products WHERE id IN (
  '50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-000000000005'
);

ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSUMÉ ATTENDU
-- ═══════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════'
\echo 'RÉSULTAT ATTENDU : 8 tests ✅ PASS'
\echo '═══════════════════════════════════════════════════'
\echo ''
\echo 'Si tous les tests passent, la correction Bug #4 est validée ✅'
\echo ''

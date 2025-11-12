-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 1.1 : Validation Calcul Stock Prévisionnel
-- Migration: 20251113_001_fix_stock_alert_forecasted_calculation.sql
-- Date: 2025-11-13
-- ═══════════════════════════════════════════════════

\echo '🧪 DÉBUT TESTS ÉTAPE 1.1 - Calcul Stock Prévisionnel'
\echo ''

BEGIN;

-- ═══════════════════════════════════════════════════
-- SETUP : Récupérer un fournisseur existant
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
-- TEST 1 : Alerte créée avec stock prévisionnel bas
-- ═══════════════════════════════════════════════════

\echo 'TEST 1 : Alerte créée avec stock prévisionnel bas'

-- SETUP : Créer produit test avec stock prévisionnel bas
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '00000000-0000-0000-0000-000000000001', 'TEST-001-E11', 'Produit Test Étape 1.1', 15,
  20, 15, 0,  -- Stock prévisionnel = 20 - 15 + 0 = 5 < 15 → ALERTE
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- VÉRIFICATION : Alerte créée
SELECT
  'TEST 1 : Alerte créée' AS test,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte non créée (count=' || COUNT(*)::text || ')'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '00000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 2 : Type alerte = low_stock
-- ═══════════════════════════════════════════════════

\echo 'TEST 2 : Type alerte = low_stock'

SELECT
  'TEST 2 : Type alerte' AS test,
  CASE
    WHEN alert_type = 'low_stock' THEN '✅ PASS'
    ELSE '❌ FAIL - Type = ' || COALESCE(alert_type, 'NULL')
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '00000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 3 : Shortage = 10 (15 min_stock - 5 stock prévu)
-- ═══════════════════════════════════════════════════

\echo 'TEST 3 : Shortage correct (10 unités)'

SELECT
  'TEST 3 : Shortage' AS test,
  CASE
    WHEN shortage_quantity = 10 THEN '✅ PASS'
    ELSE '❌ FAIL - Shortage = ' || shortage_quantity::text || ' (attendu: 10)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '00000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 4 : Priorité = 2 (warning)
-- ═══════════════════════════════════════════════════

\echo 'TEST 4 : Priorité = 2 (warning)'

SELECT
  'TEST 4 : Priorité' AS test,
  CASE
    WHEN alert_priority = 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Priority = ' || alert_priority::text || ' (attendu: 2)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '00000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 5 : Alerte supprimée quand stock prévu suffisant
-- ═══════════════════════════════════════════════════

\echo 'TEST 5 : Alerte supprimée quand stock prévisionnel suffisant'

-- ACTION : Modifier forecasted_in pour augmenter stock prévisionnel
UPDATE products SET stock_forecasted_in = 20 WHERE id = '00000000-0000-0000-0000-000000000001';
-- Stock prévisionnel = 20 - 15 + 20 = 25 > 15 → PAS D'ALERTE

SELECT
  'TEST 5 : Alerte supprimée' AS test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte encore présente'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '00000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════
-- TEST 6 : Pas d'alerte si forecasted_in élevé
-- ═══════════════════════════════════════════════════

\echo 'TEST 6 : Pas d''alerte si stock_real=0 mais forecasted_in élevé'

-- SETUP : Créer produit avec stock réel = 0 mais forecasted_in élevé
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '00000000-0000-0000-0000-000000000002', 'TEST-002-E11', 'Produit Test 2 Étape 1.1', 10,
  0, 0, 30,  -- Stock prévisionnel = 0 - 0 + 30 = 30 > 10 → PAS D'ALERTE
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

SELECT
  'TEST 6 : Pas alerte si forecasted_in élevé' AS test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte créée à tort'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '00000000-0000-0000-0000-000000000002';

-- ═══════════════════════════════════════════════════
-- TEST BONUS : Vérifier cas out_of_stock avec forecasted_out
-- ═══════════════════════════════════════════════════

\echo 'TEST BONUS : Cas out_of_stock avec commandes en cours'

-- SETUP : Créer produit stock prévisionnel négatif
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  '00000000-0000-0000-0000-000000000003', 'TEST-003-E11', 'Produit Test 3 Étape 1.1', 10,
  5, 10, 0,  -- Stock prévisionnel = 5 - 10 + 0 = -5 < 0 → out_of_stock
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

SELECT
  'TEST BONUS : Type = no_stock_but_ordered' AS test,
  CASE
    WHEN alert_type = 'no_stock_but_ordered' AND alert_priority = 3
    THEN '✅ PASS'
    ELSE '❌ FAIL - Type = ' || COALESCE(alert_type, 'NULL') || ', Priority = ' || COALESCE(alert_priority::text, 'NULL')
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = '00000000-0000-0000-0000-000000000003';

-- ═══════════════════════════════════════════════════
-- CLEANUP : Supprimer données test
-- ═══════════════════════════════════════════════════

\echo ''
\echo '🧹 Nettoyage données test...'

DELETE FROM stock_alert_tracking WHERE product_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
DELETE FROM products WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');

ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSUMÉ ATTENDU
-- ═══════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════'
\echo 'RÉSULTAT ATTENDU : 7 tests ✅ PASS (6 + 1 bonus)'
\echo '═══════════════════════════════════════════════════'
\echo ''
\echo 'Si tous les tests passent, la correction Bug #1 est validée ✅'
\echo ''

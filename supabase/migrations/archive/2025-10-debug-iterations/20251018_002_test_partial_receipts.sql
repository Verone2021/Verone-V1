-- =============================================
-- TEST CASE: Réceptions Partielles Purchase Orders
-- Date: 2025-10-18
-- =============================================
-- Test complet du workflow réceptions partielles avec nouveau trigger
-- PO: 52bf7156-ff00-46d4-97ff-383d5fb70f47
-- Product: Fauteuil Milo - Ocre (20fc0500-f1a0-44ff-8e64-5ab68d1da49b)
-- =============================================

BEGIN;

-- =============================================
-- SETUP: État initial
-- =============================================

-- Vérifier état actuel PO
SELECT
  po.id,
  po.po_number,
  po.status,
  poi.product_id,
  poi.quantity,
  poi.quantity_received,
  p.name as product_name
FROM purchase_orders po
JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
JOIN products p ON p.id = poi.product_id
WHERE po.id = '52bf7156-ff00-46d4-97ff-383d5fb70f47';

-- Vérifier mouvements stock existants pour ce PO
SELECT
  sm.id,
  sm.movement_type,
  sm.quantity_change,
  sm.affects_forecast,
  sm.notes,
  sm.created_at
FROM stock_movements sm
WHERE sm.reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
ORDER BY sm.created_at DESC;

-- =============================================
-- TEST 1: Première réception partielle (1 sur 2)
-- =============================================

RAISE NOTICE '========================================';
RAISE NOTICE 'TEST 1: Première réception partielle';
RAISE NOTICE '========================================';

-- Passer PO en partially_received (si pas déjà fait)
UPDATE purchase_orders
SET
  status = 'partially_received',
  received_at = NOW(),
  received_by = '11111111-1111-1111-1111-111111111111' -- UUID owner test
WHERE id = '52bf7156-ff00-46d4-97ff-383d5fb70f47';

-- Marquer 1 unité reçue (sur 2)
UPDATE purchase_order_items
SET quantity_received = 1
WHERE purchase_order_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
AND product_id = '20fc0500-f1a0-44ff-8e64-5ab68d1da49b';

-- Vérifier mouvements créés
RAISE NOTICE 'Mouvements créés par trigger:';
SELECT
  sm.movement_type,
  sm.quantity_change,
  sm.affects_forecast,
  sm.notes,
  sm.purchase_order_item_id
FROM stock_movements sm
WHERE sm.reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
AND sm.created_at > NOW() - INTERVAL '10 seconds'
ORDER BY sm.created_at;

-- Assertions TEST 1
DO $$
DECLARE
  v_forecast_out_count INTEGER;
  v_real_in_count INTEGER;
BEGIN
  -- Vérifier mouvement OUT forecast (-1)
  SELECT COUNT(*) INTO v_forecast_out_count
  FROM stock_movements
  WHERE reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
  AND movement_type = 'OUT'
  AND quantity_change = -1
  AND affects_forecast = true
  AND created_at > NOW() - INTERVAL '10 seconds';

  IF v_forecast_out_count != 1 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Expected 1 forecast OUT movement, got %', v_forecast_out_count;
  END IF;

  -- Vérifier mouvement IN real (+1)
  SELECT COUNT(*) INTO v_real_in_count
  FROM stock_movements
  WHERE reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
  AND movement_type = 'IN'
  AND quantity_change = 1
  AND affects_forecast = false
  AND created_at > NOW() - INTERVAL '10 seconds';

  IF v_real_in_count != 1 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Expected 1 real IN movement, got %', v_real_in_count;
  END IF;

  RAISE NOTICE '✅ TEST 1 PASSED: 2 mouvements créés (OUT -1 forecast, IN +1 real)';
END $$;

-- =============================================
-- TEST 2: Deuxième réception partielle (1 supplémentaire)
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'TEST 2: Deuxième réception partielle';
RAISE NOTICE '========================================';

-- Marquer 1 unité supplémentaire reçue (total 2 sur 2)
UPDATE purchase_order_items
SET quantity_received = 2
WHERE purchase_order_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
AND product_id = '20fc0500-f1a0-44ff-8e64-5ab68d1da49b';

-- Vérifier nouveaux mouvements créés
RAISE NOTICE 'Nouveaux mouvements créés:';
SELECT
  sm.movement_type,
  sm.quantity_change,
  sm.affects_forecast,
  sm.notes
FROM stock_movements sm
WHERE sm.reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
AND sm.created_at > NOW() - INTERVAL '5 seconds'
ORDER BY sm.created_at;

-- Assertions TEST 2
DO $$
DECLARE
  v_forecast_out_count INTEGER;
  v_real_in_count INTEGER;
BEGIN
  -- Vérifier mouvement OUT forecast supplémentaire (-1)
  SELECT COUNT(*) INTO v_forecast_out_count
  FROM stock_movements
  WHERE reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
  AND movement_type = 'OUT'
  AND quantity_change = -1
  AND affects_forecast = true
  AND created_at > NOW() - INTERVAL '5 seconds';

  IF v_forecast_out_count != 1 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Expected 1 forecast OUT movement, got %', v_forecast_out_count;
  END IF;

  -- Vérifier mouvement IN real supplémentaire (+1)
  SELECT COUNT(*) INTO v_real_in_count
  FROM stock_movements
  WHERE reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
  AND movement_type = 'IN'
  AND quantity_change = 1
  AND affects_forecast = false
  AND created_at > NOW() - INTERVAL '5 seconds';

  IF v_real_in_count != 1 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Expected 1 real IN movement, got %', v_real_in_count;
  END IF;

  RAISE NOTICE '✅ TEST 2 PASSED: 2 mouvements supplémentaires créés';
END $$;

-- =============================================
-- TEST 3: Vérifier cohérence totale
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'TEST 3: Cohérence totale mouvements';
RAISE NOTICE '========================================';

-- Compter tous les mouvements pour ce PO
DO $$
DECLARE
  v_total_forecast_out INTEGER;
  v_total_real_in INTEGER;
BEGIN
  -- Total mouvements OUT forecast (doit être -2: première + deuxième)
  SELECT COALESCE(SUM(quantity_change), 0) INTO v_total_forecast_out
  FROM stock_movements
  WHERE reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
  AND movement_type = 'OUT'
  AND affects_forecast = true;

  IF v_total_forecast_out != -2 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Expected total forecast OUT = -2, got %', v_total_forecast_out;
  END IF;

  -- Total mouvements IN real (doit être +2: première + deuxième)
  SELECT COALESCE(SUM(quantity_change), 0) INTO v_total_real_in
  FROM stock_movements
  WHERE reference_id = '52bf7156-ff00-46d4-97ff-383d5fb70f47'
  AND movement_type = 'IN'
  AND affects_forecast = false;

  IF v_total_real_in != 2 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Expected total real IN = +2, got %', v_total_real_in;
  END IF;

  RAISE NOTICE '✅ TEST 3 PASSED: Mouvements cohérents (OUT -2, IN +2)';
END $$;

-- =============================================
-- CLEANUP: Rollback pour ne pas polluer DB
-- =============================================

ROLLBACK;

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE '🎉 TOUS LES TESTS PASSÉS';
RAISE NOTICE '========================================';
RAISE NOTICE 'Transaction rollback → DB non modifiée';
RAISE NOTICE 'Appliquer migration 20251018_001 en production';
RAISE NOTICE '========================================';

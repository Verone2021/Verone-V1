-- Migration: Data fix - Release forecasted_out for already shipped orders
-- Date: 2025-11-13
-- Purpose: Fix historical data for orders shipped before Bug #2 fix
-- Impact: Orders with warehouse_exit_at filled but forecasted_out not released
-- Priority: P0 - CRITICAL DATA FIX
--
-- Context: Before Bug #2 fix (migration 20251113_002), shipped orders didn't
-- release forecasted_out, causing incorrect stock calculations.
-- This migration creates missing IN movements to release forecasted_out.

\echo '========================================';
\echo 'DATA FIX: RELEASE FORECASTED FOR SHIPPED ORDERS';
\echo '========================================';
\echo '';

-- =============================================
-- STEP 1: Identify orders needing fix
-- =============================================

\echo '=== ÉTAPE 1: Identification commandes à corriger ===';

DO $$
DECLARE
  v_total_orders INTEGER;
  v_orders_needing_fix INTEGER;
BEGIN
  -- Count total shipped orders
  SELECT COUNT(*) INTO v_total_orders
  FROM sales_orders
  WHERE warehouse_exit_at IS NOT NULL;

  -- Count orders needing fix (shipped but no liberation movement)
  SELECT COUNT(DISTINCT so.id) INTO v_orders_needing_fix
  FROM sales_orders so
  INNER JOIN sales_order_items soi ON so.id = soi.sales_order_id
  WHERE so.warehouse_exit_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM stock_movements sm
      WHERE sm.reference_type = 'sales_order'
        AND sm.reference_id = so.id
        AND sm.product_id = soi.product_id
        AND sm.affects_forecast = true
        AND sm.forecast_type = 'out'
        AND sm.movement_type = 'IN'
        AND sm.reason_code = 'sale'
    );

  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES AVANT DATA FIX:';
  RAISE NOTICE '   Total commandes expédiées: %', v_total_orders;
  RAISE NOTICE '   Commandes nécessitant correction: %', v_orders_needing_fix;
  RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 2: Create missing liberation movements
-- =============================================

\echo '=== ÉTAPE 2: Création mouvements libération manquants ===';

DO $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_movements_created INTEGER := 0;
  v_products_affected INTEGER := 0;
  v_products TEXT[];
BEGIN
  -- Loop through all shipped orders needing fix
  FOR v_order IN
    SELECT DISTINCT so.id, so.warehouse_exit_at, so.confirmed_by, so.order_number
    FROM sales_orders so
    INNER JOIN sales_order_items soi ON so.id = soi.sales_order_id
    WHERE so.warehouse_exit_at IS NOT NULL
    ORDER BY so.warehouse_exit_at
  LOOP
    -- Loop through items of this order
    FOR v_item IN
      SELECT soi.product_id, soi.quantity, p.sku
      FROM sales_order_items soi
      INNER JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = v_order.id
    LOOP
      -- Check if liberation movement already exists
      IF NOT EXISTS (
        SELECT 1 FROM stock_movements
        WHERE reference_type = 'sales_order'
          AND reference_id = v_order.id
          AND product_id = v_item.product_id
          AND affects_forecast = true
          AND forecast_type = 'out'
          AND movement_type = 'IN'
          AND reason_code = 'sale'
      ) THEN
        -- Check if reservation movement exists (order was confirmed)
        IF EXISTS (
          SELECT 1 FROM stock_movements
          WHERE reference_type = 'sales_order'
            AND reference_id = v_order.id
            AND product_id = v_item.product_id
            AND affects_forecast = true
            AND forecast_type = 'out'
            AND movement_type = 'OUT'
        ) THEN
          -- Create liberation movement
          INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity_change,
            quantity_before,
            quantity_after,
            reason_code,
            reference_type,
            reference_id,
            notes,
            affects_forecast,
            forecast_type,
            performed_by,
            performed_at
          )
          SELECT
            v_item.product_id,
            'IN',
            v_item.quantity,
            stock_forecasted_out,
            stock_forecasted_out + v_item.quantity,
            'sale',
            'sales_order',
            v_order.id,
            'DATA FIX 2025-11-13: Libération forecasted_out manquante pour expédition ' || v_order.order_number,
            true,
            'out',
            v_order.confirmed_by,
            v_order.warehouse_exit_at
          FROM products WHERE id = v_item.product_id;

          v_movements_created := v_movements_created + 1;

          -- Track affected products
          IF NOT (v_item.product_id::text = ANY(v_products)) THEN
            v_products := array_append(v_products, v_item.product_id::text);
            v_products_affected := v_products_affected + 1;
          END IF;

          RAISE NOTICE '  ✅ Libération créée: Commande % - Produit % (SKU: %) - Quantité: %',
            v_order.order_number, v_item.product_id, v_item.sku, v_item.quantity;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '📊 RÉSULTATS DATA FIX:';
  RAISE NOTICE '   Mouvements de libération créés: %', v_movements_created;
  RAISE NOTICE '   Produits affectés: %', v_products_affected;
  RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 3: Verify data fix results
-- =============================================

\echo '=== ÉTAPE 3: Vérification résultats ===';

DO $$
DECLARE
  v_remaining_issues INTEGER;
BEGIN
  -- Check if any orders still need fixing
  SELECT COUNT(DISTINCT so.id) INTO v_remaining_issues
  FROM sales_orders so
  INNER JOIN sales_order_items soi ON so.id = soi.sales_order_id
  WHERE so.warehouse_exit_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM stock_movements sm
      WHERE sm.reference_type = 'sales_order'
        AND sm.reference_id = so.id
        AND sm.product_id = soi.product_id
        AND sm.affects_forecast = true
        AND sm.forecast_type = 'out'
        AND sm.movement_type = 'OUT'
    )
    AND NOT EXISTS (
      SELECT 1 FROM stock_movements sm
      WHERE sm.reference_type = 'sales_order'
        AND sm.reference_id = so.id
        AND sm.product_id = soi.product_id
        AND sm.affects_forecast = true
        AND sm.forecast_type = 'out'
        AND sm.movement_type = 'IN'
        AND sm.reason_code = 'sale'
    );

  RAISE NOTICE '';
  RAISE NOTICE '🔍 VÉRIFICATION POST-FIX:';
  RAISE NOTICE '   Commandes restant à corriger: %', v_remaining_issues;

  IF v_remaining_issues = 0 THEN
    RAISE NOTICE '   ✅ DATA FIX COMPLET: Toutes les commandes expédiées ont leur forecasted_out libéré';
  ELSE
    RAISE WARNING '   ⚠️ ATTENTION: % commandes nécessitent encore une correction manuelle', v_remaining_issues;
  END IF;
  RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 4: Summary
-- =============================================

\echo '';
\echo '========================================';
\echo '✅ DATA FIX TERMINÉ';
\echo '========================================';
\echo '';
\echo 'Actions effectuées:';
\echo '1. Identification commandes expédiées sans libération forecasted_out';
\echo '2. Création mouvements IN (affects_forecast=true, forecast_type=out)';
\echo '3. Vérification complétude data fix';
\echo '';
\echo 'Note: Les triggers recalculent automatiquement stock_forecasted_out';
\echo 'Note: Les alertes stock seront recalculées par sync_stock_alert_tracking()';
\echo '';

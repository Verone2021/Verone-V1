-- Migration: Data fix - Release forecasted_out for already shipped sales orders
-- Context: Bug #2 correction (20251113_002) only fixes new shipments
--          Old shipments still have unreleased forecasted_out
-- Impact: Historical data with double counting
-- Priority: P0 - CRITICAL

DO $$
DECLARE
  v_so RECORD;
  v_item RECORD;
  v_forecasted_qty INTEGER;
  v_fixed_count INTEGER := 0;
BEGIN
  -- Identifier toutes les SO expédiées (warehouse_exit_at filled)
  -- qui ont encore du forecasted_out non libéré
  FOR v_so IN
    SELECT DISTINCT so.id, so.order_number, so.warehouse_exit_at
    FROM sales_orders so
    WHERE so.warehouse_exit_at IS NOT NULL
      AND EXISTS (
        -- Vérifier qu'il y a du forecasted_out non libéré
        SELECT 1
        FROM stock_movements sm
        WHERE sm.reference_type = 'sales_order'
          AND sm.reference_id = so.id
          AND sm.affects_forecast = true
          AND sm.forecast_type = 'out'
        HAVING SUM(sm.quantity_change) < 0  -- Net négatif = pas complètement libéré
      )
  LOOP
    RAISE NOTICE 'Correction SO % (expédié le %)', v_so.order_number, v_so.warehouse_exit_at;

    -- Pour chaque item de la SO
    FOR v_item IN
      SELECT * FROM sales_order_items WHERE sales_order_id = v_so.id
    LOOP
      -- Calculer quantité forecasted_out à libérer pour cet item
      SELECT ABS(SUM(quantity_change))
      INTO v_forecasted_qty
      FROM stock_movements
      WHERE reference_type = 'sales_order'
        AND reference_id = v_so.id
        AND product_id = v_item.product_id
        AND affects_forecast = true
        AND forecast_type = 'out';

      IF v_forecasted_qty > 0 THEN
        -- Créer mouvement de libération
        INSERT INTO stock_movements (
          product_id,
          quantity_change,
          movement_type,
          affects_forecast,
          forecast_type,
          reference_type,
          reference_id,
          notes,
          created_at  -- Backdate au moment de l'expédition
        ) VALUES (
          v_item.product_id,
          v_forecasted_qty,  -- Positif = libération
          'IN',
          true,
          'out',
          'sales_order',
          v_so.id,
          '[DATA FIX 2025-11-13] Libération forecasted_out SO #' || v_so.order_number,
          v_so.warehouse_exit_at  -- Date expédition originale
        );

        RAISE NOTICE '  → Produit % : libéré % unités', v_item.product_id, v_forecasted_qty;
        v_fixed_count := v_fixed_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Data fix terminé : % items corrigés', v_fixed_count;
END $$;

-- Vérification : Afficher statistiques après
SELECT
  'Après data fix : SO avec forecasted non libéré' AS verification,
  COUNT(*) AS count
FROM sales_orders so
WHERE so.warehouse_exit_at IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM stock_movements sm
    WHERE sm.reference_type = 'sales_order'
      AND sm.reference_id = so.id
      AND sm.affects_forecast = true
      AND sm.forecast_type = 'out'
    HAVING SUM(sm.quantity_change) < 0
  );
-- Résultat attendu : count = 0

-- Migration: Fix sales order item quantity change for confirmed orders (Bug #5 - Part 2/2)
-- Date: 2025-11-14
-- Bug: Modifying quantity in confirmed SO doesn't update stock_forecasted_out
-- Impact: Stock prévisionnel incorrect, alerts not created when shortage occurs
-- Priority: P0 - CRITICAL
--
-- Context: When user modifies quantity in confirmed/partially_shipped SO,
-- the forecasted_out must be adjusted accordingly to trigger alert recalculation.
--
-- Solution: Create trigger on sales_order_items.quantity UPDATE
-- that creates forecast adjustment stock_movements when SO is confirmed/partially_shipped.
--
-- Cascade: UPDATE quantity → stock_movement (forecast) → products.forecasted_out → alerts

\echo '========================================';
\echo 'FIX BUG #5 PART 2: SO ITEM QUANTITY CHANGE';
\echo '========================================';
\echo '';

-- =============================================
-- CREATE FUNCTION handle_so_item_quantity_change_confirmed
-- =============================================

CREATE OR REPLACE FUNCTION handle_so_item_quantity_change_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_so_status sales_order_status;
  v_so_number TEXT;
  v_old_net_forecast INTEGER;
  v_new_net_forecast INTEGER;
  v_qty_diff INTEGER;
  v_performed_by UUID;
BEGIN
  -- Récupérer status commande et created_by
  SELECT status, order_number, created_by INTO v_so_status, v_so_number, v_performed_by
  FROM sales_orders
  WHERE id = NEW.sales_order_id;

  -- ✅ SEULEMENT pour commandes confirmées ou partiellement expédiées
  IF v_so_status IN ('confirmed', 'partially_shipped') THEN

    -- ✅ CALCUL DIFFÉRENTIEL NET (prend en compte quantity_shipped)
    -- OLD net forecast : quantité encore réservée AVANT modification
    v_old_net_forecast := OLD.quantity - OLD.quantity_shipped;

    -- NEW net forecast : quantité encore réservée APRÈS modification
    v_new_net_forecast := NEW.quantity - NEW.quantity_shipped;

    -- Différence à appliquer au prévisionnel
    v_qty_diff := v_new_net_forecast - v_old_net_forecast;

    -- ✅ Créer mouvement SEULEMENT si différence non nulle
    IF v_qty_diff != 0 THEN

      -- ✅ Créer stock_movement pour ajuster forecasted_out
      -- NOTE: Pour forecasted_out, logique inversée :
      --   - Réserver PLUS (v_qty_diff > 0) = OUT (diminue stock disponible)
      --   - Réserver MOINS (v_qty_diff < 0) = IN (libère stock)
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        notes,
        reason_code,
        affects_forecast,
        forecast_type,
        performed_by,
        performed_at
      )
      SELECT
        NEW.product_id,
        (CASE
          WHEN v_qty_diff > 0 THEN 'OUT'  -- Augmentation réservation
          ELSE 'IN'                        -- Diminution réservation (libération)
        END)::movement_type,
        -v_qty_diff,  -- ✅ INVERSÉ pour forecasted_out (OUT = négatif, IN = positif)
        stock_forecasted_out,
        stock_forecasted_out - v_qty_diff,
        'sales_order',
        NEW.sales_order_id,
        format('Ajustement forecasted_out: Quantité modifiée %s → %s (net: %s → %s) - SO %s',
               OLD.quantity, NEW.quantity, v_old_net_forecast, v_new_net_forecast, v_so_number),
        'sale',
        true,  -- ✅ Affecte forecast
        'out', -- ✅ Type forecast OUT
        v_performed_by,
        NOW()
      FROM products WHERE id = NEW.product_id;

      RAISE NOTICE '✅ [BUG #5 FIX] Forecasted_out ajusté pour produit % (diff: %s = %s - %s) - SO %',
        NEW.product_id, v_qty_diff, v_new_net_forecast, v_old_net_forecast, v_so_number;
    ELSE
      RAISE NOTICE 'ℹ️ Quantité modifiée mais net forecast identique (produit: %, SO: %)',
        NEW.product_id, v_so_number;
    END IF;

  END IF;

  RETURN NEW;
END;
$function$;

-- =============================================
-- CREATE TRIGGER
-- =============================================

CREATE TRIGGER trigger_handle_so_item_quantity_change_confirmed
  AFTER UPDATE OF quantity
  ON sales_order_items
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
  EXECUTE FUNCTION handle_so_item_quantity_change_confirmed();

COMMENT ON FUNCTION handle_so_item_quantity_change_confirmed() IS
'Trigger: Ajuste stock_forecasted_out quand quantity modifiée dans SO confirmée/partiellement expédiée (Bug #5 fix 2025-11-14).
Workflow: UPDATE quantity → Calcul différentiel net → stock_movement (forecast) → products.forecasted_out → alerts.
Cascade: Trigger existant update_product_stock_advanced_trigger recalcule forecasted_out.
Note: Logique inversée pour forecasted_out (augmentation réservation = OUT, diminution = IN).';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger handle_so_item_quantity_change_confirmed() créé avec BUG #5 fixé (Part 2/2)';
  RAISE NOTICE '   Déclenché sur UPDATE quantity pour SO confirmed/partially_shipped';
  RAISE NOTICE '   Calcul différentiel: (NEW.quantity - NEW.quantity_shipped) - (OLD.quantity - OLD.quantity_shipped)';
  RAISE NOTICE '   Cascade: stock_movements → products.forecasted_out → alerts';
  RAISE NOTICE '   Logique inversée pour forecasted_out (réservation)';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';
\echo '✅ MIGRATION 002 TERMINÉE (Part 2/2)';
\echo '========================================';
\echo '';
\echo 'Correction effectuée:';
\echo '1. Trigger créé pour UPDATE quantity sur SO confirmées';
\echo '2. Calcul différentiel net (prend en compte quantity_shipped)';
\echo '3. Ajustement forecasted_out via stock_movements';
\echo '4. Cascade automatique vers alertes stock';
\echo '';
\echo '🎯 BUG #5 COMPLET: Les 2 triggers PO/SO créés avec succès';
\echo '';

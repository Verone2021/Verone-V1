-- Migration: Fix purchase order item quantity change for confirmed orders (Bug #5 - Part 1/2)
-- Date: 2025-11-14
-- Bug: Modifying quantity in confirmed PO doesn't update stock_forecasted_in
-- Impact: Stock prévisionnel incorrect, alerts not created when shortage occurs
-- Priority: P0 - CRITICAL
--
-- Context: When user modifies quantity in confirmed/partially_received PO,
-- the forecasted_in must be adjusted accordingly to trigger alert recalculation.
--
-- Solution: Create trigger on purchase_order_items.quantity UPDATE
-- that creates forecast adjustment stock_movements when PO is confirmed/partially_received.
--
-- Cascade: UPDATE quantity → stock_movement (forecast) → products.forecasted_in → alerts

\echo '========================================';
\echo 'FIX BUG #5 PART 1: PO ITEM QUANTITY CHANGE';
\echo '========================================';
\echo '';

-- =============================================
-- CREATE FUNCTION handle_po_item_quantity_change_confirmed
-- =============================================

CREATE OR REPLACE FUNCTION handle_po_item_quantity_change_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_po_status purchase_order_status;
  v_po_number TEXT;
  v_old_net_forecast INTEGER;
  v_new_net_forecast INTEGER;
  v_qty_diff INTEGER;
  v_performed_by UUID;
BEGIN
  -- Récupérer status commande et created_by
  SELECT status, po_number, created_by INTO v_po_status, v_po_number, v_performed_by
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  -- ✅ SEULEMENT pour commandes confirmées ou partiellement reçues
  IF v_po_status IN ('confirmed', 'partially_received') THEN

    -- ✅ CALCUL DIFFÉRENTIEL NET (prend en compte quantity_received)
    -- OLD net forecast : quantité encore attendue AVANT modification
    v_old_net_forecast := OLD.quantity - OLD.quantity_received;

    -- NEW net forecast : quantité encore attendue APRÈS modification
    v_new_net_forecast := NEW.quantity - NEW.quantity_received;

    -- Différence à appliquer au prévisionnel
    v_qty_diff := v_new_net_forecast - v_old_net_forecast;

    -- ✅ Créer mouvement SEULEMENT si différence non nulle
    IF v_qty_diff != 0 THEN

      -- ✅ Créer stock_movement pour ajuster forecasted_in
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
          WHEN v_qty_diff > 0 THEN 'IN'   -- Augmentation prévisionnel
          ELSE 'OUT'                       -- Diminution prévisionnel
        END)::movement_type,
        v_qty_diff,  -- Peut être positif ou négatif
        stock_forecasted_in,
        stock_forecasted_in + v_qty_diff,
        'purchase_order',
        NEW.purchase_order_id,
        format('Ajustement forecasted_in: Quantité modifiée %s → %s (net: %s → %s) - PO %s',
               OLD.quantity, NEW.quantity, v_old_net_forecast, v_new_net_forecast, v_po_number),
        'purchase_reception',
        true,  -- ✅ Affecte forecast
        'in',  -- ✅ Type forecast IN
        v_performed_by,
        NOW()
      FROM products WHERE id = NEW.product_id;

      RAISE NOTICE '✅ [BUG #5 FIX] Forecasted_in ajusté pour produit % (diff: %s = %s - %s) - PO %',
        NEW.product_id, v_qty_diff, v_new_net_forecast, v_old_net_forecast, v_po_number;
    ELSE
      RAISE NOTICE 'ℹ️ Quantité modifiée mais net forecast identique (produit: %, PO: %)',
        NEW.product_id, v_po_number;
    END IF;

  END IF;

  RETURN NEW;
END;
$function$;

-- =============================================
-- CREATE TRIGGER
-- =============================================

CREATE TRIGGER trigger_handle_po_item_quantity_change_confirmed
  AFTER UPDATE OF quantity
  ON purchase_order_items
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
  EXECUTE FUNCTION handle_po_item_quantity_change_confirmed();

COMMENT ON FUNCTION handle_po_item_quantity_change_confirmed() IS
'Trigger: Ajuste stock_forecasted_in quand quantity modifiée dans PO confirmée/partiellement reçue (Bug #5 fix 2025-11-14).
Workflow: UPDATE quantity → Calcul différentiel net → stock_movement (forecast) → products.forecasted_in → alerts.
Cascade: Trigger existant update_product_stock_advanced_trigger recalcule forecasted_in.
Note: Coexiste avec trigger existant track_product_quantity_updated_in_draft (status=draft uniquement).';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger handle_po_item_quantity_change_confirmed() créé avec BUG #5 fixé (Part 1/2)';
  RAISE NOTICE '   Déclenché sur UPDATE quantity pour PO confirmed/partially_received';
  RAISE NOTICE '   Calcul différentiel: (NEW.quantity - NEW.quantity_received) - (OLD.quantity - OLD.quantity_received)';
  RAISE NOTICE '   Cascade: stock_movements → products.forecasted_in → alerts';
  RAISE NOTICE '   Coexiste avec trigger existant pour status=draft';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';
\echo '✅ MIGRATION 001 TERMINÉE (Part 1/2)';
\echo '========================================';
\echo '';
\echo 'Correction effectuée:';
\echo '1. Trigger créé pour UPDATE quantity sur PO confirmées';
\echo '2. Calcul différentiel net (prend en compte quantity_received)';
\echo '3. Ajustement forecasted_in via stock_movements';
\echo '4. Cascade automatique vers alertes stock';
\echo '';

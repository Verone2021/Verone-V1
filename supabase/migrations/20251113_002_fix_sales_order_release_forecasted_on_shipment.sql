-- Migration: Fix handle_sales_order_stock to release forecasted_out on shipment
-- Bug: When warehouse_exit_at is filled, only creates real OUT movement
--      but doesn't release the forecasted_out reservation
-- Impact: Double counting of stock (forecasted + real)
-- Priority: P0 - CRITICAL

DROP FUNCTION IF EXISTS handle_sales_order_stock() CASCADE;

CREATE OR REPLACE FUNCTION handle_sales_order_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_forecasted_qty INTEGER; -- ✅ NOUVEAU pour calcul libération
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- Case 1: Confirmation (draft → confirmed)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'confirmed' AND OLD.status = 'draft' THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        -v_item.quantity,  -- Négatif = réservation sortie
        'OUT',
        true,              -- Affecte forecasted
        'out',
        'sales_order',
        NEW.id,
        'Réservation stock pour SO #' || NEW.order_number
      );
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 2: Annulation validation (confirmed → draft)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'draft' AND OLD.status = 'confirmed' THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        v_item.quantity,   -- Positif = libération réservation
        'IN',
        true,
        'out',
        'sales_order',
        NEW.id,
        'Libération réservation SO #' || NEW.order_number || ' (retour draft)'
      );
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 3: Annulation commande
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        v_item.quantity,
        'IN',
        true,
        'out',
        'sales_order',
        NEW.id,
        'Libération réservation SO #' || NEW.order_number || ' (annulation)'
      );
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 4: Expédition (CORRECTION PRINCIPALE)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.warehouse_exit_at IS NOT NULL AND OLD.warehouse_exit_at IS NULL THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP

      -- ✅ NOUVEAU : Calculer quantité forecasted_out à libérer
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      INTO v_forecasted_qty
      FROM stock_movements
      WHERE reference_type = 'sales_order'
        AND reference_id = NEW.id
        AND product_id = v_item.product_id
        AND affects_forecast = true
        AND forecast_type = 'out';

      -- ✅ NOUVEAU : Libérer forecasted_out AVANT créer mouvement réel
      IF v_forecasted_qty > 0 THEN
        INSERT INTO stock_movements (
          product_id,
          quantity_change,
          movement_type,
          affects_forecast,
          forecast_type,
          reference_type,
          reference_id,
          notes
        ) VALUES (
          v_item.product_id,
          v_forecasted_qty,  -- Positif = libération
          'IN',
          true,
          'out',
          'sales_order',
          NEW.id,
          'Libération réservation SO #' || NEW.order_number || ' (expédition)'
        );
      END IF;

      -- Créer mouvement réel (code existant)
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        -v_item.quantity,  -- Négatif = sortie réelle
        'OUT',
        false,             -- N'affecte PAS forecasted
        NULL,
        'sales_order',
        NEW.id,
        'Sortie stock réelle SO #' || NEW.order_number
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer trigger
CREATE TRIGGER trigger_handle_sales_order_stock
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_sales_order_stock();

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Gère les mouvements de stock pour les commandes clients (sales_orders).
CORRECTION 2025-11-13 : Libère forecasted_out lors de l''expédition pour éviter double comptabilisation.';

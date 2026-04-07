-- Migration: Fix stock forecast rollback on devalidation and cancellation
--
-- Bug 1: PO validated→cancelled does NOT rollback products.stock_forecasted_in
--   Cause: trigger_po_cancellation_rollback was dropped on 2025-11-28 (migration 009)
--   Fix: Add validated→cancelled branch in update_forecasted_stock_on_po_validation
--
-- Bug 2: SO validated→draft leaves orphan stock_movements (sales_order_forecast)
--   Cause: rollback_forecasted_out_on_so_devalidation only touches products, not stock_movements
--   Fix: Add DELETE stock_movements in the rollback function
--
-- Bug 3: SO validated→cancelled also needs stock_movements cleanup + stock_alert_tracking sync
--
-- Data fixes: Coussin Rêveur drift +2, Rond paille S alert_tracking drift +1
--
-- IMPORTANT: These triggers are PROTECTED after this fix.
-- See .claude/rules/dev/stock-triggers-protected.md
--
-- Date: 2026-04-07

-- ============================================================
-- 1. Fix PO trigger: add validated→cancelled rollback
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_forecasted_stock_on_po_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
BEGIN
  -- draft → validated : Add quantities to stock_forecasted_in
  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    FOR v_item IN
      SELECT product_id, quantity, quantity_received
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      UPDATE products
      SET stock_forecasted_in = COALESCE(stock_forecasted_in, 0) + (v_item.quantity - COALESCE(v_item.quantity_received, 0)),
          updated_at = NOW()
      WHERE id = v_item.product_id;

      UPDATE stock_alert_tracking
      SET stock_forecasted_in = COALESCE(stock_forecasted_in, 0) + (v_item.quantity - COALESCE(v_item.quantity_received, 0)),
          updated_at = NOW()
      WHERE product_id = v_item.product_id;
    END LOOP;
  END IF;

  -- validated → draft (devalidation) : Rollback quantities
  IF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    FOR v_item IN
      SELECT product_id, quantity, quantity_received
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      UPDATE products
      SET stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - (v_item.quantity - COALESCE(v_item.quantity_received, 0))),
          updated_at = NOW()
      WHERE id = v_item.product_id;

      UPDATE stock_alert_tracking
      SET stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - (v_item.quantity - COALESCE(v_item.quantity_received, 0))),
          updated_at = NOW()
      WHERE product_id = v_item.product_id;
    END LOOP;
  END IF;

  -- validated → cancelled : Same rollback as devalidation
  -- (cancelled and draft have the same impact on stock: zero)
  IF OLD.status IN ('validated', 'partially_received') AND NEW.status = 'cancelled' THEN
    FOR v_item IN
      SELECT product_id, quantity, quantity_received
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      UPDATE products
      SET stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - (v_item.quantity - COALESCE(v_item.quantity_received, 0))),
          updated_at = NOW()
      WHERE id = v_item.product_id;

      UPDATE stock_alert_tracking
      SET stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - (v_item.quantity - COALESCE(v_item.quantity_received, 0))),
          updated_at = NOW()
      WHERE product_id = v_item.product_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 2. Fix SO devalidation: delete stock_movements forecast + sync alert_tracking
-- ============================================================

CREATE OR REPLACE FUNCTION public.rollback_forecasted_out_on_so_devalidation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
BEGIN
  IF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    FOR v_item IN
      SELECT product_id, quantity, quantity_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
      -- Rollback products.stock_forecasted_out
      UPDATE products
      SET stock_forecasted_out = GREATEST(0, COALESCE(stock_forecasted_out, 0) - (v_item.quantity - COALESCE(v_item.quantity_shipped, 0))),
          updated_at = NOW()
      WHERE id = v_item.product_id;

      -- Sync stock_alert_tracking
      UPDATE stock_alert_tracking
      SET stock_forecasted_out = GREATEST(0, COALESCE(stock_forecasted_out, 0) - (v_item.quantity - COALESCE(v_item.quantity_shipped, 0))),
          updated_at = NOW()
      WHERE product_id = v_item.product_id;
    END LOOP;

    -- Delete orphan forecast movements
    DELETE FROM stock_movements
    WHERE reference_type = 'sales_order_forecast'
      AND reference_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 3. Fix SO cancellation: also rollback forecast (same as devalidation)
--    The existing rollback_so_forecasted handles products.stock_forecasted_out
--    but not stock_movements and stock_alert_tracking
-- ============================================================

CREATE OR REPLACE FUNCTION public.rollback_so_forecasted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
BEGIN
  -- Only rollback if coming from validated or partially_shipped
  IF OLD.status IN ('validated', 'partially_shipped') AND NEW.status = 'cancelled' THEN
    FOR v_item IN
      SELECT product_id, quantity, quantity_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
      UPDATE products
      SET stock_forecasted_out = GREATEST(0, COALESCE(stock_forecasted_out, 0) - (v_item.quantity - COALESCE(v_item.quantity_shipped, 0))),
          updated_at = NOW()
      WHERE id = v_item.product_id;

      -- Sync stock_alert_tracking
      UPDATE stock_alert_tracking
      SET stock_forecasted_out = GREATEST(0, COALESCE(stock_forecasted_out, 0) - (v_item.quantity - COALESCE(v_item.quantity_shipped, 0))),
          updated_at = NOW()
      WHERE product_id = v_item.product_id;
    END LOOP;

    -- Delete orphan forecast movements
    DELETE FROM stock_movements
    WHERE reference_type = 'sales_order_forecast'
      AND reference_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 4. Data fixes (already applied in production, included for idempotency)
-- ============================================================

-- Coussin Rêveur: forecasted_out should be 3 (was 5, drift from pre-march shipment)
UPDATE products SET stock_forecasted_out = 3, updated_at = NOW() WHERE sku = 'COU-0001' AND stock_forecasted_out > 3;
UPDATE stock_alert_tracking SET stock_forecasted_out = 3, updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE sku = 'COU-0001') AND stock_forecasted_out > 3;

-- Rond paille S: alert_tracking forecasted_out should match products (1, not 2)
UPDATE stock_alert_tracking SET stock_forecasted_out = (
  SELECT stock_forecasted_out FROM products WHERE sku = 'DEC-0002'
), updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE sku = 'DEC-0002');

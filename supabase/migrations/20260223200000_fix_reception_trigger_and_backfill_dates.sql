-- Migration: Fix reception trigger to use actual reception date instead of NOW()
-- Also backfill purchase_orders.received_at and expected_delivery_date for existing POs
--
-- Problem:
--   The trigger update_stock_on_reception() sets received_at = NOW() instead of
--   using the actual reception date entered by the user (NEW.received_at).
--   This means purchase_orders.received_at reflects when the trigger ran, not
--   when the goods were actually received.
--
-- Fix:
--   1. Use NEW.received_at instead of NOW() for fully received POs
--   2. Also update received_at for partially_received POs (last reception date)
--   3. Backfill existing POs with the correct dates from purchase_order_receptions

-- ============================================================
-- Step 1: Fix the trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_stock_on_reception()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_po_number TEXT;
    v_total_quantity INTEGER;
    v_total_received INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
    v_poi_id UUID;
    v_unit_cost NUMERIC;
BEGIN
    SELECT stock_real INTO v_stock_before
    FROM products
    WHERE id = NEW.product_id;

    SELECT id, unit_price_ht INTO v_poi_id, v_unit_cost
    FROM purchase_order_items
    WHERE purchase_order_id = NEW.purchase_order_id
      AND product_id = NEW.product_id
    LIMIT 1;

    UPDATE products
    SET
        stock_real = stock_real + NEW.quantity_received,
        stock_forecasted_in = stock_forecasted_in - NEW.quantity_received
    WHERE id = NEW.product_id
    RETURNING stock_real INTO v_stock_after;

    INSERT INTO stock_movements (
        product_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, notes, reason_code, performed_by,
        unit_cost, purchase_order_item_id
    ) VALUES (
        NEW.product_id, 'IN', NEW.quantity_received, v_stock_before, v_stock_after,
        'reception', NEW.id,
        'Reception commande fournisseur PO #' || (SELECT po_number FROM purchase_orders WHERE id = NEW.purchase_order_id),
        'purchase_reception', NEW.received_by,
        v_unit_cost, v_poi_id
    );

    UPDATE purchase_order_items
    SET quantity_received = quantity_received + NEW.quantity_received
    WHERE purchase_order_id = NEW.purchase_order_id AND product_id = NEW.product_id;

    SELECT po_number INTO v_po_number
    FROM purchase_orders WHERE id = NEW.purchase_order_id;

    SELECT SUM(quantity), SUM(quantity_received)
    INTO v_total_quantity, v_total_received
    FROM purchase_order_items WHERE purchase_order_id = NEW.purchase_order_id;

    IF v_total_received >= v_total_quantity THEN
        UPDATE purchase_orders
        SET status = 'received',
            received_at = NEW.received_at,  -- Use actual reception date, not NOW()
            received_by = NEW.received_by
        WHERE id = NEW.purchase_order_id AND status != 'received';
        RAISE NOTICE 'PO % fully received', v_po_number;
    ELSIF v_total_received > 0 THEN
        UPDATE purchase_orders
        SET status = 'partially_received',
            received_at = NEW.received_at  -- Track last reception date
        WHERE id = NEW.purchase_order_id AND status NOT IN ('received');
        RAISE NOTICE 'PO % partially received', v_po_number;
    END IF;

    RETURN NEW;
END;
$function$;

-- ============================================================
-- Step 2: Backfill purchase_orders.received_at with actual reception dates
-- For each PO, use the MAX(received_at) from purchase_order_receptions
-- ============================================================
UPDATE purchase_orders po
SET received_at = sub.last_reception
FROM (
    SELECT purchase_order_id, MAX(received_at) as last_reception
    FROM purchase_order_receptions
    GROUP BY purchase_order_id
) sub
WHERE po.id = sub.purchase_order_id
  AND po.status IN ('received', 'partially_received')
  AND sub.last_reception IS NOT NULL;

-- ============================================================
-- Step 3: Backfill expected_delivery_date for received POs that have NULL
-- Use the earliest reception date as the expected delivery date
-- ============================================================
UPDATE purchase_orders po
SET expected_delivery_date = sub.first_reception::date
FROM (
    SELECT purchase_order_id, MIN(received_at) as first_reception
    FROM purchase_order_receptions
    GROUP BY purchase_order_id
) sub
WHERE po.id = sub.purchase_order_id
  AND po.expected_delivery_date IS NULL
  AND po.status IN ('received', 'partially_received');

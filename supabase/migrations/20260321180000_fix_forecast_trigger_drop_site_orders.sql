-- Fix: forecast movements trigger crashes on site-internet orders (no performed_by user)
-- The webhook updates status to 'validated' but the trigger needs a user ID for stock_movements.
-- Fix: use system user as fallback when no human user is available.

CREATE OR REPLACE FUNCTION create_sales_order_forecast_movements(p_sales_order_id uuid, p_performed_by uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_user_id UUID;
    v_system_user_id UUID;
BEGIN
    SELECT * INTO v_order FROM sales_orders WHERE id = p_sales_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande vente introuvable: %', p_sales_order_id;
    END IF;

    -- Get a system user as fallback for site-internet orders (no human user)
    SELECT id INTO v_system_user_id FROM auth.users WHERE email = 'veronebyromeo@gmail.com' LIMIT 1;

    v_user_id := COALESCE(p_performed_by, v_order.confirmed_by, v_order.created_by, v_system_user_id);

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No user found for forecast movements, skipping for order %', v_order.order_number;
        RETURN;
    END IF;

    FOR v_item IN
        SELECT * FROM sales_order_items
        WHERE sales_order_id = p_sales_order_id
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'sales_order_forecast'
            AND reference_id = p_sales_order_id
            AND product_id = v_item.product_id
        ) THEN
            INSERT INTO stock_movements (
                product_id, movement_type, quantity_change, quantity_before, quantity_after,
                reference_type, reference_id, notes, reason_code, affects_forecast, forecast_type,
                performed_by, performed_at
            ) VALUES (
                v_item.product_id, 'OUT', -v_item.quantity, 0, 0,
                'sales_order_forecast', p_sales_order_id,
                'Commande client confirmée - Stock prévisionnel OUT',
                'sale', true, 'out', v_user_id,
                COALESCE(v_order.confirmed_at, CURRENT_TIMESTAMP)
            );
        END IF;
    END LOOP;
END;
$$;

-- Drop obsolete site_orders table (all orders now go to sales_orders)
DROP TRIGGER IF EXISTS trg_site_order_paid_notification ON site_orders;
DROP TRIGGER IF EXISTS trg_generate_site_order_number ON site_orders;
DROP TRIGGER IF EXISTS trg_compute_site_order_tax ON site_orders;
DROP TRIGGER IF EXISTS trg_generate_site_invoice_number ON site_orders;
DROP TABLE IF EXISTS site_orders CASCADE;

-- Drop obsolete sequences
DROP SEQUENCE IF EXISTS site_order_number_seq;
DROP SEQUENCE IF EXISTS site_invoice_number_seq;

-- Drop obsolete functions
DROP FUNCTION IF EXISTS generate_site_order_number();
DROP FUNCTION IF EXISTS compute_site_order_tax();
DROP FUNCTION IF EXISTS generate_site_invoice_number();
DROP FUNCTION IF EXISTS notify_backoffice_on_site_order_paid();

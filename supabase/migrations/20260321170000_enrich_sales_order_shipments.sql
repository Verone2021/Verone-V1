-- Enrich sales_order_shipments with delivery method, carrier info, and Packlink fields
-- Supports 3 delivery modes: pickup (retrait client), hand_delivery (main propre), parcel (envoi colis)

-- Delivery method
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'parcel';
-- Values: 'pickup' (retrait client), 'hand_delivery' (main propre), 'parcel' (envoi colis)

-- Carrier info
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS carrier_name TEXT;
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS carrier_service TEXT;
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2);
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS label_url TEXT;
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS estimated_delivery_at TIMESTAMPTZ;

-- Packlink specific
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS packlink_shipment_id TEXT;
ALTER TABLE sales_order_shipments ADD COLUMN IF NOT EXISTS packlink_label_url TEXT;

-- Update trigger to propagate carrier info to stock_movements
CREATE OR REPLACE FUNCTION update_stock_on_shipment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_before INTEGER;
  v_stock_after INTEGER;
  v_total_shipped INTEGER;
  v_total_ordered INTEGER;
  v_so_status TEXT;
BEGIN
  -- Get current stock
  SELECT stock_real INTO v_stock_before FROM products WHERE id = NEW.product_id;
  v_stock_after := v_stock_before - NEW.quantity_shipped;

  -- Update product stock
  UPDATE products
  SET stock_real = stock_real - NEW.quantity_shipped,
      stock_forecasted_out = GREATEST(0, stock_forecasted_out - NEW.quantity_shipped),
      updated_at = NOW()
  WHERE id = NEW.product_id;

  -- Create stock movement with carrier info
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    reference_type, reference_id, reason_code,
    carrier_name, tracking_number, delivery_note, shipped_by_name,
    performed_by, performed_at, affects_forecast
  ) VALUES (
    NEW.product_id, 'OUT', -NEW.quantity_shipped, v_stock_before, v_stock_after,
    'shipment', NEW.id, 'sale',
    NEW.carrier_name, NEW.tracking_number, NEW.notes,
    (SELECT COALESCE(raw_user_meta_data->>'first_name', 'Staff') FROM auth.users WHERE id = NEW.shipped_by),
    NEW.shipped_by, NEW.shipped_at, true
  );

  -- Update sales_order_items quantity_shipped
  UPDATE sales_order_items
  SET quantity_shipped = quantity_shipped + NEW.quantity_shipped,
      updated_at = NOW()
  WHERE sales_order_id = NEW.sales_order_id
    AND product_id = NEW.product_id;

  -- Recalculate sales_order status
  SELECT SUM(soi.quantity_shipped), SUM(soi.quantity)
  INTO v_total_shipped, v_total_ordered
  FROM sales_order_items soi
  WHERE soi.sales_order_id = NEW.sales_order_id;

  IF v_total_shipped >= v_total_ordered THEN
    UPDATE sales_orders
    SET status = 'shipped', shipped_at = NOW(), shipped_by = NEW.shipped_by, updated_at = NOW()
    WHERE id = NEW.sales_order_id AND status IN ('validated', 'partially_shipped');
  ELSIF v_total_shipped > 0 THEN
    UPDATE sales_orders
    SET status = 'partially_shipped', updated_at = NOW()
    WHERE id = NEW.sales_order_id AND status = 'validated';
  END IF;

  RETURN NEW;
END;
$$;

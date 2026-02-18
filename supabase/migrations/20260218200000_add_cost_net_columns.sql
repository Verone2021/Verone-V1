-- Migration: Add NET cost columns (HT + allocated fees: shipping, customs, insurance)
-- This enables displaying both raw HT prices and NET prices in product detail pages

-- 1a. Add unit_cost_net to product_purchase_history
ALTER TABLE product_purchase_history
  ADD COLUMN unit_cost_net NUMERIC(10,2);

-- 1b. Add cost_net_* columns to products
ALTER TABLE products
  ADD COLUMN cost_net_avg NUMERIC(10,2),
  ADD COLUMN cost_net_min NUMERIC(10,2),
  ADD COLUMN cost_net_max NUMERIC(10,2),
  ADD COLUMN cost_net_last NUMERIC(10,2);

-- 1c. Backfill product_purchase_history.unit_cost_net from purchase_order_items
UPDATE product_purchase_history pph
SET unit_cost_net = poi.unit_cost_net
FROM purchase_order_items poi
WHERE pph.purchase_order_item_id = poi.id
  AND poi.unit_cost_net IS NOT NULL;

-- 1d. Backfill products.cost_net_* from product_purchase_history
UPDATE products p
SET
  cost_net_avg = sub.avg_net,
  cost_net_min = sub.min_net,
  cost_net_max = sub.max_net,
  cost_net_last = sub.last_net
FROM (
  SELECT
    product_id,
    ROUND((SUM(unit_cost_net * quantity) / NULLIF(SUM(quantity), 0))::numeric, 2) as avg_net,
    MIN(unit_cost_net) as min_net,
    MAX(unit_cost_net) as max_net,
    (ARRAY_AGG(unit_cost_net ORDER BY purchased_at DESC))[1] as last_net
  FROM product_purchase_history
  WHERE unit_cost_net IS NOT NULL AND unit_cost_net > 0
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

-- 1e. Update trigger function to also handle NET cost columns
CREATE OR REPLACE FUNCTION update_product_cost_price_pmp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_status TEXT;
  v_po_received_at TIMESTAMPTZ;
  v_avg_price NUMERIC;
  v_min_price NUMERIC;
  v_max_price NUMERIC;
  v_last_price NUMERIC;
  v_count INTEGER;
  -- NET cost variables
  v_unit_cost_net NUMERIC;
  v_avg_net NUMERIC;
  v_min_net NUMERIC;
  v_max_net NUMERIC;
  v_last_net NUMERIC;
BEGIN
  SELECT status, received_at INTO v_po_status, v_po_received_at
  FROM purchase_orders WHERE id = NEW.purchase_order_id;

  IF v_po_status = 'received' THEN
    -- Get unit_cost_net from the purchase_order_item
    v_unit_cost_net := NEW.unit_cost_net;

    -- Upsert into product_purchase_history (now including unit_cost_net)
    INSERT INTO product_purchase_history (
      product_id, purchase_order_id, purchase_order_item_id,
      unit_price_ht, unit_cost_net, quantity, purchased_at
    )
    VALUES (
      NEW.product_id, NEW.purchase_order_id, NEW.id,
      NEW.unit_price_ht, v_unit_cost_net, NEW.quantity,
      COALESCE(v_po_received_at, NOW())
    )
    ON CONFLICT (product_id, purchase_order_item_id) DO UPDATE SET
      unit_price_ht = EXCLUDED.unit_price_ht,
      unit_cost_net = EXCLUDED.unit_cost_net,
      quantity = EXCLUDED.quantity,
      purchased_at = EXCLUDED.purchased_at;

    -- Calculate HT aggregates (existing logic)
    SELECT
      SUM(unit_price_ht * quantity) / NULLIF(SUM(quantity), 0),
      MIN(unit_price_ht),
      MAX(unit_price_ht),
      COUNT(*)
    INTO v_avg_price, v_min_price, v_max_price, v_count
    FROM product_purchase_history
    WHERE product_id = NEW.product_id;

    SELECT unit_price_ht INTO v_last_price
    FROM product_purchase_history
    WHERE product_id = NEW.product_id
    ORDER BY purchased_at DESC, created_at DESC LIMIT 1;

    -- Calculate NET aggregates (new logic)
    SELECT
      ROUND((SUM(unit_cost_net * quantity) / NULLIF(SUM(quantity), 0))::numeric, 2),
      MIN(unit_cost_net),
      MAX(unit_cost_net)
    INTO v_avg_net, v_min_net, v_max_net
    FROM product_purchase_history
    WHERE product_id = NEW.product_id
      AND unit_cost_net IS NOT NULL AND unit_cost_net > 0;

    SELECT unit_cost_net INTO v_last_net
    FROM product_purchase_history
    WHERE product_id = NEW.product_id
      AND unit_cost_net IS NOT NULL AND unit_cost_net > 0
    ORDER BY purchased_at DESC, created_at DESC LIMIT 1;

    -- Update products with both HT and NET aggregates
    UPDATE products SET
      cost_price = COALESCE(v_avg_price, cost_price),
      cost_price_avg = v_avg_price,
      cost_price_min = v_min_price,
      cost_price_max = v_max_price,
      cost_price_last = v_last_price,
      cost_price_count = v_count,
      cost_net_avg = v_avg_net,
      cost_net_min = v_min_net,
      cost_net_max = v_max_net,
      cost_net_last = v_last_net,
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

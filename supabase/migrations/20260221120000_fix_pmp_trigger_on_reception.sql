-- Migration: Fix PMP trigger missing on PO reception
-- Problem: trigger_update_cost_price_pmp fires on purchase_order_items AFTER UPDATE,
--          but at that point purchase_orders.status is still 'validated' (not yet 'received').
--          The status transitions to 'received' AFTER the PMP trigger has already run → SKIP.
-- Solution: Add a trigger on purchase_orders AFTER UPDATE that fires when status → 'received'.

-- ============================================================
-- PART 1: Function to update PMP for all items of a given PO
-- ============================================================

CREATE OR REPLACE FUNCTION update_product_pmp_on_po_received(p_po_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_received_at TIMESTAMPTZ;
BEGIN
  -- Get the received_at timestamp of the PO
  SELECT received_at INTO v_received_at
  FROM purchase_orders
  WHERE id = p_po_id;

  -- Loop over all items of this PO that have a linked product
  FOR v_item IN
    SELECT
      poi.id           AS item_id,
      poi.product_id,
      poi.unit_price_ht,
      poi.unit_cost_net,
      poi.quantity
    FROM purchase_order_items poi
    WHERE poi.purchase_order_id = p_po_id
      AND poi.product_id IS NOT NULL
      AND poi.unit_price_ht IS NOT NULL
  LOOP
    -- Upsert into product_purchase_history (idempotent via unique constraint)
    INSERT INTO product_purchase_history (
      product_id,
      purchase_order_id,
      purchase_order_item_id,
      unit_price_ht,
      unit_cost_net,
      quantity,
      purchased_at
    ) VALUES (
      v_item.product_id,
      p_po_id,
      v_item.item_id,
      v_item.unit_price_ht,
      v_item.unit_cost_net,
      v_item.quantity,
      COALESCE(v_received_at, NOW())
    )
    ON CONFLICT (product_id, purchase_order_item_id) DO UPDATE SET
      unit_price_ht = EXCLUDED.unit_price_ht,
      unit_cost_net = EXCLUDED.unit_cost_net,
      quantity      = EXCLUDED.quantity,
      purchased_at  = EXCLUDED.purchased_at;

    -- Recalculate PMP from full history for this product
    UPDATE products SET
      -- HT columns (from all receptions)
      cost_price     = (
        SELECT ROUND(SUM(unit_price_ht * quantity) / NULLIF(SUM(quantity), 0), 2)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
      ),
      cost_price_avg = (
        SELECT ROUND(SUM(unit_price_ht * quantity) / NULLIF(SUM(quantity), 0), 2)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
      ),
      cost_price_min = (
        SELECT MIN(unit_price_ht)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
      ),
      cost_price_max = (
        SELECT MAX(unit_price_ht)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
      ),
      cost_price_last = (
        SELECT unit_price_ht
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
        ORDER BY purchased_at DESC, created_at DESC
        LIMIT 1
      ),
      cost_price_count = (
        SELECT COUNT(*)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
      ),
      -- NET columns (only from receptions with allocated fees)
      cost_net_avg = (
        SELECT ROUND(SUM(unit_cost_net * quantity) / NULLIF(SUM(quantity), 0), 2)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
          AND unit_cost_net IS NOT NULL
          AND unit_cost_net > 0
      ),
      cost_net_min = (
        SELECT MIN(unit_cost_net)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
          AND unit_cost_net IS NOT NULL
          AND unit_cost_net > 0
      ),
      cost_net_max = (
        SELECT MAX(unit_cost_net)
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
          AND unit_cost_net IS NOT NULL
          AND unit_cost_net > 0
      ),
      cost_net_last = (
        SELECT unit_cost_net
        FROM product_purchase_history
        WHERE product_id = v_item.product_id
          AND unit_cost_net IS NOT NULL
          AND unit_cost_net > 0
        ORDER BY purchased_at DESC, created_at DESC
        LIMIT 1
      ),
      updated_at = NOW()
    WHERE id = v_item.product_id;
  END LOOP;
END;
$$;

-- ============================================================
-- PART 2: Trigger function on purchase_orders
-- ============================================================

CREATE OR REPLACE FUNCTION trg_fn_update_pmp_on_po_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fires when status transitions to 'received'
  IF NEW.status = 'received' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM update_product_pmp_on_po_received(NEW.id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the reception even if PMP update fails
  RAISE WARNING 'PMP update failed for PO %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- PART 3: Attach trigger to purchase_orders
-- ============================================================

DROP TRIGGER IF EXISTS trg_update_pmp_on_po_received ON purchase_orders;

CREATE TRIGGER trg_update_pmp_on_po_received
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'received')
  EXECUTE FUNCTION trg_fn_update_pmp_on_po_received();

-- ============================================================
-- PART 4: Backfill — PO already received on 2026-02-21
-- ============================================================

-- The 21 products received under PO 9aabffa7-ed99-4bed-bea3-2c56bcd066be
-- have cost_price_avg = NULL because the trigger sequence bug affected them.
-- We call the function directly to backfill their PMP.

DO $$
BEGIN
  PERFORM update_product_pmp_on_po_received('9aabffa7-ed99-4bed-bea3-2c56bcd066be');
  RAISE NOTICE 'Backfill PMP completed for PO 9aabffa7-ed99-4bed-bea3-2c56bcd066be';
END;
$$;

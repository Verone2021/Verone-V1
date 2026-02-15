-- Migration: Fix calculate_retrocession_amount() trigger
--
-- TWO fixes:
-- 1. Use locked prices (base_price_ht_locked) when available, preventing
--    past commissions from being corrupted when channel_pricing changes.
-- 2. Add unit_price_ht, quantity, linkme_selection_item_id to trigger events
--    so commission recalculates when these fields change (was only total_ht, retrocession_rate).

-- Fix 1: Update the trigger function
CREATE OR REPLACE FUNCTION calculate_retrocession_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_price NUMERIC;
BEGIN
  -- For LinkMe items: commission = (selling_price - base_price) x qty
  IF NEW.linkme_selection_item_id IS NOT NULL THEN
    -- Use locked price if available (validated/invoiced order)
    -- Otherwise fetch current price from selection items (new order)
    IF NEW.base_price_ht_locked IS NOT NULL THEN
      v_base_price := NEW.base_price_ht_locked;
    ELSE
      SELECT base_price_ht INTO v_base_price
      FROM linkme_selection_items
      WHERE id = NEW.linkme_selection_item_id;
    END IF;

    IF v_base_price IS NOT NULL THEN
      NEW.retrocession_amount := ROUND(
        (NEW.unit_price_ht - v_base_price) * NEW.quantity, 2
      );
    ELSE
      NEW.retrocession_amount := 0.00;
    END IF;
  -- For non-LinkMe items: rate-based formula (fallback)
  ELSIF NEW.retrocession_rate IS NOT NULL AND NEW.retrocession_rate > 0 THEN
    NEW.retrocession_amount := ROUND(
      (NEW.unit_price_ht * NEW.quantity) * (NEW.retrocession_rate / 100),
      2
    );
  ELSE
    NEW.retrocession_amount := 0.00;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix 2: Recreate trigger with correct events
DROP TRIGGER IF EXISTS trg_calculate_retrocession ON sales_order_items;
CREATE TRIGGER trg_calculate_retrocession
  BEFORE INSERT OR UPDATE OF unit_price_ht, quantity, retrocession_rate, linkme_selection_item_id
  ON sales_order_items
  FOR EACH ROW EXECUTE FUNCTION calculate_retrocession_amount();

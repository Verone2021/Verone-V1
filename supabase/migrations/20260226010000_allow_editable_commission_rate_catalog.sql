-- Migration: Allow editable commission rate for catalog products
-- ===============================================================
--
-- Context: The trigger previously ignored retrocession_rate for catalog products
-- (linkme_selection_item_id IS NOT NULL), computing commission as
-- (selling_price - base_price) × qty. This prevented back-office users from
-- editing the commission rate per-order.
--
-- Problem discovered: retrocession_rate has MIXED formats in DB:
--   - Old orders: integer format (15.00 = 15%)
--   - Recent orders: decimal format (0.15 = 15%)
-- This happened because the current frontend sends decimals, but the old code
-- sent integers. The trigger ignored the value for catalog items, so both coexisted.
--
-- Solution:
--   1. Normalize ALL catalog items to decimal format (divide values > 1 by 100)
--   2. Trigger uses decimal format: unit_price_ht × qty × retrocession_rate
--   3. Frontend already sends decimal format — no frontend change needed
--
-- The affiliate branch (linkme_selection_item_id IS NULL) is NOT modified.
-- ===============================================================

-- Step 1: Normalize existing catalog items from integer to decimal format
-- Only convert values > 1 (clearly integer format like 15.00, 17.65, etc.)
-- Values <= 1 are already decimal (0.15) or zero (0.00)
UPDATE sales_order_items
SET retrocession_rate = retrocession_rate / 100
WHERE linkme_selection_item_id IS NOT NULL
  AND retrocession_rate > 1;

-- Step 2: Replace the trigger function
CREATE OR REPLACE FUNCTION calculate_retrocession_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- For catalog products (linked to a selection item):
  -- commission = selling_price × quantity × retrocession_rate
  -- retrocession_rate is stored in DECIMAL format (0.20 = 20%)
  IF NEW.linkme_selection_item_id IS NOT NULL THEN
    NEW.retrocession_amount := ROUND(
      NEW.unit_price_ht * NEW.quantity * COALESCE(NEW.retrocession_rate, 0), 2
    );
  -- For affiliate products: rate-based formula with /100 (legacy integer format: 15 = 15%)
  -- NOT modified in this migration (separate scope)
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

-- =============================================================================
-- MIGRATION: Ecotax & Fee Allocation System
-- Date: 2026-02-09
-- Description:
--   1. Add fee allocation columns to purchase_order_items
--   2. Fix tax_rate bug in purchase order triggers (decimal vs percentage)
--   3. Fix fees_vat_rate being ignored in charge recalculation
--   4. Add proportional fee allocation trigger
--   5. Add unit_cost_net calculation
-- =============================================================================

-- =============================================================================
-- PART 1: Add columns to purchase_order_items
-- =============================================================================

-- Increase eco_tax precision from NUMERIC(10,2) to NUMERIC(10,4) for exact values like 0.1225
ALTER TABLE purchase_order_items ALTER COLUMN eco_tax TYPE NUMERIC(10,4);

ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS allocated_shipping_ht NUMERIC(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS allocated_customs_ht NUMERIC(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS allocated_insurance_ht NUMERIC(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS unit_cost_net NUMERIC(12,4);

COMMENT ON COLUMN purchase_order_items.allocated_shipping_ht IS 'Shipping cost allocated proportionally to this line (by HT amount ratio)';
COMMENT ON COLUMN purchase_order_items.allocated_customs_ht IS 'Customs cost allocated proportionally to this line (by HT amount ratio)';
COMMENT ON COLUMN purchase_order_items.allocated_insurance_ht IS 'Insurance cost allocated proportionally to this line (by HT amount ratio)';
COMMENT ON COLUMN purchase_order_items.unit_cost_net IS 'Net unit cost = unit_price_ht + eco_tax + (allocated_fees / quantity)';

-- =============================================================================
-- PART 2: Fix recalculate_purchase_order_totals trigger
--         Bug: tax_rate stored as decimal (0.20) but trigger divides by 100
--         Same bug was fixed for sales_orders in 20251224_001 but NOT for POs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_purchase_order_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_order_id UUID;
  v_total_ht NUMERIC(12,2);
  v_eco_tax_total NUMERIC(12,2);
  v_shipping_cost NUMERIC(12,2);
  v_customs_cost NUMERIC(12,2);
  v_insurance_cost NUMERIC(12,2);
  v_tax_rate NUMERIC;
  v_fees_vat_rate NUMERIC;
  v_total_charges NUMERIC(12,2);
BEGIN
  -- Determine order_id based on operation (INSERT/UPDATE vs DELETE)
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.purchase_order_id;
  ELSE
    v_order_id := NEW.purchase_order_id;
  END IF;

  -- Calculate items total HT (with discount) and eco_tax
  SELECT
    COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)), 0),
    COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
  INTO v_total_ht, v_eco_tax_total
  FROM purchase_order_items
  WHERE purchase_order_id = v_order_id;

  -- Retrieve all charges from the order
  -- tax_rate is stored as decimal (0.20 = 20%), default to 0.20
  SELECT
    COALESCE(shipping_cost_ht, 0),
    COALESCE(customs_cost_ht, 0),
    COALESCE(insurance_cost_ht, 0),
    COALESCE(tax_rate, 0.20),
    COALESCE(fees_vat_rate, tax_rate, 0.20)
  INTO v_shipping_cost, v_customs_cost, v_insurance_cost, v_tax_rate, v_fees_vat_rate
  FROM purchase_orders WHERE id = v_order_id;

  -- Total additional charges
  v_total_charges := v_shipping_cost + v_customs_cost + v_insurance_cost;

  -- Update totals
  -- FIX: Use (1 + tax_rate) directly since tax_rate is already decimal
  -- FIX: Apply fees_vat_rate to charges instead of tax_rate
  UPDATE purchase_orders
  SET
    total_ht = v_total_ht + v_eco_tax_total,
    total_ttc = ((v_total_ht + v_eco_tax_total) * (1 + v_tax_rate))
              + (v_total_charges * (1 + v_fees_vat_rate)),
    eco_tax_total = v_eco_tax_total,
    updated_at = NOW()
  WHERE id = v_order_id;

  RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION public.recalculate_purchase_order_totals() IS 'Recalculates PO totals when items change. Fixed 2026-02-09: tax_rate is decimal (0.20), uses fees_vat_rate for charges.';

-- =============================================================================
-- PART 3: Fix recalc_purchase_order_on_charges_change trigger
--         Bug: same tax_rate decimal bug + fees_vat_rate ignored
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalc_purchase_order_on_charges_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_charges NUMERIC(12,2);
  v_fees_vat_rate NUMERIC;
  v_tax_rate NUMERIC;
BEGIN
  -- Calculate total charges
  v_total_charges := COALESCE(NEW.shipping_cost_ht, 0)
                   + COALESCE(NEW.customs_cost_ht, 0)
                   + COALESCE(NEW.insurance_cost_ht, 0);

  -- FIX: tax_rate is decimal (0.20 = 20%), use directly
  v_tax_rate := COALESCE(NEW.tax_rate, 0.20);
  v_fees_vat_rate := COALESCE(NEW.fees_vat_rate, NEW.tax_rate, 0.20);

  -- Recalculate total_ttc with separate VAT rates for products vs charges
  NEW.total_ttc := (COALESCE(NEW.total_ht, 0) * (1 + v_tax_rate))
                 + (v_total_charges * (1 + v_fees_vat_rate));

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.recalc_purchase_order_on_charges_change() IS 'Recalculates total_ttc when charges change. Fixed 2026-02-09: tax_rate is decimal, uses fees_vat_rate for charges.';

-- =============================================================================
-- PART 4: Fee allocation trigger (proportional by HT amount)
--         Runs AFTER totals are recalculated, allocates global fees to each line
-- =============================================================================

CREATE OR REPLACE FUNCTION public.allocate_po_fees_and_calculate_unit_cost()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_po RECORD;
  v_total_items_ht NUMERIC;
BEGIN
  -- Retrieve global fees from the PO
  SELECT
    COALESCE(shipping_cost_ht, 0) AS shipping,
    COALESCE(customs_cost_ht, 0) AS customs,
    COALESCE(insurance_cost_ht, 0) AS insurance
  INTO v_po
  FROM purchase_orders
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- If no fees, just calculate unit_cost_net and return
  IF v_po.shipping = 0 AND v_po.customs = 0 AND v_po.insurance = 0 THEN
    -- Only update the current row for INSERT/UPDATE
    IF TG_OP != 'DELETE' THEN
      -- Calculate unit_cost_net without allocated fees
      NEW.allocated_shipping_ht := 0;
      NEW.allocated_customs_ht := 0;
      NEW.allocated_insurance_ht := 0;
      NEW.unit_cost_net := ROUND(
        NEW.unit_price_ht + COALESCE(NEW.eco_tax, 0),
        4
      );
    END IF;
    RETURN NEW;
  END IF;

  -- Calculate total items HT for proportional allocation
  -- Must include ALL items (not just current row)
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_items_ht
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- For INSERT, add the new row to the total (it's not yet in the table)
  IF TG_OP = 'INSERT' THEN
    v_total_items_ht := v_total_items_ht
      + (NEW.quantity * NEW.unit_price_ht * (1 - COALESCE(NEW.discount_percentage, 0) / 100));
  END IF;

  -- Allocate fees proportionally for the current row
  IF TG_OP != 'DELETE' AND v_total_items_ht > 0 THEN
    DECLARE
      v_line_ht NUMERIC;
      v_ratio NUMERIC;
    BEGIN
      v_line_ht := NEW.quantity * NEW.unit_price_ht * (1 - COALESCE(NEW.discount_percentage, 0) / 100);
      v_ratio := v_line_ht / v_total_items_ht;

      NEW.allocated_shipping_ht := ROUND(v_po.shipping * v_ratio, 2);
      NEW.allocated_customs_ht := ROUND(v_po.customs * v_ratio, 2);
      NEW.allocated_insurance_ht := ROUND(v_po.insurance * v_ratio, 2);

      -- Calculate unit_cost_net: all costs per unit
      NEW.unit_cost_net := ROUND(
        NEW.unit_price_ht
        + COALESCE(NEW.eco_tax, 0)
        + (NEW.allocated_shipping_ht + NEW.allocated_customs_ht + NEW.allocated_insurance_ht) / GREATEST(NEW.quantity, 1),
        4
      );
    END;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.allocate_po_fees_and_calculate_unit_cost() IS 'Allocates PO global fees (shipping, customs, insurance) proportionally to each line item by HT ratio, then calculates unit_cost_net.';

-- Create trigger (BEFORE INSERT OR UPDATE, runs before the totals trigger)
DROP TRIGGER IF EXISTS trigger_allocate_po_fees ON purchase_order_items;
CREATE TRIGGER trigger_allocate_po_fees
  BEFORE INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION allocate_po_fees_and_calculate_unit_cost();

-- =============================================================================
-- PART 5: Reallocate fees when PO charges change
--         When shipping/customs/insurance change on PO, re-run allocation on all items
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reallocate_po_fees_on_charges_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_items_ht NUMERIC;
  v_shipping NUMERIC;
  v_customs NUMERIC;
  v_insurance NUMERIC;
  r RECORD;
  v_line_ht NUMERIC;
  v_ratio NUMERIC;
BEGIN
  -- Only act if charges actually changed
  IF NEW.shipping_cost_ht IS NOT DISTINCT FROM OLD.shipping_cost_ht
     AND NEW.customs_cost_ht IS NOT DISTINCT FROM OLD.customs_cost_ht
     AND NEW.insurance_cost_ht IS NOT DISTINCT FROM OLD.insurance_cost_ht THEN
    RETURN NEW;
  END IF;

  v_shipping := COALESCE(NEW.shipping_cost_ht, 0);
  v_customs := COALESCE(NEW.customs_cost_ht, 0);
  v_insurance := COALESCE(NEW.insurance_cost_ht, 0);

  -- Calculate total items HT
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_items_ht
  FROM purchase_order_items
  WHERE purchase_order_id = NEW.id;

  IF v_total_items_ht > 0 THEN
    -- Update all items with new allocations
    FOR r IN
      SELECT id, quantity, unit_price_ht, discount_percentage, eco_tax
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      v_line_ht := r.quantity * r.unit_price_ht * (1 - COALESCE(r.discount_percentage, 0) / 100);
      v_ratio := v_line_ht / v_total_items_ht;

      UPDATE purchase_order_items
      SET
        allocated_shipping_ht = ROUND(v_shipping * v_ratio, 2),
        allocated_customs_ht = ROUND(v_customs * v_ratio, 2),
        allocated_insurance_ht = ROUND(v_insurance * v_ratio, 2),
        unit_cost_net = ROUND(
          r.unit_price_ht
          + COALESCE(r.eco_tax, 0)
          + (ROUND(v_shipping * v_ratio, 2) + ROUND(v_customs * v_ratio, 2) + ROUND(v_insurance * v_ratio, 2)) / GREATEST(r.quantity, 1),
          4
        )
      WHERE id = r.id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.reallocate_po_fees_on_charges_change() IS 'When PO charges (shipping/customs/insurance) change, reallocate proportionally to all line items.';

-- Create trigger on purchase_orders AFTER UPDATE
DROP TRIGGER IF EXISTS trigger_reallocate_po_fees_on_charges ON purchase_orders;
CREATE TRIGGER trigger_reallocate_po_fees_on_charges
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION reallocate_po_fees_on_charges_change();

-- =============================================================================
-- PART 6: Initialize allocated fees for existing items (backfill)
-- =============================================================================

-- Backfill unit_cost_net for all existing items (without fees allocation)
UPDATE purchase_order_items
SET unit_cost_net = ROUND(unit_price_ht + COALESCE(eco_tax, 0), 4)
WHERE unit_cost_net IS NULL;

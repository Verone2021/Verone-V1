-- Migration: Fix TTC calculation to use item-level tax_rate instead of order-level
-- Problem: Triggers used sales_orders.tax_rate (sometimes 0) instead of sales_order_items.tax_rate (always correct)
-- This caused total_ttc to be wrong (e.g. SO-2026-00078: 148.10 instead of 177.72)

-- =============================================================================
-- 1. Fix trigger: recalculate_sales_order_totals
--    Now calculates TTC per-item using each item's own tax_rate
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_sales_order_totals()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_items_ht NUMERIC(12,2);
  v_items_ttc NUMERIC(12,2);
  v_eco_tax_total NUMERIC(12,2);
  v_shipping_cost NUMERIC(12,2);
  v_insurance_cost NUMERIC(12,2);
  v_handling_cost NUMERIC(12,2);
  v_fees_vat_rate NUMERIC(5,4);
  v_total_charges_ht NUMERIC(12,2);
  v_total_charges_ttc NUMERIC(12,2);
BEGIN
  -- Determine order_id based on operation (INSERT/UPDATE vs DELETE)
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  -- Calculate totals from ITEMS (each item has its own tax_rate)
  SELECT
    COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)), 0),
    COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))), 0),
    COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
  INTO v_items_ht, v_items_ttc, v_eco_tax_total
  FROM sales_order_items
  WHERE sales_order_id = v_order_id;

  -- Get shipping/handling costs and fees VAT rate from the order
  SELECT
    COALESCE(shipping_cost_ht, 0),
    COALESCE(insurance_cost_ht, 0),
    COALESCE(handling_cost_ht, 0),
    COALESCE(fees_vat_rate, 0.2)
  INTO v_shipping_cost, v_insurance_cost, v_handling_cost, v_fees_vat_rate
  FROM sales_orders WHERE id = v_order_id;

  v_total_charges_ht := v_shipping_cost + v_insurance_cost + v_handling_cost;
  v_total_charges_ttc := v_total_charges_ht * (1 + v_fees_vat_rate);

  -- Update totals:
  -- total_ht = items_ht + eco_tax (without shipping)
  -- total_ttc = items_ttc (per-item TVA) + eco_tax_ttc + charges_ttc
  UPDATE sales_orders SET
    total_ht = v_items_ht + v_eco_tax_total,
    total_ttc = ROUND(v_items_ttc + (v_eco_tax_total * (1 + v_fees_vat_rate)) + v_total_charges_ttc, 2),
    eco_tax_total = v_eco_tax_total,
    updated_at = NOW()
  WHERE id = v_order_id;

  RETURN NULL;
END;
$function$;

-- =============================================================================
-- 2. Fix trigger: recalc_sales_order_on_charges_change
--    Now recalculates TTC using item-level tax_rate when charges change
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalc_sales_order_on_charges_change()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE
  v_items_ttc NUMERIC(12,2);
  v_eco_tax_total NUMERIC(12,2);
  v_total_charges_ht NUMERIC(12,2);
  v_fees_vat_rate NUMERIC(5,4);
BEGIN
  -- Only recalculate if charges actually changed
  IF NEW.shipping_cost_ht IS DISTINCT FROM OLD.shipping_cost_ht
     OR NEW.insurance_cost_ht IS DISTINCT FROM OLD.insurance_cost_ht
     OR NEW.handling_cost_ht IS DISTINCT FROM OLD.handling_cost_ht
     OR NEW.fees_vat_rate IS DISTINCT FROM OLD.fees_vat_rate THEN

    -- Calculate TTC from items (each item has its own tax_rate)
    SELECT
      COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))), 0),
      COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
    INTO v_items_ttc, v_eco_tax_total
    FROM sales_order_items
    WHERE sales_order_id = NEW.id;

    v_fees_vat_rate := COALESCE(NEW.fees_vat_rate, 0.2);
    v_total_charges_ht := COALESCE(NEW.shipping_cost_ht, 0) + COALESCE(NEW.insurance_cost_ht, 0) + COALESCE(NEW.handling_cost_ht, 0);

    -- Recalculate total_ttc using per-item TVA
    NEW.total_ttc := ROUND(v_items_ttc + (v_eco_tax_total * (1 + v_fees_vat_rate)) + (v_total_charges_ht * (1 + v_fees_vat_rate)), 2);
  END IF;

  RETURN NEW;
END;
$function$;

-- =============================================================================
-- 3. Mass recalculate ALL orders using the new per-item logic
-- =============================================================================

WITH correct_totals AS (
  SELECT
    soi.sales_order_id,
    SUM(soi.quantity * soi.unit_price_ht * (1 - COALESCE(soi.discount_percentage, 0) / 100)) as items_ht,
    SUM(soi.quantity * soi.unit_price_ht * (1 - COALESCE(soi.discount_percentage, 0) / 100) * (1 + COALESCE(soi.tax_rate, 0.2))) as items_ttc,
    SUM(COALESCE(soi.eco_tax, 0) * soi.quantity) as eco_tax
  FROM sales_order_items soi
  GROUP BY soi.sales_order_id
)
UPDATE sales_orders so SET
  total_ht = ct.items_ht + ct.eco_tax,
  total_ttc = ROUND(
    ct.items_ttc
    + (ct.eco_tax * (1 + COALESCE(so.fees_vat_rate, 0.2)))
    + (COALESCE(so.shipping_cost_ht, 0) + COALESCE(so.insurance_cost_ht, 0) + COALESCE(so.handling_cost_ht, 0))
      * (1 + COALESCE(so.fees_vat_rate, 0.2))
  , 2),
  updated_at = NOW()
FROM correct_totals ct
WHERE so.id = ct.sales_order_id;

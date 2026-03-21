-- Fix: Skip site-internet orders in payment recalculation and charges recalculation triggers
-- These triggers override values set by the Stripe webhook for site-internet orders

-- 1. Payment status recalculation: Stripe manages payment for site-internet
CREATE OR REPLACE FUNCTION recalculate_so_payment_status_on_total_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_total_allocated NUMERIC;
  v_has_manual_payment BOOLEAN;
  v_has_order_payments BOOLEAN;
  v_new_status TEXT;
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
BEGIN
  IF OLD.total_ttc IS NOT DISTINCT FROM NEW.total_ttc THEN
    RETURN NEW;
  END IF;

  -- Skip site-internet orders: Stripe manages payment status
  IF NEW.channel_id = v_site_internet_channel_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE sales_order_id = NEW.id;

  v_has_manual_payment := (NEW.manual_payment_type IS NOT NULL);

  SELECT EXISTS (
    SELECT 1 FROM order_payments WHERE sales_order_id = NEW.id
  ) INTO v_has_order_payments;

  IF v_has_manual_payment AND (v_total_allocated > 0 OR v_has_order_payments) THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > NEW.total_ttc THEN
    v_new_status := 'overpaid';
  ELSIF v_total_allocated = NEW.total_ttc THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  NEW.payment_status_v2 := v_new_status;
  RETURN NEW;
END;
$$;

-- 2. Charges recalculation: total_ttc comes from Stripe for site-internet
CREATE OR REPLACE FUNCTION recalc_sales_order_on_charges_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_items_ttc NUMERIC(12,2);
  v_eco_tax_total NUMERIC(12,2);
  v_total_charges_ht NUMERIC(12,2);
  v_fees_vat_rate NUMERIC(5,4);
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
BEGIN
  -- Skip site-internet orders: total comes from Stripe
  IF NEW.channel_id = v_site_internet_channel_id THEN
    RETURN NEW;
  END IF;

  IF NEW.shipping_cost_ht IS DISTINCT FROM OLD.shipping_cost_ht
     OR NEW.insurance_cost_ht IS DISTINCT FROM OLD.insurance_cost_ht
     OR NEW.handling_cost_ht IS DISTINCT FROM OLD.handling_cost_ht
     OR NEW.fees_vat_rate IS DISTINCT FROM OLD.fees_vat_rate THEN

    SELECT
      COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))), 0),
      COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
    INTO v_items_ttc, v_eco_tax_total
    FROM sales_order_items
    WHERE sales_order_id = NEW.id;

    v_fees_vat_rate := COALESCE(NEW.fees_vat_rate, 0.2);
    v_total_charges_ht := COALESCE(NEW.shipping_cost_ht, 0) + COALESCE(NEW.insurance_cost_ht, 0) + COALESCE(NEW.handling_cost_ht, 0);

    NEW.total_ttc := ROUND(v_items_ttc + (v_eco_tax_total * (1 + v_fees_vat_rate)) + (v_total_charges_ht * (1 + v_fees_vat_rate)), 2);
  END IF;

  RETURN NEW;
END;
$$;

-- Fix TTC calculation bug: tax_rate is stored as decimal (0.2), not percentage (20)
-- Bug: triggers used COALESCE(tax_rate, 20) / 100 which gives wrong result when tax_rate = 0.2

-- Fix recalc_order_on_shipping_change
CREATE OR REPLACE FUNCTION public.recalc_order_on_shipping_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Recalculer total_ttc avec le nouveau shipping_cost
  -- tax_rate is stored as decimal (0.2 = 20%), so we use (1 + tax_rate) directly
  NEW.total_ttc := (COALESCE(NEW.total_ht, 0) + COALESCE(NEW.shipping_cost_ht, 0)) * (1 + COALESCE(NEW.tax_rate, 0.20));
  RETURN NEW;
END;
$function$;

-- Fix recalculate_sales_order_totals
CREATE OR REPLACE FUNCTION public.recalculate_sales_order_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_order_id UUID;
  v_total_ht NUMERIC(12,2);
  v_eco_tax_total NUMERIC(12,2);
  v_shipping_cost NUMERIC(12,2);
  v_insurance_cost NUMERIC(12,2);
  v_handling_cost NUMERIC(12,2);
  v_tax_rate NUMERIC(5,4);  -- Changed from NUMERIC(5,2) to match column type
  v_total_charges NUMERIC(12,2);
BEGIN
  -- Determiner l'order_id selon l'operation (INSERT/UPDATE vs DELETE)
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  -- Calculer le total HT des items (avec remise) et eco_tax
  SELECT
    COALESCE(SUM(quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)), 0),
    COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
  INTO v_total_ht, v_eco_tax_total
  FROM sales_order_items
  WHERE sales_order_id = v_order_id;

  -- Recuperer tous les frais de la commande
  -- tax_rate is stored as decimal (0.2 = 20%), default to 0.20
  SELECT
    COALESCE(shipping_cost_ht, 0),
    COALESCE(insurance_cost_ht, 0),
    COALESCE(handling_cost_ht, 0),
    COALESCE(tax_rate, 0.20)
  INTO v_shipping_cost, v_insurance_cost, v_handling_cost, v_tax_rate
  FROM sales_orders WHERE id = v_order_id;

  -- Total des frais additionnels
  v_total_charges := v_shipping_cost + v_insurance_cost + v_handling_cost;

  -- Mettre a jour les totaux
  -- Use (1 + v_tax_rate) since tax_rate is already decimal
  UPDATE sales_orders
  SET
    total_ht = v_total_ht + v_eco_tax_total,
    total_ttc = (v_total_ht + v_eco_tax_total + v_total_charges) * (1 + v_tax_rate),
    eco_tax_total = v_eco_tax_total,
    updated_at = NOW()
  WHERE id = v_order_id;

  RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION public.recalc_order_on_shipping_change() IS 'Recalculates total_ttc when shipping_cost_ht changes. Fixed 2024-12-24: tax_rate is decimal (0.2), not percentage (20).';
COMMENT ON FUNCTION public.recalculate_sales_order_totals() IS 'Recalculates order totals when items change. Fixed 2024-12-24: tax_rate is decimal (0.2), not percentage (20).';

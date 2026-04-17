-- BO-FIN-009 Phase 1 : alignement round-per-line trigger recalc_sales_order_on_charges_change
-- Impact : 18 SO avec delta <= 0.02 EUR. Aucune contrainte DB violee.
-- Audit prerequis : docs/scratchpad/audit-consommateurs-tva-amount.md

BEGIN;

-- 1. Redefinir la fonction avec round-per-line
CREATE OR REPLACE FUNCTION public.recalc_sales_order_on_charges_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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

    -- Round-per-line sur items (aligne avec Qonto)
    SELECT
      COALESCE(SUM(ROUND(
        quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
      , 2)), 0),
      COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
    INTO v_items_ttc, v_eco_tax_total
    FROM sales_order_items
    WHERE sales_order_id = NEW.id;

    v_fees_vat_rate := COALESCE(NEW.fees_vat_rate, 0.2);
    v_total_charges_ht := COALESCE(NEW.shipping_cost_ht, 0) + COALESCE(NEW.insurance_cost_ht, 0) + COALESCE(NEW.handling_cost_ht, 0);

    -- Pas de ROUND sur le total (composants deja arrondis)
    NEW.total_ttc :=
      v_items_ttc
      + ROUND(v_eco_tax_total * (1 + v_fees_vat_rate), 2)
      + ROUND(v_total_charges_ht * (1 + v_fees_vat_rate), 2);
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Backfill : recalculer total_ttc pour TOUTES les SO non-cancelled
-- (touche aux 18 SO avec delta, inoffensif pour les 144 autres)
UPDATE sales_orders so
SET total_ttc = (
  SELECT
    COALESCE(SUM(ROUND(
      quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
    , 2)), 0)
    + ROUND(COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
    + ROUND((COALESCE(so.shipping_cost_ht, 0) + COALESCE(so.insurance_cost_ht, 0) + COALESCE(so.handling_cost_ht, 0)) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
  FROM sales_order_items soi
  WHERE soi.sales_order_id = so.id
)
WHERE so.status != 'cancelled'
  AND so.channel_id IS DISTINCT FROM '0c2639e9-df80-41fa-84d0-9da96a128f7f'::uuid; -- Skip site-internet

-- 3. DO $$ verification : count SO ecart > 0.001 apres backfill (doit etre 0)
DO $$
DECLARE
  v_mismatch_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_mismatch_count
  FROM sales_orders so
  WHERE so.status != 'cancelled'
    AND so.channel_id IS DISTINCT FROM '0c2639e9-df80-41fa-84d0-9da96a128f7f'::uuid
    AND ABS(so.total_ttc - (
      SELECT
        COALESCE(SUM(ROUND(
          quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
        , 2)), 0)
        + ROUND(COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
        + ROUND((COALESCE(so.shipping_cost_ht, 0) + COALESCE(so.insurance_cost_ht, 0) + COALESCE(so.handling_cost_ht, 0)) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
      FROM sales_order_items soi
      WHERE soi.sales_order_id = so.id
    )) > 0.001;

  IF v_mismatch_count > 0 THEN
    RAISE EXCEPTION 'BO-FIN-009 Phase 1 backfill INCOHERENT: % SO ne matchent pas la nouvelle formule', v_mismatch_count;
  END IF;

  RAISE NOTICE 'BO-FIN-009 Phase 1 backfill OK : 0 SO en divergence';
END $$;

COMMIT;

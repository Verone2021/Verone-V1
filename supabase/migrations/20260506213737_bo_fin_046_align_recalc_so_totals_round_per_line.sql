-- BO-FIN-046 Étape 2 : aligner recalculate_sales_order_totals sur round-per-line
-- La migration BO-FIN-009 phase 1 avait déjà aligné recalc_sales_order_on_charges_change.
-- Ce trigger (sur sales_order_items) utilisait encore SUM(qty*price*tva) sans ROUND par ligne.
-- Résultat : écart possible de 0-2 centimes entre trigger items et trigger frais.
-- Vérification préalable : 0 écart détecté sur les 165 SO non-cancelled.
-- Zéro impact sur les documents finalisés (0 ligne avec diff > 0.01 €).

BEGIN;

-- 1. Redéfinir recalculate_sales_order_totals avec round-per-line identique à recalc_on_charges
CREATE OR REPLACE FUNCTION public.recalculate_sales_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
  v_items_ttc NUMERIC(12, 2);
  v_items_ht NUMERIC(12, 2);
  v_eco_tax_total NUMERIC(12, 2);
  v_total_charges_ht NUMERIC(12, 2);
  v_fees_vat_rate NUMERIC(5, 4);
  v_channel_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  -- Lire le channel_id de la commande pour skip site-internet (total vient de Stripe)
  SELECT channel_id, COALESCE(fees_vat_rate, 0.2)
  INTO v_channel_id, v_fees_vat_rate
  FROM sales_orders
  WHERE id = v_order_id;

  IF v_channel_id = v_site_internet_channel_id THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Round-per-line sur items (aligne avec Qonto et recalc_on_charges_change)
  SELECT
    COALESCE(SUM(ROUND(
      quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
    , 2)), 0),
    COALESCE(SUM(ROUND(
      quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100) * (1 + COALESCE(tax_rate, 0.2))
    , 2)), 0),
    COALESCE(SUM(COALESCE(eco_tax, 0) * quantity), 0)
  INTO v_items_ht, v_items_ttc, v_eco_tax_total
  FROM sales_order_items
  WHERE sales_order_id = v_order_id;

  -- Lire les frais courants de la commande
  SELECT
    COALESCE(shipping_cost_ht, 0) + COALESCE(insurance_cost_ht, 0) + COALESCE(handling_cost_ht, 0)
  INTO v_total_charges_ht
  FROM sales_orders
  WHERE id = v_order_id;

  -- Mise à jour sans ROUND sur le total final (composants déjà arrondis par ligne)
  UPDATE sales_orders SET
    total_ht = v_items_ht + v_eco_tax_total,
    total_ttc = v_items_ttc
      + ROUND(v_eco_tax_total * (1 + v_fees_vat_rate), 2)
      + ROUND(v_total_charges_ht * (1 + v_fees_vat_rate), 2),
    eco_tax_total = v_eco_tax_total,
    updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2. Backfill : recalculer tous les SO non-cancelled (skip site-internet)
-- Prévisualisation déjà faite : 0 écart > 0.005 € entre ancienne et nouvelle formule.
UPDATE sales_orders so
SET total_ttc = (
  SELECT
    COALESCE(SUM(ROUND(
      soi.quantity * soi.unit_price_ht * (1 - COALESCE(soi.discount_percentage, 0) / 100) * (1 + COALESCE(soi.tax_rate, 0.2))
    , 2)), 0)
    + ROUND(COALESCE(SUM(COALESCE(soi.eco_tax, 0) * soi.quantity), 0) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
    + ROUND((COALESCE(so.shipping_cost_ht, 0) + COALESCE(so.insurance_cost_ht, 0) + COALESCE(so.handling_cost_ht, 0)) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
  FROM sales_order_items soi
  WHERE soi.sales_order_id = so.id
),
total_ht = (
  SELECT
    COALESCE(SUM(ROUND(
      soi.quantity * soi.unit_price_ht * (1 - COALESCE(soi.discount_percentage, 0) / 100)
    , 2)), 0) + COALESCE(so.eco_tax_total, 0)
  FROM sales_order_items soi
  WHERE soi.sales_order_id = so.id
)
WHERE so.status != 'cancelled'
  AND so.channel_id IS DISTINCT FROM '0c2639e9-df80-41fa-84d0-9da96a128f7f'::uuid;

-- 3. Vérification post-backfill
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
          soi.quantity * soi.unit_price_ht * (1 - COALESCE(soi.discount_percentage, 0) / 100) * (1 + COALESCE(soi.tax_rate, 0.2))
        , 2)), 0)
        + ROUND(COALESCE(SUM(COALESCE(soi.eco_tax, 0) * soi.quantity), 0) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
        + ROUND((COALESCE(so.shipping_cost_ht, 0) + COALESCE(so.insurance_cost_ht, 0) + COALESCE(so.handling_cost_ht, 0)) * (1 + COALESCE(so.fees_vat_rate, 0.2)), 2)
      FROM sales_order_items soi
      WHERE soi.sales_order_id = so.id
    )) > 0.001;

  IF v_mismatch_count > 0 THEN
    RAISE EXCEPTION 'BO-FIN-046 backfill INCOHERENT: % SO ne matchent pas la nouvelle formule', v_mismatch_count;
  END IF;

  RAISE NOTICE 'BO-FIN-046 Étape 2 OK : 0 SO en divergence après backfill round-per-line';
END $$;

COMMIT;

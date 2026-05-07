-- [BO-FIN-FEES-001] Inclusion des frais HT dans sales_orders.total_ht
--
-- Bug identifié 2026-05-07 par Roméo sur SO-2026-00157 et confirmé par audit:
-- 135 commandes sur 165 (avec frais > 0) ont un total_ht qui n'inclut PAS
-- les frais de livraison/manutention/assurance HT, alors que total_ttc les
-- inclut bien. Conséquence : (total_ttc - total_ht) ne reflète pas la TVA
-- réelle, mais "TVA items + frais TTC". Sur le frontend, cela apparait
-- comme une "TVA implicite aberrante" (ex: 39%, 50%, 54% sur les proformas
-- du 16 avril 2026 pour SO-00151/152/154/155).
--
-- Cause racine : migration `20260220170000_fix_ttc_calculation.sql`
-- (février 2026, DEPLOY #195) a introduit la formule
--   total_ht = items_ht + eco_tax  -- "without shipping" (commentaire explicite)
--   total_ttc = items_ttc + eco_tax_ttc + charges_ttc
-- Mathématiquement incohérent. La PR BO-FIN-046 (#939, mai 2026) a aligné
-- la formule sur round-per-line mais a copié le bug — pas corrigé.
--
-- Cette migration:
-- 1. Réécrit `recalculate_sales_order_totals` pour inclure les frais HT dans
--    le calcul de sales_orders.total_ht.
-- 2. Réécrit `recalc_sales_order_on_charges_change` pour recalculer total_ht
--    quand les frais changent (avant: ne touchait que total_ttc).
-- 3. Backfill sales_orders.total_ht en réappliquant la nouvelle formule sur
--    les 135 commandes impactées.
-- 4. Backfill financial_documents.total_ht (drafts uniquement, pour ne pas
--    toucher aux documents finalisés/envoyés/payés).
-- 5. Vérifications post-migration avec EXCEPTION si écart résiduel.
--
-- Hors scope (volontaire, sécurité comptable):
-- - Documents finalisés/envoyés/payés (status NOT IN ('draft')) : aucun
--   recalcul. Les factures officielles déjà émises restent telles quelles
--   conformément au principe de non-modification après envoi (loi
--   comptable). Si une finalisée a un total_ht faux, créer un avoir.
-- - Site-internet (channel = 0c2639e9...) : skip, total vient de Stripe.

BEGIN;

-- ============================================================================
-- 1. Trigger sur sales_order_items (INSERT/UPDATE/DELETE)
-- ============================================================================
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

  SELECT channel_id, COALESCE(fees_vat_rate, 0.2)
  INTO v_channel_id, v_fees_vat_rate
  FROM sales_orders
  WHERE id = v_order_id;

  IF v_channel_id = v_site_internet_channel_id THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Round-per-line sur items (aligne avec Qonto)
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

  -- Frais HT courants
  SELECT
    COALESCE(shipping_cost_ht, 0)
    + COALESCE(insurance_cost_ht, 0)
    + COALESCE(handling_cost_ht, 0)
  INTO v_total_charges_ht
  FROM sales_orders
  WHERE id = v_order_id;

  -- [BO-FIN-FEES-001] FIX : total_ht inclut maintenant v_total_charges_ht
  UPDATE sales_orders SET
    total_ht = v_items_ht + v_eco_tax_total + v_total_charges_ht,
    total_ttc = v_items_ttc
      + ROUND(v_eco_tax_total * (1 + v_fees_vat_rate), 2)
      + ROUND(v_total_charges_ht * (1 + v_fees_vat_rate), 2),
    eco_tax_total = v_eco_tax_total,
    updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ============================================================================
-- 2. Trigger sur sales_orders (UPDATE des frais)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recalc_sales_order_on_charges_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_items_ttc NUMERIC(12,2);
  v_items_ht NUMERIC(12,2);
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

    -- Round-per-line sur items
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
    WHERE sales_order_id = NEW.id;

    v_fees_vat_rate := COALESCE(NEW.fees_vat_rate, 0.2);
    v_total_charges_ht :=
      COALESCE(NEW.shipping_cost_ht, 0)
      + COALESCE(NEW.insurance_cost_ht, 0)
      + COALESCE(NEW.handling_cost_ht, 0);

    -- [BO-FIN-FEES-001] FIX : recalcul total_ht avec frais (avant: pas touché)
    NEW.total_ht := v_items_ht + v_eco_tax_total + v_total_charges_ht;
    NEW.total_ttc :=
      v_items_ttc
      + ROUND(v_eco_tax_total * (1 + v_fees_vat_rate), 2)
      + ROUND(v_total_charges_ht * (1 + v_fees_vat_rate), 2);
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 3. Backfill sales_orders : appliquer la nouvelle formule sur 135 SO impactées
-- ============================================================================
DO $$
DECLARE
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
  v_count INT := 0;
BEGIN
  WITH recalc AS (
    SELECT
      so.id,
      COALESCE(SUM(ROUND(
        soi.quantity * soi.unit_price_ht * (1 - COALESCE(soi.discount_percentage, 0) / 100)
      , 2)), 0)
      + COALESCE((
        SELECT SUM(COALESCE(eco_tax, 0) * quantity)
        FROM sales_order_items WHERE sales_order_id = so.id
      ), 0)
      + COALESCE(so.shipping_cost_ht, 0)
      + COALESCE(so.insurance_cost_ht, 0)
      + COALESCE(so.handling_cost_ht, 0) AS new_total_ht
    FROM sales_orders so
    LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
    WHERE so.status != 'cancelled'
      AND (so.channel_id IS NULL OR so.channel_id != v_site_internet_channel_id)
    GROUP BY so.id, so.shipping_cost_ht, so.insurance_cost_ht, so.handling_cost_ht
  )
  UPDATE sales_orders so
  SET total_ht = recalc.new_total_ht,
      updated_at = NOW()
  FROM recalc
  WHERE so.id = recalc.id
    AND ABS(so.total_ht - recalc.new_total_ht) > 0.005;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[BO-FIN-FEES-001] sales_orders backfill: % rows mises à jour', v_count;
END $$;

-- ============================================================================
-- 4. Backfill financial_documents brouillons UNIQUEMENT
--    (les finalisées/envoyées/payées ne sont pas modifiées — sécurité comptable)
--    On aligne doc.total_ht sur sales_orders.total_ht (qui vient d'être corrigé)
-- ============================================================================
DO $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE financial_documents fd
  SET total_ht = so.total_ht,
      total_ttc = so.total_ttc,
      tva_amount = so.total_ttc - so.total_ht,
      updated_at = NOW()
  FROM sales_orders so
  WHERE fd.sales_order_id = so.id
    AND fd.deleted_at IS NULL
    AND fd.status = 'draft'
    AND (
      ABS(fd.total_ht - so.total_ht) > 0.01
      OR ABS(fd.total_ttc - so.total_ttc) > 0.01
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[BO-FIN-FEES-001] financial_documents draft backfill: % rows alignées', v_count;
END $$;

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
DO $$
DECLARE
  v_so_misaligned INT;
  v_doc_misaligned_drafts INT;
  v_doc_misaligned_finalized INT;
BEGIN
  -- Sales orders qui restent désalignées (devrait être 0 hors site-internet)
  SELECT COUNT(*) INTO v_so_misaligned
  FROM sales_orders so
  LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
  WHERE so.status != 'cancelled'
    AND (so.channel_id IS NULL OR so.channel_id != '0c2639e9-df80-41fa-84d0-9da96a128f7f'::uuid)
  GROUP BY so.id, so.total_ht, so.shipping_cost_ht, so.insurance_cost_ht, so.handling_cost_ht
  HAVING ABS(
    so.total_ht - (
      COALESCE(SUM(ROUND(
        soi.quantity * soi.unit_price_ht * (1 - COALESCE(soi.discount_percentage, 0) / 100)
      , 2)), 0)
      + COALESCE(SUM(COALESCE(soi.eco_tax, 0) * soi.quantity), 0)
      + COALESCE(so.shipping_cost_ht, 0)
      + COALESCE(so.insurance_cost_ht, 0)
      + COALESCE(so.handling_cost_ht, 0)
    )
  ) > 0.01;

  -- Documents draft désalignés avec leur commande
  SELECT COUNT(*) INTO v_doc_misaligned_drafts
  FROM financial_documents fd
  JOIN sales_orders so ON so.id = fd.sales_order_id
  WHERE fd.deleted_at IS NULL
    AND fd.status = 'draft'
    AND (
      ABS(fd.total_ht - so.total_ht) > 0.01
      OR ABS(fd.total_ttc - so.total_ttc) > 0.01
    );

  -- Documents finalisés désalignés (info — pas corrigés volontairement)
  SELECT COUNT(*) INTO v_doc_misaligned_finalized
  FROM financial_documents fd
  JOIN sales_orders so ON so.id = fd.sales_order_id
  WHERE fd.deleted_at IS NULL
    AND fd.status IN ('finalized', 'sent', 'paid', 'partially_paid')
    AND (
      ABS(fd.total_ht - so.total_ht) > 0.01
      OR ABS(fd.total_ttc - so.total_ttc) > 0.01
    );

  RAISE NOTICE '[BO-FIN-FEES-001] vérifications:';
  RAISE NOTICE '  - Sales orders désalignées (attendu 0): %', COALESCE(v_so_misaligned, 0);
  RAISE NOTICE '  - Documents brouillons désalignés (attendu 0): %', v_doc_misaligned_drafts;
  RAISE NOTICE '  - Documents finalisés désalignés (info — non corrigés): %', v_doc_misaligned_finalized;

  IF COALESCE(v_so_misaligned, 0) > 0 THEN
    RAISE EXCEPTION '[BO-FIN-FEES-001] sales_orders restent désalignées (%) — migration incomplète', v_so_misaligned;
  END IF;
  IF v_doc_misaligned_drafts > 0 THEN
    RAISE EXCEPTION '[BO-FIN-FEES-001] documents brouillons restent désalignés (%) — migration incomplète', v_doc_misaligned_drafts;
  END IF;
  IF v_doc_misaligned_finalized > 0 THEN
    RAISE WARNING '[BO-FIN-FEES-001] % documents finalisés restent désalignés avec leur commande. Volontairement non corrigés (sécurité comptable). Si nécessaire, créer un avoir.', v_doc_misaligned_finalized;
  END IF;
END $$;

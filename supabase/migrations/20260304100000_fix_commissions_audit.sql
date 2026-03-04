-- ============================================================
-- Migration: Audit Commissions LinkMe
-- Date: 2026-03-04
-- ============================================================
-- Contexte:
--   Audit pre-lancement comptes reels LinkMe.
--   3 produits ont des commissions incorrectes:
--   - SEP-0001 (separateur terrasse): margin_rate devrait etre 0% (pas de commission)
--   - MEU-0001 (meuble Tabesto): produit UTILISATEUR, sa retrocession polluait affiliate_commission
--   - POU-0001 (poubelle): produit UTILISATEUR, idem
--
-- NE TOUCHE PAS: sales_orders, sales_order_items (factures et prix lockes)
-- MODIFIE: linkme_selection_items, linkme_commissions, trigger function
-- ============================================================

-- ============================================================
-- ETAPE 1: Corriger margin_rate SEP-0001 dans la selection Pokawa
-- ============================================================
-- SEP-0001 est un separateur decoratif: 0% commission
-- selling_price_ht est GENERATED et se recalculera automatiquement (= base_price_ht quand margin=0)
UPDATE linkme_selection_items
SET margin_rate = 0
WHERE product_id = '6a1289df-f0e0-4a33-9a1e-f877df17a6a2'
  AND selection_id = 'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7';


-- ============================================================
-- ETAPE 2: Corriger le trigger create_linkme_commission_on_order_update
-- ============================================================
-- BUG: v_total_commission = SUM(retrocession_amount) de TOUS les items
--   → les produits utilisateur (MEU-0001, POU-0001) polluaient affiliate_commission
-- FIX: filtrer par created_by_affiliate IS NULL (produits catalogue uniquement)
--   Pour les nouvelles commandes, SEP-0001 aura retrocession=0 (margin_rate=0 en etape 1)

CREATE OR REPLACE FUNCTION public.create_linkme_commission_on_order_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_affiliate_id UUID;
  v_selection_id UUID;
  v_total_commission NUMERIC(10,2);
  v_linkme_commission NUMERIC(10,2);
  v_tax_rate NUMERIC(5,4);
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  IF NEW.channel_id != v_linkme_channel_id THEN
    RETURN NEW;
  END IF;

  -- If order is NOT validated or shipped, delete any existing commission
  IF NEW.status NOT IN ('validated', 'shipped') THEN
    DELETE FROM linkme_commissions WHERE order_id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT DISTINCT
    ls.affiliate_id,
    ls.id
  INTO v_affiliate_id, v_selection_id
  FROM sales_order_items soi
  JOIN linkme_selection_items lsei ON lsei.id = soi.linkme_selection_item_id
  JOIN linkme_selections ls ON ls.id = lsei.selection_id
  WHERE soi.sales_order_id = NEW.id
  LIMIT 1;

  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- FIX: affiliate_commission = SUM retrocession des produits CATALOGUE uniquement
  -- Produits utilisateur (created_by_affiliate IS NOT NULL) sont exclus
  SELECT COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_total_commission
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE soi.sales_order_id = NEW.id
    AND p.created_by_affiliate IS NULL;

  -- linkme_commission = taxe Verone sur produits utilisateur (15%)
  SELECT COALESCE(SUM(
    CASE WHEN p.affiliate_commission_rate IS NOT NULL AND p.affiliate_commission_rate > 0
      THEN soi.unit_price_ht * soi.quantity * p.affiliate_commission_rate / 100
      ELSE 0
    END
  ), 0)
  INTO v_linkme_commission
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE soi.sales_order_id = NEW.id;

  SELECT COALESCE(la.tva_rate, 0.2)
  INTO v_tax_rate
  FROM linkme_affiliates la
  WHERE la.id = v_affiliate_id;

  IF v_tax_rate IS NULL THEN
    v_tax_rate := 0.2;
  END IF;

  IF v_tax_rate > 1 THEN
    v_tax_rate := v_tax_rate / 100;
  END IF;

  INSERT INTO linkme_commissions (
    affiliate_id, selection_id, order_id, order_number,
    order_amount_ht, affiliate_commission, affiliate_commission_ttc,
    linkme_commission, margin_rate_applied, linkme_rate_applied,
    tax_rate, status, created_at, updated_at
  ) VALUES (
    v_affiliate_id, v_selection_id, NEW.id, NEW.order_number,
    NEW.total_ht,
    v_total_commission,
    ROUND(v_total_commission * (1 + v_tax_rate), 2),
    ROUND(v_linkme_commission, 2),
    ROUND(v_total_commission / NULLIF(NEW.total_ht, 0), 4),
    ROUND(v_linkme_commission / NULLIF(NEW.total_ht, 0), 4),
    v_tax_rate,
    CASE WHEN NEW.payment_status_v2 = 'paid' THEN 'validated' ELSE 'pending' END,
    NOW(), NOW()
  )
  ON CONFLICT (order_id) DO UPDATE SET
    order_amount_ht = EXCLUDED.order_amount_ht,
    affiliate_commission = EXCLUDED.affiliate_commission,
    affiliate_commission_ttc = EXCLUDED.affiliate_commission_ttc,
    linkme_commission = EXCLUDED.linkme_commission,
    margin_rate_applied = EXCLUDED.margin_rate_applied,
    linkme_rate_applied = EXCLUDED.linkme_rate_applied,
    tax_rate = EXCLUDED.tax_rate,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN NEW;
END;
$function$;


-- ============================================================
-- ETAPE 3: Recalculer les commissions des 23 commandes impactees
-- ============================================================
-- IDs produits:
--   MEU-0001: 37f00f14-ce2d-48bf-ba4a-832d37978a74 (user product, affiliate_commission_rate=15%)
--   POU-0001: 4779f34a-ee9c-4429-b74a-bb4861fa6eba (user product, affiliate_commission_rate=15%)
--   SEP-0001: 6a1289df-f0e0-4a33-9a1e-f877df17a6a2 (catalogue, margin corrige a 0%)
--
-- Regles:
--   affiliate_commission = SUM(retrocession) produits catalogue SAUF SEP-0001
--     (SEP-0001 retrocession est encore non-zero dans sales_order_items mais doit etre exclue)
--   linkme_commission = SUM(unit_price * qty * 15%) produits utilisateur

WITH affected AS (
  SELECT DISTINCT so.id as order_id
  FROM sales_orders so
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  WHERE soi.product_id IN (
    '37f00f14-ce2d-48bf-ba4a-832d37978a74',
    '4779f34a-ee9c-4429-b74a-bb4861fa6eba',
    '6a1289df-f0e0-4a33-9a1e-f877df17a6a2'
  )
),
recalc AS (
  SELECT
    a.order_id,
    -- affiliate_commission = retrocession produits catalogue SAUF SEP-0001
    COALESCE(SUM(
      CASE
        WHEN p.created_by_affiliate IS NULL
          AND p.id != '6a1289df-f0e0-4a33-9a1e-f877df17a6a2'
        THEN soi.retrocession_amount
        ELSE 0
      END
    ), 0) as new_affiliate_commission,
    -- linkme_commission = taxe 15% sur produits utilisateur
    COALESCE(SUM(
      CASE
        WHEN p.affiliate_commission_rate IS NOT NULL AND p.affiliate_commission_rate > 0
        THEN ROUND(soi.unit_price_ht * soi.quantity * p.affiliate_commission_rate / 100, 2)
        ELSE 0
      END
    ), 0) as new_linkme_commission
  FROM affected a
  JOIN sales_order_items soi ON soi.sales_order_id = a.order_id
  JOIN products p ON p.id = soi.product_id
  GROUP BY a.order_id
)
UPDATE linkme_commissions lc
SET
  affiliate_commission = r.new_affiliate_commission,
  affiliate_commission_ttc = ROUND(r.new_affiliate_commission * (1 + lc.tax_rate), 2),
  linkme_commission = ROUND(r.new_linkme_commission, 2),
  margin_rate_applied = COALESCE(ROUND(r.new_affiliate_commission / NULLIF(lc.order_amount_ht, 0), 4), 0),
  linkme_rate_applied = COALESCE(ROUND(r.new_linkme_commission / NULLIF(lc.order_amount_ht, 0), 4), 0),
  updated_at = NOW()
FROM recalc r
WHERE lc.order_id = r.order_id;

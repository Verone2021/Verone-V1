-- Migration: Fix commission triggers to use TAUX DE MARGE (on base price)
-- instead of TAUX DE MARQUE (on selling price)
--
-- Changes:
-- 1. Widen retrocession_rate column from numeric(5,2) to numeric(7,4)
-- 2. Fix calculate_retrocession_amount trigger: PV × t / (1+t) instead of PV × t
-- 3. Fix lock_prices_on_order_validation trigger: same formula + preserve user-modified prices
-- 4. Update retrocession_rate from 0.15 (marque) to 0.1765 (marge) on existing items
-- 5. Fix base_price_ht_locked on old orders with incorrect values
--
-- Formula:
--   Taux de marge (CORRECT):  commission = PV × t / (1 + t)  where t = margin_rate / 100
--   Taux de marque (OBSOLETE): commission = PV × t
--
-- Date: 2026-04-07

-- ============================================================
-- 1. Widen retrocession_rate column to support 4 decimals
-- ============================================================

-- Drop dependent trigger
DROP TRIGGER IF EXISTS trg_calculate_retrocession ON sales_order_items;

-- Drop dependent views (cascade)
DROP VIEW IF EXISTS linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS linkme_order_items_enriched CASCADE;

-- Alter column
ALTER TABLE sales_order_items
ALTER COLUMN retrocession_rate TYPE numeric(7,4);

-- Recreate view: linkme_order_items_enriched
CREATE VIEW linkme_order_items_enriched AS
SELECT soi.id, soi.sales_order_id, soi.product_id, soi.quantity,
    soi.unit_price_ht, soi.total_ht, soi.linkme_selection_item_id, soi.tax_rate,
    p.name AS product_name, p.sku AS product_sku,
    pi.public_url AS product_image_url,
    COALESCE(soi.base_price_ht_locked, lsi.base_price_ht, soi.unit_price_ht) AS base_price_ht,
    COALESCE(lsi.margin_rate, 0::numeric) AS margin_rate,
    COALESCE(cp.channel_commission_rate, 0::numeric) AS commission_rate,
    COALESCE(soi.selling_price_ht_locked, lsi.selling_price_ht)::numeric(10,2) AS selling_price_ht,
    CASE
        WHEN p.created_by_affiliate IS NOT NULL THEN round(soi.total_ht * COALESCE(p.affiliate_commission_rate, 15::numeric) / 100::numeric, 2)
        ELSE COALESCE(soi.retrocession_amount, 0::numeric)
    END::numeric(10,2) AS affiliate_margin,
    COALESCE(soi.retrocession_rate, 0::numeric) AS retrocession_rate,
    p.created_by_affiliate, p.affiliate_commission_rate
FROM sales_order_items soi
    LEFT JOIN products p ON p.id = soi.product_id
    LEFT JOIN product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true
    LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
    LEFT JOIN channel_pricing cp ON cp.product_id = soi.product_id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
WHERE EXISTS (SELECT 1 FROM sales_orders so WHERE so.id = soi.sales_order_id AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid);

-- Recreate view: linkme_orders_with_margins
CREATE VIEW linkme_orders_with_margins AS
SELECT loe.id, loe.order_number, loe.status, loe.payment_status,
    loe.total_ht, loe.total_ttc, loe.customer_type, loe.customer_id,
    loe.created_at, loe.updated_at, loe.channel_id,
    loe.customer_name, loe.customer_address, loe.customer_postal_code,
    loe.customer_city, loe.customer_email, loe.customer_phone,
    loe.affiliate_name, loe.affiliate_type, loe.selection_name, loe.selection_id,
    COALESCE(lc.affiliate_commission, margins.total_affiliate_margin, 0::numeric) AS total_affiliate_margin,
    COALESCE(margins.items_count, 0::bigint) AS items_count
FROM linkme_orders_enriched loe
    LEFT JOIN linkme_commissions lc ON lc.order_id = loe.id
    LEFT JOIN (
        SELECT sales_order_id, sum(affiliate_margin) AS total_affiliate_margin, count(*) AS items_count
        FROM linkme_order_items_enriched GROUP BY sales_order_id
    ) margins ON margins.sales_order_id = loe.id;

-- ============================================================
-- 2. Fix trigger BEFORE: calculate_retrocession_amount
--    Formula: TAUX DE MARGE = PV × t / (1 + t)
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_retrocession_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.retrocession_rate IS NOT NULL AND NEW.retrocession_rate > 0 THEN
    -- Taux de marge : commission = prix_vente * taux / (1 + taux)
    NEW.retrocession_amount := ROUND(
      (NEW.unit_price_ht * NEW.quantity * NEW.retrocession_rate) / (1 + NEW.retrocession_rate), 2
    );
  ELSE
    NEW.retrocession_amount := 0.00;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate trigger
CREATE TRIGGER trg_calculate_retrocession
BEFORE INSERT OR UPDATE OF unit_price_ht, quantity, retrocession_rate, linkme_selection_item_id
ON public.sales_order_items
FOR EACH ROW EXECUTE FUNCTION calculate_retrocession_amount();

-- ============================================================
-- 3. Fix trigger AFTER: lock_prices_on_order_validation
--    - Preserves user-modified unit_price_ht (no overwrite)
--    - Uses same marge formula for retrocession_amount
-- ============================================================

CREATE OR REPLACE FUNCTION public.lock_prices_on_order_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    UPDATE sales_order_items soi
    SET
      base_price_ht_locked = lsi.base_price_ht,
      selling_price_ht_locked = soi.unit_price_ht,
      price_locked_at = NOW(),
      -- Formule MARGE : PV * t / (1+t) * qty
      retrocession_amount = ROUND(
        (soi.unit_price_ht * soi.quantity * soi.retrocession_rate) / (1 + soi.retrocession_rate), 2
      )
    FROM linkme_selection_items lsi
    WHERE soi.sales_order_id = NEW.id
      AND soi.linkme_selection_item_id = lsi.id;

  ELSIF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    UPDATE sales_order_items soi
    SET
      base_price_ht_locked = NULL,
      selling_price_ht_locked = NULL,
      price_locked_at = NULL
    FROM linkme_selection_items lsi
    WHERE soi.sales_order_id = NEW.id
      AND soi.linkme_selection_item_id = lsi.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 4. Update retrocession_rate: 0.15 (marque) -> 0.1765 (marge)
--    Only affects catalogue products that had the old marque rate
-- ============================================================

UPDATE sales_order_items
SET retrocession_rate = 0.1765
WHERE retrocession_rate = 0.1500;

-- ============================================================
-- 5. Fix base_price_ht_locked on old orders
--    Old orders had base_price_ht_locked backfilled with CURRENT
--    product base price instead of the base price at order time.
--    Correct formula: base = selling_price_ht_locked * (1 - old_retrocession_rate)
--    Since we already updated retrocession_rate to 0.1765:
--    base = selling / (1 + 0.1765) = selling / 1.1765
-- ============================================================

UPDATE sales_order_items
SET base_price_ht_locked = ROUND(
  (selling_price_ht_locked / (1 + retrocession_rate))::numeric, 2
)
WHERE base_price_ht_locked IS NOT NULL
  AND selling_price_ht_locked IS NOT NULL
  AND retrocession_rate > 0
  AND ((unit_price_ht - base_price_ht_locked) / base_price_ht_locked * 100) > 20;

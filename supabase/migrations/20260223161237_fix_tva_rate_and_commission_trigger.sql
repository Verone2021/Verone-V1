-- Fix: tva_rate stored as percentage (20) instead of decimal (0.20)
-- This caused numeric overflow in create_linkme_commission_on_order_update() trigger
-- when inserting into linkme_commissions.tax_rate NUMERIC(5,4)

-- 1. Normalize tva_rate data: percentage → decimal
UPDATE linkme_affiliates
SET tva_rate = tva_rate / 100
WHERE tva_rate > 1;

-- 2. Add safety guard in commission trigger to handle both formats
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

  IF NEW.status != 'shipped' THEN
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

  SELECT COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_total_commission
  FROM sales_order_items soi
  WHERE soi.sales_order_id = NEW.id;

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

  -- Normalize if tva_rate stored as percentage (20) instead of decimal (0.20)
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

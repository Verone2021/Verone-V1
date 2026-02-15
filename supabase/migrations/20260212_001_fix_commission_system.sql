-- ============================================================
-- Migration: Fix LinkMe Commission System
-- Date: 2026-02-12
-- Ticket: LM-USERS-001
--
-- Fixes:
-- 1. Trigger: shipped (not delivered), per-item linkme_commission,
--    real tax rate from linkme_affiliates.tva_rate, full UPSERT
-- 2. Data: normalize margin_rate_applied, recalculate linkme_commission
-- 3. Reconciliation function for ongoing health checks
-- ============================================================

-- ============================================================
-- 1. REPLACE TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION create_linkme_commission_on_order_update()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_affiliate_id UUID;
  v_selection_id UUID;
  v_total_commission NUMERIC(10,2);
  v_linkme_commission NUMERIC(10,2);
  v_tax_rate NUMERIC(5,4);
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Only process LinkMe channel orders
  IF NEW.channel_id != v_linkme_channel_id THEN
    RETURN NEW;
  END IF;

  -- Trigger on 'shipped' (confirmed shipment)
  IF NEW.status != 'shipped' THEN
    RETURN NEW;
  END IF;

  -- Find affiliate and selection from order items
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

  -- Calculate affiliate commission (sum of retrocession amounts)
  SELECT COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_total_commission
  FROM sales_order_items soi
  WHERE soi.sales_order_id = NEW.id;

  -- Calculate Verone commission (linkme_commission)
  -- Only on items where product has affiliate_commission_rate > 0
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

  -- Get tax rate from affiliate (fallback 0.2 = 20%)
  SELECT COALESCE(la.tva_rate, 0.2)
  INTO v_tax_rate
  FROM linkme_affiliates la
  WHERE la.id = v_affiliate_id;

  IF v_tax_rate IS NULL THEN
    v_tax_rate := 0.2;
  END IF;

  -- Insert or update commission (full UPSERT on ALL fields)
  INSERT INTO linkme_commissions (
    affiliate_id, selection_id, order_id, order_number,
    order_amount_ht, affiliate_commission, affiliate_commission_ttc,
    linkme_commission, margin_rate_applied, linkme_rate_applied,
    tax_rate, status, created_at, updated_at
  ) VALUES (
    v_affiliate_id,
    v_selection_id,
    NEW.id,
    NEW.order_number,
    NEW.total_ht,
    v_total_commission,
    ROUND(v_total_commission * (1 + v_tax_rate), 2),
    ROUND(v_linkme_commission, 2),
    ROUND(v_total_commission / NULLIF(NEW.total_ht, 0), 4),
    ROUND(v_linkme_commission / NULLIF(NEW.total_ht, 0), 4),
    v_tax_rate,
    CASE WHEN NEW.payment_status_v2 = 'paid' THEN 'validated' ELSE 'pending' END,
    NOW(),
    NOW()
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
$$;

-- ============================================================
-- 2. CLEAN UP EXISTING DATA (99 commissions)
-- ============================================================

-- 2.1 Normalize margin_rate_applied: percentage → decimal
-- 88 rows have 15.00 (percentage) → should be 0.15 (decimal)
UPDATE linkme_commissions
SET margin_rate_applied = margin_rate_applied / 100
WHERE margin_rate_applied > 1;

-- 2.2 Fix the 4 wrong margin_rate_applied (0.12 and 0.00)
-- Recalculate from affiliate_commission / order_amount_ht
UPDATE linkme_commissions
SET margin_rate_applied = ROUND(affiliate_commission / NULLIF(order_amount_ht, 0), 4)
WHERE margin_rate_applied IN (0.12, 0.00) AND order_amount_ht > 0;

-- 2.3 Recalculate linkme_commission for ALL commissions
-- Based on items where products.affiliate_commission_rate > 0
UPDATE linkme_commissions lc
SET linkme_commission = COALESCE(sub.correct_commission, 0),
    linkme_rate_applied = ROUND(COALESCE(sub.correct_commission, 0) / NULLIF(lc.order_amount_ht, 0), 4)
FROM (
  SELECT soi.sales_order_id,
    SUM(
      CASE WHEN p.affiliate_commission_rate IS NOT NULL AND p.affiliate_commission_rate > 0
        THEN soi.unit_price_ht * soi.quantity * p.affiliate_commission_rate / 100
        ELSE 0
      END
    )::numeric(10,2) AS correct_commission
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  GROUP BY soi.sales_order_id
) sub
WHERE sub.sales_order_id = lc.order_id;

-- ============================================================
-- 3. RECONCILIATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION reconcile_linkme_commissions()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_issues jsonb := '[]'::jsonb;
  v_missing_count int;
  v_mismatch_count int;
BEGIN
  -- Check 1: Shipped orders without commission
  SELECT COUNT(*) INTO v_missing_count
  FROM sales_orders so
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
    AND so.status = 'shipped'
    AND NOT EXISTS (
      SELECT 1 FROM linkme_commissions lc WHERE lc.order_id = so.id
    );

  IF v_missing_count > 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing_commission',
      'count', v_missing_count,
      'message', format('%s shipped orders without commission', v_missing_count)
    );
  END IF;

  -- Check 2: affiliate_commission mismatch vs SUM(retrocession_amount)
  SELECT COUNT(*) INTO v_mismatch_count
  FROM linkme_commissions lc
  JOIN (
    SELECT soi.sales_order_id,
      COALESCE(SUM(soi.retrocession_amount), 0) AS expected
    FROM sales_order_items soi
    GROUP BY soi.sales_order_id
  ) sub ON sub.sales_order_id = lc.order_id
  WHERE ABS(lc.affiliate_commission - sub.expected) > 0.01;

  IF v_mismatch_count > 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'affiliate_commission_mismatch',
      'count', v_mismatch_count,
      'message', format('%s commissions with affiliate_commission != SUM(retrocession_amount)', v_mismatch_count)
    );
  END IF;

  -- Check 3: linkme_commission mismatch vs per-item calculation
  SELECT COUNT(*) INTO v_mismatch_count
  FROM linkme_commissions lc
  JOIN (
    SELECT soi.sales_order_id,
      COALESCE(SUM(
        CASE WHEN p.affiliate_commission_rate IS NOT NULL AND p.affiliate_commission_rate > 0
          THEN soi.unit_price_ht * soi.quantity * p.affiliate_commission_rate / 100
          ELSE 0
        END
      ), 0)::numeric(10,2) AS expected
    FROM sales_order_items soi
    JOIN products p ON p.id = soi.product_id
    GROUP BY soi.sales_order_id
  ) sub ON sub.sales_order_id = lc.order_id
  WHERE ABS(lc.linkme_commission - sub.expected) > 0.01;

  IF v_mismatch_count > 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'linkme_commission_mismatch',
      'count', v_mismatch_count,
      'message', format('%s commissions with linkme_commission mismatch', v_mismatch_count)
    );
  END IF;

  RETURN jsonb_build_object(
    'is_healthy', jsonb_array_length(v_issues) = 0,
    'issues', v_issues,
    'checked_at', now()
  );
END;
$$;

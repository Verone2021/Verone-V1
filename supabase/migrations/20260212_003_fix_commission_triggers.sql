-- ============================================================================
-- Migration: Fix commission triggers (2 bugs)
-- Date: 2026-02-12
-- Context:
--   BUG 4: sync_commission_status_on_payment() sets status='paid' when client pays
--          'paid' means affiliate RECEIVED money. Correct: 'validated' (eligible)
--   BUG 5: create_linkme_commission_on_order_update() triggers on 'shipped'
--          Commission should be frozen at 'delivered' (confirmed delivery)
--          See: .serena/memories/shipped-vs-delivered-status-analysis
--
-- Changes:
--   1. Commission trigger: 'shipped' -> 'delivered' (freeze at delivery)
--   2. Sync trigger: status='paid' -> status='validated' (client paid ≠ affiliate paid)
--   3. Keep UPSERT pattern (idempotent, safe for re-runs)
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX 1: Commission trigger fires on 'delivered' (not 'shipped')
-- ============================================================================

CREATE OR REPLACE FUNCTION create_linkme_commission_on_order_update()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate_id UUID;
  v_selection_id UUID;
  v_total_commission NUMERIC(10,2);
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Only LinkMe orders
  IF NEW.channel_id != v_linkme_channel_id THEN
    RETURN NEW;
  END IF;

  -- Freeze commission at 'delivered' (confirmed delivery)
  -- Previously: 'shipped' (incorrect since migration 20260211_002)
  IF NEW.status != 'delivered' THEN
    RETURN NEW;
  END IF;

  -- Find affiliate and selection
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

  -- Calculate total commission from item-level retrocession
  SELECT COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_total_commission
  FROM sales_order_items soi
  WHERE soi.sales_order_id = NEW.id;

  -- UPSERT commission (idempotent)
  INSERT INTO linkme_commissions (
    affiliate_id,
    selection_id,
    order_id,
    order_number,
    order_amount_ht,
    affiliate_commission,
    affiliate_commission_ttc,
    linkme_commission,
    margin_rate_applied,
    linkme_rate_applied,
    tax_rate,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_affiliate_id,
    v_selection_id,
    NEW.id,
    NEW.order_number,
    NEW.total_ht,
    v_total_commission,
    ROUND(v_total_commission * 1.2, 2),
    ROUND(NEW.total_ht * 0.03, 2),
    0.12,
    0.03,
    0.2,
    CASE
      WHEN NEW.payment_status_v2 = 'paid' THEN 'validated'
      ELSE 'pending'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (order_id) DO UPDATE SET
    affiliate_commission = EXCLUDED.affiliate_commission,
    affiliate_commission_ttc = EXCLUDED.affiliate_commission_ttc,
    order_amount_ht = EXCLUDED.order_amount_ht,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX 2: Sync trigger sets 'validated' (not 'paid') when client pays
-- 'paid' = affiliate received money (future: via payment request flow)
-- 'validated' = client paid, commission is eligible for payment
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_commission_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When client pays: commission becomes 'validated' (eligible for affiliate payout)
  -- NOT 'paid' (which means affiliate has already received money)
  IF NEW.payment_status_v2 = 'paid' AND (OLD.payment_status_v2 IS NULL OR OLD.payment_status_v2 != 'paid') THEN
    UPDATE linkme_commissions
    SET status = 'validated', updated_at = NOW()
    WHERE order_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Restore prevent_so_direct_cancellation to include 'delivered' status
-- (removed by migration 20260211_002 but needed for shipped->delivered flow)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_so_direct_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Block validated -> cancelled (must go through draft first)
  IF OLD.status = 'validated' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande client validee. Veuillez d''abord la devalider (remettre en brouillon).';
  END IF;

  -- Block partially_shipped -> cancelled
  IF OLD.status = 'partially_shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande partiellement expediee.';
  END IF;

  -- Block shipped -> cancelled
  IF OLD.status = 'shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande expediee.';
  END IF;

  -- Block delivered -> cancelled
  IF OLD.status = 'delivered' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande livree.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

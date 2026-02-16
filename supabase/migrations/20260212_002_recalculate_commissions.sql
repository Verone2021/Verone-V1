-- ============================================================================
-- Migration: Restore payment_status_v2 + Recalculate ALL LinkMe commissions
-- Date: 2026-02-12
-- Context:
--   1. Migration 20260211_001 dropped payment_status column and created payment_status_v2
--      but 20 LinkMe orders lost their 'paid' status (backup in _migration_payment_status_backup)
--   2. Migration 20260211_002 UPSERT'd commissions from SUM(retrocession_amount) which was 0
--      for 274 items, destroying 78/99 commission values
--
-- This migration:
--   1. Disables triggers to prevent interference during manual recalculation
--   2. Restores payment_status_v2 = 'paid' from backup table
--   3. Recalculates ALL 99 commissions from now-correct retrocession_amount (migration 001)
--   4. Re-enables triggers
--
-- Pre-requisite: 20260212_001_fix_retrocession_amounts.sql must run first
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Disable triggers to prevent interference
-- ============================================================================

ALTER TABLE sales_orders DISABLE TRIGGER trg_create_linkme_commission;
ALTER TABLE sales_orders DISABLE TRIGGER trg_sync_commission_on_payment;
-- Also disable notification triggers
ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_shipped_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_confirmed_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_cancelled_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_payment_received_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_delayed_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_partial_shipped_notification;

-- ============================================================================
-- STEP 2: Restore payment_status_v2 from backup
-- ============================================================================

-- Audit BEFORE
DO $$
DECLARE
  v_pending INTEGER;
  v_paid INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE so.payment_status_v2 = 'pending'),
    COUNT(*) FILTER (WHERE so.payment_status_v2 = 'paid')
  INTO v_pending, v_paid
  FROM sales_orders so
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

  RAISE NOTICE '=== BEFORE payment_status restore ===';
  RAISE NOTICE 'LinkMe orders pending: %, paid: %', v_pending, v_paid;
END $$;

-- Restore from backup: only update orders that WERE paid but are now pending
UPDATE sales_orders so
SET
  payment_status_v2 = 'paid',
  updated_at = NOW()
FROM _migration_payment_status_backup bk
WHERE so.id = bk.id
  AND bk.payment_status = 'paid'
  AND so.payment_status_v2 != 'paid';

-- Audit AFTER
DO $$
DECLARE
  v_pending INTEGER;
  v_paid INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE so.payment_status_v2 = 'pending'),
    COUNT(*) FILTER (WHERE so.payment_status_v2 = 'paid')
  INTO v_pending, v_paid
  FROM sales_orders so
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

  RAISE NOTICE '=== AFTER payment_status restore ===';
  RAISE NOTICE 'LinkMe orders pending: %, paid: %', v_pending, v_paid;
END $$;

-- ============================================================================
-- STEP 3: Recalculate ALL LinkMe commissions
-- ============================================================================

-- Audit BEFORE
DO $$
DECLARE
  v_total_ht NUMERIC;
  v_count_zero INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(affiliate_commission), 0),
    COUNT(*) FILTER (WHERE affiliate_commission = 0)
  INTO v_total_ht, v_count_zero
  FROM linkme_commissions;

  RAISE NOTICE '=== BEFORE commission recalculation ===';
  RAISE NOTICE 'Total commissions HT: % EUR', v_total_ht;
  RAISE NOTICE 'Commissions at 0 EUR: %', v_count_zero;
END $$;

-- Recalculate from corrected retrocession_amount values
UPDATE linkme_commissions lc
SET
  affiliate_commission = sub.total_commission,
  affiliate_commission_ttc = ROUND(sub.total_commission * 1.2, 2),
  order_amount_ht = sub.order_total_ht,
  status = CASE
    WHEN sub.payment_status_v2 = 'paid' THEN 'validated'
    ELSE 'pending'
  END,
  updated_at = NOW()
FROM (
  SELECT
    so.id AS order_id,
    so.total_ht AS order_total_ht,
    so.payment_status_v2,
    COALESCE(SUM(soi.retrocession_amount), 0) AS total_commission
  FROM sales_orders so
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  GROUP BY so.id, so.total_ht, so.payment_status_v2
) sub
WHERE lc.order_id = sub.order_id;

-- Audit AFTER
DO $$
DECLARE
  v_total_ht NUMERIC;
  v_total_ttc NUMERIC;
  v_count_zero INTEGER;
  v_count_validated INTEGER;
  v_count_pending INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(affiliate_commission), 0),
    COALESCE(SUM(affiliate_commission_ttc), 0),
    COUNT(*) FILTER (WHERE affiliate_commission = 0),
    COUNT(*) FILTER (WHERE status = 'validated'),
    COUNT(*) FILTER (WHERE status = 'pending')
  INTO v_total_ht, v_total_ttc, v_count_zero, v_count_validated, v_count_pending
  FROM linkme_commissions;

  RAISE NOTICE '=== AFTER commission recalculation ===';
  RAISE NOTICE 'Total commissions HT: % EUR (expected: ~22k)', v_total_ht;
  RAISE NOTICE 'Total commissions TTC: % EUR (expected: ~26k)', v_total_ttc;
  RAISE NOTICE 'Commissions at 0 EUR: % (expected: 0 or very few)', v_count_zero;
  RAISE NOTICE 'Commissions validated: %, pending: %', v_count_validated, v_count_pending;
END $$;

-- ============================================================================
-- STEP 4: Re-enable triggers
-- ============================================================================

ALTER TABLE sales_orders ENABLE TRIGGER trg_create_linkme_commission;
ALTER TABLE sales_orders ENABLE TRIGGER trg_sync_commission_on_payment;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_shipped_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_confirmed_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_cancelled_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_payment_received_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_delayed_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_partial_shipped_notification;

COMMIT;

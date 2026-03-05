-- ============================================================================
-- Migration: Fix retrocession_rate for ALL LinkMe orders
-- Date: 2026-03-05
-- Context: Migration 20260212_001_fix_retrocession_amounts.sql used a WRONG
--   formula: retrocession_rate = selling_price_ht * margin_rate / unit_price_ht
--   Correct formula: retrocession_rate = margin_rate / 100
--   This affected 113 items across all LinkMe orders.
-- Approach: UPDATE only — no DDL, no INSERT, no DELETE
-- Idempotent: Running this again produces the same result.
-- Note: Triggers auto-calculate retrocession_amount and affiliate totals.
-- ============================================================================

-- Step 1: Fix retrocession_rate on ALL items linked to a selection
-- User products (created_by_affiliate IS NOT NULL) get rate 0
-- Catalogue products get margin_rate / 100 from their selection item
UPDATE sales_order_items soi
SET retrocession_rate = CASE
    WHEN p.created_by_affiliate IS NOT NULL THEN 0
    ELSE lsi.margin_rate / 100
  END
FROM linkme_selection_items lsi, products p
WHERE lsi.id = soi.linkme_selection_item_id
  AND p.id = soi.product_id;

-- Step 2: Recalculate affiliate_commission in linkme_commissions
-- Only catalogue products count (created_by_affiliate IS NULL)
-- linkme_commission (Verone commission on user products) is NOT touched
UPDATE linkme_commissions lc
SET affiliate_commission = sub.sum_retro_catalogue
FROM (
  SELECT soi.sales_order_id,
    SUM(CASE WHEN p.created_by_affiliate IS NULL THEN soi.retrocession_amount ELSE 0 END) as sum_retro_catalogue
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE soi.linkme_selection_item_id IS NOT NULL
  GROUP BY soi.sales_order_id
) sub
WHERE lc.order_id = sub.sales_order_id;

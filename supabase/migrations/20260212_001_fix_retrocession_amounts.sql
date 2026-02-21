-- ============================================================================
-- Migration: Fix retrocession_amount for ALL LinkMe order items
-- Date: 2026-02-12
-- Context: 274/355 items had retrocession_amount = 0 because they were imported
--          historically without recalculation at item level.
--          The correct formula uses selling_price_ht (taux de marque), NOT base_price_ht.
--
-- SSOT: packages/@verone/utils/src/linkme/margin-calculation.ts
-- Formula: retrocession = selling_price_ht * margin_rate / 100 * quantity
--          where selling_price_ht = base_price_ht / (1 - margin_rate / 100) [GENERATED]
--
-- IMPORTANT: Must disable trg_calculate_retrocession (BEFORE trigger on sales_order_items)
--            which overwrites retrocession_amount using unit_price_ht instead of selling_price_ht
--
-- Affected: 355 items across 100 LinkMe orders
--   - 274 items with retrocession_amount = 0 (recalculated from selection items)
--   - 76 items with retrocession_amount > 0 (recalculated for consistency)
--   - 5 items without linkme_selection_item_id (kept as-is, no data to recalculate)
--
-- retrocession_rate is stored as "trigger-compatible" value:
--   trigger formula: unit_price_ht * quantity * (retrocession_rate / 100)
--   so retrocession_rate = selling_price_ht * margin_rate / unit_price_ht
--   this ensures future trigger recalculations give correct results
-- ============================================================================

BEGIN;

-- Disable the BEFORE trigger that overwrites retrocession_amount
ALTER TABLE sales_order_items DISABLE TRIGGER trg_calculate_retrocession;

-- Audit BEFORE
DO $$
DECLARE
  v_items_zero INTEGER;
  v_total_retro NUMERIC;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE soi.retrocession_amount = 0 AND soi.linkme_selection_item_id IS NOT NULL),
    COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_items_zero, v_total_retro
  FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

  RAISE NOTICE '=== AUDIT BEFORE: retrocession_amount ===';
  RAISE NOTICE 'Items with retrocession = 0 (with LSI): %', v_items_zero;
  RAISE NOTICE 'Total retrocession current: % EUR', v_total_retro;
END $$;

-- Recalculate retrocession_amount for ALL LinkMe items
WITH calculated AS (
  SELECT
    soi.id,
    CASE
      -- Affiliate products: commission = unit_price * qty * affiliate_commission_rate / 100
      WHEN p.created_by_affiliate IS NOT NULL
      THEN ROUND(soi.unit_price_ht * soi.quantity * COALESCE(p.affiliate_commission_rate, 15) / 100, 2)
      -- Catalogue products with selection item: commission = selling_price * margin_rate / 100 * qty
      WHEN soi.linkme_selection_item_id IS NOT NULL AND lsi.id IS NOT NULL
      THEN ROUND(lsi.selling_price_ht * lsi.margin_rate / 100 * soi.quantity, 2)
      -- Orphan items (no selection item): keep existing value
      ELSE soi.retrocession_amount
    END AS new_retrocession_amount,
    CASE
      -- Affiliate products: rate = affiliate_commission_rate (percentage form, trigger-compatible)
      WHEN p.created_by_affiliate IS NOT NULL
      THEN COALESCE(p.affiliate_commission_rate, 15)
      -- Catalogue products: rate = selling_price * margin_rate / unit_price (trigger-compatible)
      WHEN soi.linkme_selection_item_id IS NOT NULL AND lsi.id IS NOT NULL
           AND soi.unit_price_ht > 0
      THEN ROUND(lsi.selling_price_ht * lsi.margin_rate / soi.unit_price_ht, 4)
      -- Orphan items: keep existing
      ELSE soi.retrocession_rate
    END AS new_retrocession_rate
  FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id
  JOIN products p ON p.id = soi.product_id
  LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
)
UPDATE sales_order_items soi
SET
  retrocession_amount = c.new_retrocession_amount,
  retrocession_rate = c.new_retrocession_rate,
  updated_at = NOW()
FROM calculated c
WHERE soi.id = c.id;

-- Re-enable the trigger
ALTER TABLE sales_order_items ENABLE TRIGGER trg_calculate_retrocession;

-- Audit AFTER
DO $$
DECLARE
  v_items_zero INTEGER;
  v_total_retro NUMERIC;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE soi.retrocession_amount = 0 AND soi.linkme_selection_item_id IS NOT NULL),
    COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_items_zero, v_total_retro
  FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

  RAISE NOTICE '=== AUDIT AFTER: retrocession_amount ===';
  RAISE NOTICE 'Items with retrocession = 0 (with LSI): % (expected: 0)', v_items_zero;
  RAISE NOTICE 'Total retrocession after: % EUR (expected: ~22k)', v_total_retro;
END $$;

COMMIT;

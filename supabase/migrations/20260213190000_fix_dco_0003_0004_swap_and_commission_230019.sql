-- ============================================================================
-- Migration: Fix DCO-0003/DCO-0004 channel_pricing swap + LINK-230019 commission
-- Date: 2026-02-13
-- Context: PDF LINK-230019 shows Rond paille M (DCO-0004) = 47.72€ and
--          Rond paille L (DCO-0003) = 52.76€, but channel_pricing had both at 44.85.
--          Also linkme_commissions was stale (782.70 instead of 836.97).
-- Applied: 2026-02-13 via execute_sql (5 steps)
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Fix DCO-0004 channel_pricing (44.85 → 40.56)
-- PDF says Rond paille M = 47.72€ selling → base = 47.72 × 0.85 = 40.56
-- Trigger sync_channel_pricing_to_selections propagates to linkme_selection_items
-- ============================================================================
UPDATE channel_pricing
SET public_price_ht = 40.56,
    updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE sku = 'DCO-0004')
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- ============================================================================
-- Step 2: Fix DCO-0003 linkme_selection_items directly (44.85)
-- channel_pricing already correct at 44.85 but trigger doesn't fire on no-op
-- PDF says Rond paille L = 52.76€ selling → base = 52.76 × 0.85 = 44.85
-- ============================================================================
UPDATE linkme_selection_items
SET base_price_ht = 44.85,
    updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE sku = 'DCO-0003');

-- ============================================================================
-- Step 3: Recalculate retrocession for LINK-230019 only
-- ============================================================================
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230019';

-- ============================================================================
-- Step 4: Re-lock LINK-230019 with corrected prices
-- ============================================================================
UPDATE sales_order_items soi
SET
  base_price_ht_locked = lsi.base_price_ht,
  selling_price_ht_locked = lsi.selling_price_ht
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230019';

-- ============================================================================
-- Step 5: Update linkme_commissions (782.70 → 836.97)
-- ============================================================================
UPDATE linkme_commissions
SET
  affiliate_commission = (
    SELECT COALESCE(SUM(soi.retrocession_amount), 0)
    FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE so.order_number = 'LINK-230019'
  ),
  affiliate_commission_ttc = ROUND(
    (SELECT COALESCE(SUM(soi.retrocession_amount), 0)
     FROM sales_order_items soi
     JOIN sales_orders so ON so.id = soi.sales_order_id
     WHERE so.order_number = 'LINK-230019') * 1.2, 2
  ),
  updated_at = NOW()
WHERE order_number = 'LINK-230019';

COMMIT;

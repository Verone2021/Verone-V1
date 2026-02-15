-- ============================================================================
-- Migration: Sync linkme_commissions for ALL LINK-230xxx orders
-- Date: 2026-02-13
-- Context: affiliate_commission was stale for 10 orders (retrocession had been
--          recalculated but linkme_commissions was not updated)
-- Orders fixed: 230006, 230007, 230008, 230009, 230013, 230024, 230025,
--               230026, 230027, 230028
-- Applied: 2026-02-13 via execute_sql
-- ============================================================================

UPDATE linkme_commissions lc
SET
  affiliate_commission = sub.sum_retro,
  affiliate_commission_ttc = ROUND(sub.sum_retro * 1.2, 2),
  updated_at = NOW()
FROM (
  SELECT
    so.order_number,
    COALESCE(SUM(soi.retrocession_amount), 0) as sum_retro
  FROM sales_orders so
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  WHERE so.order_number LIKE 'LINK-230%'
  GROUP BY so.order_number
) sub
WHERE lc.order_number = sub.order_number
  AND lc.affiliate_commission != sub.sum_retro;

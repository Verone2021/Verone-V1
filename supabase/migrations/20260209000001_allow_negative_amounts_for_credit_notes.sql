/**
 * Migration: Allow Negative Amounts for Credit Notes (Avoirs)
 * Date: 2026-02-09
 *
 * Context:
 * - Historical credit notes (2025) need to be inserted with negative amounts
 * - Current CHECK constraints prevent total_ht and total_ttc from being negative
 * - 8 avoirs (AV-25-001 to AV-25-008) ready to insert
 *
 * Changes:
 * - Remove sales_orders_total_ht_check constraint (total_ht >= 0)
 * - Remove sales_orders_total_ttc_check constraint (total_ttc >= 0)
 *
 * Future:
 * - Will add is_credit_note column + related_order_id for automated avoir handling (2026+)
 * - See plan file: toasty-weaving-meerkat.md
 */

-- Drop constraints blocking negative amounts
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_total_ht_check;
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_total_ttc_check;

-- Add table comment documenting credit notes usage
COMMENT ON TABLE sales_orders IS 'Sales orders and credit notes (avoirs). Negative amounts represent refunds/credit notes. Historical avoirs (2025): negative order_number (AV-25-XXX). Future avoirs (2026+): will use is_credit_note + related_order_id columns.';

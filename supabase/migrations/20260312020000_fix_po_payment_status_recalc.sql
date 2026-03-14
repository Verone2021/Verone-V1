-- =====================================================================
-- Fix recalculate_order_paid_amount for Purchase Orders
-- =====================================================================
-- BUG 1: PO section missing payment_status_v2 update
-- BUG 4: Use ABS(allocated_amount) for PO links (bank debits are negative)
-- NOTE: allocated_amount stays negative for PO (represents money owed/debited)
--       ABS() is used only in the CALCULATION of paid_amount
-- =====================================================================

-- 1. Fix the RPC: add payment_status_v2 for PO + ABS for robustness
CREATE OR REPLACE FUNCTION recalculate_order_paid_amount(
  p_sales_order_id UUID DEFAULT NULL,
  p_purchase_order_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_links_total NUMERIC;
  v_manual_total NUMERIC;
  v_total NUMERIC;
BEGIN
  IF p_sales_order_id IS NOT NULL THEN
    -- SUM of bank reconciliation links
    SELECT COALESCE(SUM(allocated_amount), 0) INTO v_links_total
    FROM transaction_document_links WHERE sales_order_id = p_sales_order_id;

    -- SUM of manual payments
    SELECT COALESCE(SUM(amount), 0) INTO v_manual_total
    FROM order_payments WHERE sales_order_id = p_sales_order_id;

    v_total := v_links_total + v_manual_total;

    UPDATE sales_orders SET
      paid_amount = v_total,
      payment_status_v2 = CASE
        WHEN v_total >= total_ttc AND total_ttc > 0 THEN 'paid'
        WHEN v_total > 0 THEN 'partially_paid'
        ELSE 'pending'
      END,
      paid_at = CASE WHEN v_total > 0 THEN COALESCE(paid_at, NOW()) ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_sales_order_id;
  END IF;

  IF p_purchase_order_id IS NOT NULL THEN
    -- SUM of bank reconciliation links (ABS for robustness — bank debits can be negative)
    SELECT COALESCE(SUM(ABS(allocated_amount)), 0) INTO v_links_total
    FROM transaction_document_links WHERE purchase_order_id = p_purchase_order_id;

    -- SUM of manual payments
    SELECT COALESCE(SUM(amount), 0) INTO v_manual_total
    FROM order_payments WHERE purchase_order_id = p_purchase_order_id;

    v_total := v_links_total + v_manual_total;

    UPDATE purchase_orders SET
      paid_amount = v_total,
      payment_status_v2 = CASE
        WHEN v_total >= total_ttc AND total_ttc > 0 THEN 'paid'
        WHEN v_total > 0 THEN 'partially_paid'
        ELSE 'pending'
      END,
      paid_at = CASE WHEN v_total > 0 THEN COALESCE(paid_at, NOW()) ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_purchase_order_id;
  END IF;
END;
$$;

-- 2. Recalculate paid_amount + payment_status_v2 for ALL POs with links
-- (allocated_amount stays negative — ABS() is in the recalculation function)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT purchase_order_id
    FROM transaction_document_links
    WHERE purchase_order_id IS NOT NULL
  LOOP
    PERFORM recalculate_order_paid_amount(p_purchase_order_id := r.purchase_order_id);
  END LOOP;
END;
$$;

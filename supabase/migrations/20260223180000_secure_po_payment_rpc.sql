-- Secure mark_po_payment_received: reject overpayment and double payment
-- Fixes: PO 20135179 was paid twice (5226.68 instead of 2613.34)

CREATE OR REPLACE FUNCTION mark_po_payment_received(p_order_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_ttc numeric;
  v_paid numeric;
  v_remaining numeric;
BEGIN
  SELECT total_ttc, COALESCE(paid_amount, 0)
  INTO v_total_ttc, v_paid
  FROM purchase_orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order % not found', p_order_id;
  END IF;

  v_remaining := v_total_ttc - v_paid;

  -- Reject if already fully paid
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'PO already fully paid (remaining: %)', v_remaining;
  END IF;

  -- Reject if amount exceeds remaining (with 0.01 tolerance for rounding)
  IF p_amount > v_remaining + 0.01 THEN
    RAISE EXCEPTION 'Amount % exceeds remaining % for PO %', p_amount, v_remaining, p_order_id;
  END IF;

  -- Cap to exact remaining if slight rounding overshoot
  IF p_amount > v_remaining THEN
    p_amount := v_remaining;
  END IF;

  UPDATE purchase_orders
  SET
    payment_status_v2 = CASE
      WHEN v_paid + p_amount >= v_total_ttc THEN 'paid'
      ELSE 'partially_paid'
    END,
    paid_amount = v_paid + p_amount,
    paid_at = COALESCE(paid_at, NOW()),
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;

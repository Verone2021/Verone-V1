-- Migration: Upgrade mark_po_payment_received to insert into order_payments table
-- Aligns purchase order payment flow with sales orders (unified payment history)

CREATE OR REPLACE FUNCTION mark_po_payment_received(
  p_order_id UUID,
  p_amount NUMERIC,
  p_user_id UUID DEFAULT NULL,
  p_payment_type TEXT DEFAULT 'transfer_other',
  p_reference TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment_id UUID;
  v_total_ttc NUMERIC;
  v_current_paid NUMERIC;
BEGIN
  -- Validate order exists
  SELECT total_ttc, COALESCE(paid_amount, 0)
  INTO v_total_ttc, v_current_paid
  FROM purchase_orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order % not found', p_order_id;
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  -- 1. Insert into order_payments (unified payment history)
  INSERT INTO order_payments (
    purchase_order_id,
    payment_type,
    amount,
    payment_date,
    reference,
    note,
    created_by
  ) VALUES (
    p_order_id,
    p_payment_type::manual_payment_type,
    p_amount,
    COALESCE(p_date, NOW()),
    p_reference,
    p_note,
    COALESCE(p_user_id, auth.uid())
  )
  RETURNING id INTO v_payment_id;

  -- 2. Recalculate paid_amount from both sources (manual payments + bank links)
  PERFORM recalculate_order_paid_amount(p_purchase_order_id := p_order_id);

  RETURN v_payment_id;
END;
$$;

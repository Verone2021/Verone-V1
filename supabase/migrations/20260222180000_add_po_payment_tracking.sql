-- Migration: Add payment tracking columns + RPC for purchase_orders
-- Aligns PO payment system with SO (sales_orders) pattern

-- 1. Add missing columns
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 2. RPC to mark payment received (equivalent to mark_payment_received for sales_orders)
-- Note: No linkme_commissions update needed (POs have no affiliate commissions)
CREATE OR REPLACE FUNCTION mark_po_payment_received(p_order_id uuid, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE purchase_orders
  SET
    payment_status_v2 = CASE
      WHEN COALESCE(paid_amount, 0) + p_amount >= total_ttc THEN 'paid'
      ELSE 'partially_paid'
    END,
    paid_amount = COALESCE(paid_amount, 0) + p_amount,
    paid_at = COALESCE(paid_at, NOW()),
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;

-- Migration: Fix payment_status_v2 trigger for sales orders
-- Problem: The trigger update_sales_order_payment_status_v2() fires on
-- transaction_document_links changes but cannot UPDATE sales_orders because
-- there is NO UPDATE RLS policy on sales_orders. PostgreSQL silently returns
-- 0 rows instead of erroring.
--
-- Fix:
-- 1. Add UPDATE policy on sales_orders for staff
-- 2. Rebuild trigger function with SECURITY DEFINER + amount-based logic
-- 3. Recalculate all existing orders

-- =============================================================================
-- 1a. Add missing UPDATE policy on sales_orders
-- =============================================================================
CREATE POLICY "staff_update_sales_orders" ON sales_orders
  FOR UPDATE TO authenticated
  USING (is_backoffice_user());

-- =============================================================================
-- 1b. Rebuild trigger function with SECURITY DEFINER + partial payment logic
-- =============================================================================
CREATE OR REPLACE FUNCTION update_sales_order_payment_status_v2()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = 'public'
SET row_security = off
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_total_allocated NUMERIC;
  v_total_ttc NUMERIC;
  v_has_manual_payment BOOLEAN;
BEGIN
  -- Determine the affected order
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  -- Skip if no sales_order_id (could be a document or purchase_order link)
  IF v_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Sum allocated amounts from all linked transactions
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE sales_order_id = v_order_id;

  -- Get the order total and manual payment status
  SELECT total_ttc, (manual_payment_type IS NOT NULL)
  INTO v_total_ttc, v_has_manual_payment
  FROM sales_orders
  WHERE id = v_order_id;

  -- Calculate payment status based on amounts
  UPDATE sales_orders
  SET payment_status_v2 = CASE
    WHEN v_has_manual_payment THEN 'paid'
    WHEN v_total_allocated >= v_total_ttc THEN 'paid'
    WHEN v_total_allocated > 0 THEN 'partially_paid'
    ELSE 'pending'
  END,
  updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =============================================================================
-- 1c. Recalculate payment status for ALL orders that have linked transactions
-- =============================================================================
UPDATE sales_orders so
SET payment_status_v2 = CASE
  WHEN so.manual_payment_type IS NOT NULL THEN 'paid'
  WHEN COALESCE(tdl.total_allocated, 0) >= so.total_ttc THEN 'paid'
  WHEN COALESCE(tdl.total_allocated, 0) > 0 THEN 'partially_paid'
  ELSE 'pending'
END,
updated_at = NOW()
FROM (
  SELECT sales_order_id, SUM(allocated_amount) as total_allocated
  FROM transaction_document_links
  WHERE sales_order_id IS NOT NULL
  GROUP BY sales_order_id
) tdl
WHERE tdl.sales_order_id = so.id;

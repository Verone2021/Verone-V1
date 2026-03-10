-- Migration: Auto-recalculate payment_status_v2 when total_ttc changes + add overpaid status
-- Context: When total_ttc changes (e.g. VAT correction), payment_status_v2 was not recalculated.
-- Also adds 'overpaid' status when allocated amount exceeds total_ttc.

-- ============================================================================
-- 1. Update sales order payment status function with overpaid support
-- ============================================================================
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
  v_new_status TEXT;
BEGIN
  -- Determine the affected order
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  -- Skip if no sales_order_id
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

  -- Calculate new payment status (4 statuts, no tolerance)
  IF v_has_manual_payment THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > v_total_ttc THEN
    v_new_status := 'overpaid';
  ELSIF v_total_allocated = v_total_ttc THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update sales order
  UPDATE sales_orders
  SET payment_status_v2 = v_new_status,
      updated_at = NOW()
  WHERE id = v_order_id;

  -- Sync related financial_documents
  UPDATE financial_documents fd
  SET
    amount_paid = COALESCE(link_totals.total_allocated, 0),
    status = CASE
      WHEN COALESCE(link_totals.total_allocated, 0) >= fd.total_ttc THEN 'paid'::document_status
      WHEN COALESCE(link_totals.total_allocated, 0) > 0 THEN 'partially_paid'::document_status
      ELSE 'sent'::document_status
    END,
    updated_at = NOW()
  FROM (
    SELECT tdl.document_id, COALESCE(SUM(tdl.allocated_amount), 0) AS total_allocated
    FROM transaction_document_links tdl
    WHERE tdl.document_id IS NOT NULL
      AND tdl.sales_order_id = v_order_id
    GROUP BY tdl.document_id
  ) link_totals
  WHERE fd.id = link_totals.document_id
    AND fd.document_type = 'customer_invoice'
    AND fd.deleted_at IS NULL;

  -- Also update invoices linked by sales_order_id but NOT in transaction_document_links
  UPDATE financial_documents fd
  SET
    amount_paid = v_total_allocated,
    status = CASE
      WHEN v_total_allocated >= fd.total_ttc THEN 'paid'::document_status
      WHEN v_total_allocated > 0 THEN 'partially_paid'::document_status
      ELSE 'sent'::document_status
    END,
    updated_at = NOW()
  WHERE fd.sales_order_id = v_order_id
    AND fd.document_type = 'customer_invoice'
    AND fd.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM transaction_document_links tdl
      WHERE tdl.document_id = fd.id
        AND tdl.sales_order_id = v_order_id
    );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 2. Update purchase order payment status function with amount-based logic + overpaid
-- ============================================================================
CREATE OR REPLACE FUNCTION update_purchase_order_payment_status_v2()
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
  v_new_status TEXT;
BEGIN
  -- Determine the affected order
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.purchase_order_id;
  ELSE
    v_order_id := NEW.purchase_order_id;
  END IF;

  -- Skip if no purchase_order_id
  IF v_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Sum allocated amounts from all linked transactions
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE purchase_order_id = v_order_id;

  -- Get the order total and manual payment status
  SELECT total_ttc, (manual_payment_type IS NOT NULL)
  INTO v_total_ttc, v_has_manual_payment
  FROM purchase_orders
  WHERE id = v_order_id;

  -- Calculate new payment status (4 statuts, no tolerance)
  IF v_has_manual_payment THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > v_total_ttc THEN
    v_new_status := 'overpaid';
  ELSIF v_total_allocated = v_total_ttc THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update purchase order
  UPDATE purchase_orders
  SET payment_status_v2 = v_new_status,
      updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 3. Trigger on sales_orders when total_ttc changes → recalculate payment status
-- ============================================================================
CREATE OR REPLACE FUNCTION recalculate_so_payment_status_on_total_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = 'public'
SET row_security = off
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_allocated NUMERIC;
  v_has_manual_payment BOOLEAN;
  v_new_status TEXT;
BEGIN
  -- Only act when total_ttc actually changed
  IF OLD.total_ttc IS NOT DISTINCT FROM NEW.total_ttc THEN
    RETURN NEW;
  END IF;

  -- Sum allocated amounts from all linked transactions
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE sales_order_id = NEW.id;

  -- Check manual payment
  v_has_manual_payment := (NEW.manual_payment_type IS NOT NULL);

  -- Calculate new payment status
  IF v_has_manual_payment THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > NEW.total_ttc THEN
    v_new_status := 'overpaid';
  ELSIF v_total_allocated = NEW.total_ttc THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update in-place (BEFORE trigger modifies NEW directly)
  NEW.payment_status_v2 := v_new_status;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_so_payment_on_total_change ON sales_orders;
CREATE TRIGGER trg_recalculate_so_payment_on_total_change
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (OLD.total_ttc IS DISTINCT FROM NEW.total_ttc)
  EXECUTE FUNCTION recalculate_so_payment_status_on_total_change();

-- ============================================================================
-- 4. Trigger on purchase_orders when total_ttc changes → recalculate payment status
-- ============================================================================
CREATE OR REPLACE FUNCTION recalculate_po_payment_status_on_total_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = 'public'
SET row_security = off
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_allocated NUMERIC;
  v_has_manual_payment BOOLEAN;
  v_new_status TEXT;
BEGIN
  -- Only act when total_ttc actually changed
  IF OLD.total_ttc IS NOT DISTINCT FROM NEW.total_ttc THEN
    RETURN NEW;
  END IF;

  -- Sum allocated amounts from all linked transactions
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE purchase_order_id = NEW.id;

  -- Check manual payment
  v_has_manual_payment := (NEW.manual_payment_type IS NOT NULL);

  -- Calculate new payment status
  IF v_has_manual_payment THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > NEW.total_ttc THEN
    v_new_status := 'overpaid';
  ELSIF v_total_allocated = NEW.total_ttc THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update in-place (BEFORE trigger)
  NEW.payment_status_v2 := v_new_status;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_po_payment_on_total_change ON purchase_orders;
CREATE TRIGGER trg_recalculate_po_payment_on_total_change
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  WHEN (OLD.total_ttc IS DISTINCT FROM NEW.total_ttc)
  EXECUTE FUNCTION recalculate_po_payment_status_on_total_change();

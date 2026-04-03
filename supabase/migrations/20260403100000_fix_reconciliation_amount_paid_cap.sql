-- =====================================================================
-- Migration: Fix reconciliation amount_paid cap
-- Date: 2026-04-03
-- Bug: amount_paid on financial_documents could exceed total_ttc
--      when allocating a large transaction to a smaller document.
--      Violated check_amount_paid_valid constraint.
-- Fix: LEAST(SUM(allocated_amount), total_ttc) in both:
--      1. RPC link_transaction_to_document
--      2. Trigger update_sales_order_payment_status_v2
-- =====================================================================

-- FIX 1: RPC link_transaction_to_document
CREATE OR REPLACE FUNCTION link_transaction_to_document(
  p_transaction_id UUID,
  p_document_id UUID DEFAULT NULL,
  p_sales_order_id UUID DEFAULT NULL,
  p_purchase_order_id UUID DEFAULT NULL,
  p_allocated_amount DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_type VARCHAR(50);
  v_link_id UUID;
  v_amount DECIMAL;
  v_resolved_document_id UUID;
  v_resolved_sales_order_id UUID;
  v_existing_link_id UUID;
BEGIN
  IF p_document_id IS NOT NULL THEN
    v_link_type := 'document';
  ELSIF p_sales_order_id IS NOT NULL THEN
    v_link_type := 'sales_order';
  ELSIF p_purchase_order_id IS NOT NULL THEN
    v_link_type := 'purchase_order';
  ELSE
    RAISE EXCEPTION 'Au moins un ID cible doit etre fourni';
  END IF;

  IF p_allocated_amount IS NULL THEN
    SELECT ABS(amount) INTO v_amount FROM bank_transactions WHERE id = p_transaction_id;
  ELSE
    v_amount := p_allocated_amount;
  END IF;

  v_resolved_document_id := p_document_id;
  v_resolved_sales_order_id := p_sales_order_id;

  IF p_document_id IS NOT NULL AND p_sales_order_id IS NULL THEN
    SELECT fd.sales_order_id INTO v_resolved_sales_order_id
    FROM financial_documents fd
    WHERE fd.id = p_document_id
      AND fd.sales_order_id IS NOT NULL
      AND fd.deleted_at IS NULL;
  END IF;

  IF p_sales_order_id IS NOT NULL AND p_document_id IS NULL THEN
    SELECT fd.id INTO v_resolved_document_id
    FROM financial_documents fd
    WHERE fd.sales_order_id = p_sales_order_id
      AND fd.document_type = 'customer_invoice'
      AND fd.deleted_at IS NULL
    ORDER BY fd.created_at DESC
    LIMIT 1;
  END IF;

  -- Check for existing link (handles all 3 constraint types)
  IF v_link_type = 'document' AND v_resolved_document_id IS NOT NULL THEN
    SELECT id INTO v_existing_link_id
    FROM transaction_document_links
    WHERE transaction_id = p_transaction_id
      AND document_id = v_resolved_document_id;

  ELSIF v_link_type = 'sales_order' THEN
    SELECT id INTO v_existing_link_id
    FROM transaction_document_links
    WHERE transaction_id = p_transaction_id
      AND sales_order_id = v_resolved_sales_order_id
    LIMIT 1;
    IF v_existing_link_id IS NULL AND v_resolved_document_id IS NOT NULL THEN
      SELECT id INTO v_existing_link_id
      FROM transaction_document_links
      WHERE transaction_id = p_transaction_id
        AND document_id = v_resolved_document_id;
    END IF;

  ELSIF v_link_type = 'purchase_order' THEN
    SELECT id INTO v_existing_link_id
    FROM transaction_document_links
    WHERE transaction_id = p_transaction_id
      AND purchase_order_id = p_purchase_order_id;
  END IF;

  -- UPDATE existing or INSERT new
  IF v_existing_link_id IS NOT NULL THEN
    UPDATE transaction_document_links
    SET allocated_amount = v_amount,
        document_id = COALESCE(v_resolved_document_id, document_id),
        sales_order_id = COALESCE(v_resolved_sales_order_id, sales_order_id),
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = v_existing_link_id
    RETURNING id INTO v_link_id;
  ELSE
    INSERT INTO transaction_document_links (
      transaction_id, document_id, sales_order_id, purchase_order_id,
      link_type, allocated_amount, notes
    ) VALUES (
      p_transaction_id, v_resolved_document_id, v_resolved_sales_order_id,
      p_purchase_order_id, v_link_type, v_amount, p_notes
    )
    RETURNING id INTO v_link_id;
  END IF;

  -- Update bank_transactions
  UPDATE bank_transactions
  SET matching_status = 'manual_matched',
      matched_document_id = COALESCE(v_resolved_document_id, matched_document_id),
      updated_at = NOW()
  WHERE id = p_transaction_id;

  -- FIX: Cap amount_paid at total_ttc to respect check_amount_paid_valid constraint
  IF v_resolved_document_id IS NOT NULL THEN
    UPDATE financial_documents
    SET
      amount_paid = LEAST(COALESCE(sub.total_allocated, 0), total_ttc),
      status = CASE
        WHEN COALESCE(sub.total_allocated, 0) >= total_ttc THEN 'paid'::document_status
        WHEN COALESCE(sub.total_allocated, 0) > 0 THEN 'partially_paid'::document_status
        ELSE status
      END,
      updated_at = NOW()
    FROM (
      SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated
      FROM transaction_document_links
      WHERE document_id = v_resolved_document_id
    ) sub
    WHERE id = v_resolved_document_id;
  END IF;

  -- Recalculate order paid amounts
  IF v_resolved_sales_order_id IS NOT NULL THEN
    PERFORM recalculate_order_paid_amount(p_sales_order_id := v_resolved_sales_order_id);
  END IF;

  IF p_purchase_order_id IS NOT NULL THEN
    PERFORM recalculate_order_paid_amount(p_purchase_order_id := p_purchase_order_id);
  END IF;

  RETURN v_link_id;
END;
$$;

-- FIX 2: Trigger — cap amount_paid at total_ttc in Passe 1
CREATE OR REPLACE FUNCTION update_sales_order_payment_status_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total_allocated NUMERIC;
  v_total_ttc NUMERIC;
  v_has_manual_payment BOOLEAN;
  v_has_order_payments BOOLEAN;
  v_new_status TEXT;
  v_old_document_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
    v_old_document_id := OLD.document_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  IF v_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE sales_order_id = v_order_id;

  SELECT total_ttc, (manual_payment_type IS NOT NULL)
  INTO v_total_ttc, v_has_manual_payment
  FROM sales_orders
  WHERE id = v_order_id;

  SELECT EXISTS (
    SELECT 1 FROM order_payments WHERE sales_order_id = v_order_id
  ) INTO v_has_order_payments;

  IF v_has_manual_payment AND (v_total_allocated > 0 OR v_has_order_payments) THEN
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

  UPDATE sales_orders
  SET payment_status_v2 = v_new_status,
      updated_at = NOW()
  WHERE id = v_order_id;

  -- Passe 1: FIX — LEAST(allocated, total_ttc) to respect check_amount_paid_valid
  UPDATE financial_documents fd
  SET
    amount_paid = LEAST(COALESCE(link_totals.total_allocated, 0), fd.total_ttc),
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

  -- Passe 2: Sur DELETE, remettre à sent les documents sans liens
  IF TG_OP = 'DELETE' AND v_old_document_id IS NOT NULL THEN
    UPDATE financial_documents fd
    SET
      amount_paid = 0,
      status = 'sent'::document_status,
      updated_at = NOW()
    WHERE fd.id = v_old_document_id
      AND fd.document_type = 'customer_invoice'
      AND fd.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM transaction_document_links tdl
        WHERE tdl.document_id = v_old_document_id
      );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

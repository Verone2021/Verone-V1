-- =====================================================================
-- Migration: Fix link/unlink RPCs to update sales_orders.paid_amount
--            and purchase_orders.paid_amount
-- =====================================================================
-- Problem: link_transaction_to_document updates financial_documents.amount_paid
--          but NEVER updates sales_orders.paid_amount or purchase_orders.paid_amount.
--          Result: paid_amount stays at 0 despite linked transactions.
-- Fix: Add paid_amount recalculation in both link and unlink RPCs + data repair.
-- =====================================================================

-- =====================================================================
-- 1. Fix link_transaction_to_document
-- =====================================================================
CREATE OR REPLACE FUNCTION link_transaction_to_document(
  p_transaction_id UUID,
  p_document_id UUID DEFAULT NULL,
  p_sales_order_id UUID DEFAULT NULL,
  p_purchase_order_id UUID DEFAULT NULL,
  p_allocated_amount DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_link_type VARCHAR(50);
  v_link_id UUID;
  v_amount DECIMAL;
  v_resolved_document_id UUID;
  v_resolved_sales_order_id UUID;
BEGIN
  -- Determine link type
  IF p_document_id IS NOT NULL THEN
    v_link_type := 'document';
  ELSIF p_sales_order_id IS NOT NULL THEN
    v_link_type := 'sales_order';
  ELSIF p_purchase_order_id IS NOT NULL THEN
    v_link_type := 'purchase_order';
  ELSE
    RAISE EXCEPTION 'Au moins un ID cible doit être fourni';
  END IF;

  -- Default amount = transaction amount
  IF p_allocated_amount IS NULL THEN
    SELECT ABS(amount) INTO v_amount FROM bank_transactions WHERE id = p_transaction_id;
  ELSE
    v_amount := p_allocated_amount;
  END IF;

  -- === Cross-reference resolution ===
  v_resolved_document_id := p_document_id;
  v_resolved_sales_order_id := p_sales_order_id;

  -- If linking to a document that has a sales_order_id, also set sales_order_id
  IF p_document_id IS NOT NULL AND p_sales_order_id IS NULL THEN
    SELECT fd.sales_order_id INTO v_resolved_sales_order_id
    FROM financial_documents fd
    WHERE fd.id = p_document_id
      AND fd.sales_order_id IS NOT NULL
      AND fd.deleted_at IS NULL;
  END IF;

  -- If linking to a sales order, find the related invoice
  IF p_sales_order_id IS NOT NULL AND p_document_id IS NULL THEN
    SELECT fd.id INTO v_resolved_document_id
    FROM financial_documents fd
    WHERE fd.sales_order_id = p_sales_order_id
      AND fd.document_type = 'customer_invoice'
      AND fd.deleted_at IS NULL
    ORDER BY fd.created_at DESC
    LIMIT 1;
  END IF;

  -- Insert the link
  INSERT INTO transaction_document_links (
    transaction_id,
    document_id,
    sales_order_id,
    purchase_order_id,
    link_type,
    allocated_amount,
    notes
  ) VALUES (
    p_transaction_id,
    v_resolved_document_id,
    v_resolved_sales_order_id,
    p_purchase_order_id,
    v_link_type,
    v_amount,
    p_notes
  )
  ON CONFLICT (transaction_id, document_id) DO UPDATE SET
    allocated_amount = EXCLUDED.allocated_amount,
    sales_order_id = COALESCE(EXCLUDED.sales_order_id, transaction_document_links.sales_order_id),
    notes = COALESCE(EXCLUDED.notes, transaction_document_links.notes),
    updated_at = NOW()
  RETURNING id INTO v_link_id;

  -- Update transaction matching_status
  UPDATE bank_transactions
  SET
    matching_status = 'manual_matched',
    matched_document_id = COALESCE(v_resolved_document_id, matched_document_id),
    updated_at = NOW()
  WHERE id = p_transaction_id;

  -- === Recalculate financial_documents.amount_paid by SUM ===
  IF v_resolved_document_id IS NOT NULL THEN
    UPDATE financial_documents
    SET
      amount_paid = COALESCE(sub.total_allocated, 0),
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

  -- === NEW: Recalculate sales_orders.paid_amount by SUM ===
  IF v_resolved_sales_order_id IS NOT NULL THEN
    UPDATE sales_orders
    SET
      paid_amount = COALESCE(sub.total_allocated, 0),
      paid_at = COALESCE(paid_at, NOW()),
      updated_at = NOW()
    FROM (
      SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated
      FROM transaction_document_links
      WHERE sales_order_id = v_resolved_sales_order_id
    ) sub
    WHERE id = v_resolved_sales_order_id;
  END IF;

  -- === NEW: Recalculate purchase_orders.paid_amount by SUM ===
  IF p_purchase_order_id IS NOT NULL THEN
    UPDATE purchase_orders
    SET
      paid_amount = COALESCE(sub.total_allocated, 0),
      paid_at = COALESCE(paid_at, NOW()),
      updated_at = NOW()
    FROM (
      SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated
      FROM transaction_document_links
      WHERE purchase_order_id = p_purchase_order_id
    ) sub
    WHERE id = p_purchase_order_id;
  END IF;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================
-- 2. Fix unlink_transaction_document
-- =====================================================================
CREATE OR REPLACE FUNCTION unlink_transaction_document(p_link_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_link RECORD;
BEGIN
  -- Get link info before deletion
  SELECT * INTO v_link FROM transaction_document_links WHERE id = p_link_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Delete the link FIRST
  DELETE FROM transaction_document_links WHERE id = p_link_id;

  -- Recalculate financial_documents.amount_paid by SUM
  IF v_link.document_id IS NOT NULL THEN
    UPDATE financial_documents
    SET
      amount_paid = COALESCE(sub.total_allocated, 0),
      status = CASE
        WHEN COALESCE(sub.total_allocated, 0) >= total_ttc THEN 'paid'::document_status
        WHEN COALESCE(sub.total_allocated, 0) > 0 THEN 'partially_paid'::document_status
        ELSE 'sent'::document_status
      END,
      updated_at = NOW()
    FROM (
      SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated
      FROM transaction_document_links
      WHERE document_id = v_link.document_id
    ) sub
    WHERE id = v_link.document_id;
  END IF;

  -- === NEW: Recalculate sales_orders.paid_amount by SUM ===
  IF v_link.sales_order_id IS NOT NULL THEN
    UPDATE sales_orders
    SET
      paid_amount = COALESCE(sub.total_allocated, 0),
      updated_at = NOW()
    FROM (
      SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated
      FROM transaction_document_links
      WHERE sales_order_id = v_link.sales_order_id
    ) sub
    WHERE id = v_link.sales_order_id;

    -- Reset paid_at if no more payments
    UPDATE sales_orders
    SET paid_at = NULL
    WHERE id = v_link.sales_order_id
      AND paid_amount = 0
      AND paid_at IS NOT NULL;
  END IF;

  -- === NEW: Recalculate purchase_orders.paid_amount by SUM ===
  IF v_link.purchase_order_id IS NOT NULL THEN
    UPDATE purchase_orders
    SET
      paid_amount = COALESCE(sub.total_allocated, 0),
      updated_at = NOW()
    FROM (
      SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated
      FROM transaction_document_links
      WHERE purchase_order_id = v_link.purchase_order_id
    ) sub
    WHERE id = v_link.purchase_order_id;

    -- Reset paid_at if no more payments
    UPDATE purchase_orders
    SET paid_at = NULL
    WHERE id = v_link.purchase_order_id
      AND paid_amount = 0
      AND paid_at IS NOT NULL;
  END IF;

  -- If no more links on this transaction, reset matching_status
  IF NOT EXISTS (SELECT 1 FROM transaction_document_links WHERE transaction_id = v_link.transaction_id) THEN
    UPDATE bank_transactions
    SET
      matching_status = 'unmatched',
      matched_document_id = NULL,
      updated_at = NOW()
    WHERE id = v_link.transaction_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================
-- 3. Data repair: recalculate paid_amount for ALL existing orders
-- =====================================================================

-- Repair sales_orders where paid_amount is behind allocated total
UPDATE sales_orders so
SET
  paid_amount = sub.total_allocated,
  paid_at = COALESCE(so.paid_at, NOW()),
  updated_at = NOW()
FROM (
  SELECT sales_order_id, SUM(allocated_amount) AS total_allocated
  FROM transaction_document_links
  WHERE sales_order_id IS NOT NULL
  GROUP BY sales_order_id
) sub
WHERE so.id = sub.sales_order_id
  AND COALESCE(so.paid_amount, 0) < sub.total_allocated;

-- Repair purchase_orders where paid_amount is behind allocated total
UPDATE purchase_orders po
SET
  paid_amount = sub.total_allocated,
  paid_at = COALESCE(po.paid_at, NOW()),
  updated_at = NOW()
FROM (
  SELECT purchase_order_id, SUM(allocated_amount) AS total_allocated
  FROM transaction_document_links
  WHERE purchase_order_id IS NOT NULL
  GROUP BY purchase_order_id
) sub
WHERE po.id = sub.purchase_order_id
  AND COALESCE(po.paid_amount, 0) < sub.total_allocated;

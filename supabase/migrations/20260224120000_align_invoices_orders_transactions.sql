-- Migration: Align invoices, orders, and transactions
-- Date: 2026-02-24
-- Problem: 58 transaction_document_links have allocated_amount IS NULL (legacy migration),
--   causing the payment trigger to ignore them. Also, no cross-references between
--   document_id and sales_order_id on the same link, so linking a transaction to an
--   order does NOT update the related invoice (and vice versa).
--
-- Fix (5 operations):
--   1a. Backfill NULL allocated_amount from bank_transactions.amount
--   1b. Enhance link_transaction_to_document() to auto-populate cross-references
--   1c. Enhance unlink_transaction_document() to recalculate by SUM
--   1d. Enhance trigger to also sync financial_documents.amount_paid
--   1e. Backfill cross-references + global recalculation

-- =============================================================================
-- 1a. Fix allocated_amount IS NULL (58 legacy links)
-- =============================================================================

UPDATE transaction_document_links tdl
SET allocated_amount = ABS(bt.amount)
FROM bank_transactions bt
WHERE bt.id = tdl.transaction_id
  AND tdl.allocated_amount IS NULL;

-- Make NOT NULL going forward
ALTER TABLE transaction_document_links
  ALTER COLUMN allocated_amount SET NOT NULL,
  ALTER COLUMN allocated_amount SET DEFAULT 0;

-- =============================================================================
-- 1b. Enhance RPC link_transaction_to_document()
--     - Auto-populate cross-references (document_id ↔ sales_order_id)
--     - Use SUM-based amount_paid (no incrementation drift)
-- =============================================================================

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

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 1c. Enhance RPC unlink_transaction_document()
--     - Recalculate amount_paid by SUM (not decrement)
--     - Also handle cross-referenced sales_order recalculation
-- =============================================================================

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

  -- If no more links on this transaction, reset matching_status
  IF NOT EXISTS (SELECT 1 FROM transaction_document_links WHERE transaction_id = v_link.transaction_id) THEN
    UPDATE bank_transactions
    SET
      matching_status = 'unmatched',
      matched_document_id = NULL,
      updated_at = NOW()
    WHERE id = v_link.transaction_id;
  END IF;

  -- Note: sales_order payment_status_v2 is handled by the trigger
  -- (trg_update_sales_order_payment_status_v2 fires on DELETE)

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 1d. Enhance trigger update_sales_order_payment_status_v2()
--     - After updating sales_order, also sync related financial_documents
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

  -- Calculate new payment status
  IF v_has_manual_payment THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated >= v_total_ttc THEN
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

  -- === NEW: Sync related financial_documents ===
  -- Update all customer invoices linked to this order (via sales_order_id on the link OR on the document)
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
    -- Sum allocated amounts for each document linked to this order
    SELECT tdl.document_id, COALESCE(SUM(tdl.allocated_amount), 0) AS total_allocated
    FROM transaction_document_links tdl
    WHERE tdl.document_id IS NOT NULL
      AND tdl.sales_order_id = v_order_id
    GROUP BY tdl.document_id
  ) link_totals
  WHERE fd.id = link_totals.document_id
    AND fd.document_type = 'customer_invoice'
    AND fd.deleted_at IS NULL;

  -- Also update invoices linked by sales_order_id on financial_documents but NOT in transaction_document_links
  -- (these should get amount_paid = v_total_allocated from the order's perspective)
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

-- =============================================================================
-- 1e. Backfill cross-references + global recalculation
-- =============================================================================

-- Backfill document_id on existing links (order → invoice)
UPDATE transaction_document_links tdl
SET document_id = fd.id
FROM financial_documents fd
WHERE fd.sales_order_id = tdl.sales_order_id
  AND fd.document_type = 'customer_invoice'
  AND fd.deleted_at IS NULL
  AND tdl.sales_order_id IS NOT NULL
  AND tdl.document_id IS NULL;

-- Backfill sales_order_id on existing links (document → order)
UPDATE transaction_document_links tdl
SET sales_order_id = fd.sales_order_id
FROM financial_documents fd
WHERE fd.id = tdl.document_id
  AND fd.sales_order_id IS NOT NULL
  AND tdl.document_id IS NOT NULL
  AND tdl.sales_order_id IS NULL;

-- Recalculate payment_status_v2 for ALL orders that have linked transactions
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

-- Recalculate amount_paid for ALL financial_documents that have linked transactions
UPDATE financial_documents fd
SET
  amount_paid = COALESCE(tdl.total_allocated, 0),
  status = CASE
    WHEN COALESCE(tdl.total_allocated, 0) >= fd.total_ttc THEN 'paid'::document_status
    WHEN COALESCE(tdl.total_allocated, 0) > 0 THEN 'partially_paid'::document_status
    ELSE fd.status
  END,
  updated_at = NOW()
FROM (
  SELECT document_id, SUM(allocated_amount) as total_allocated
  FROM transaction_document_links
  WHERE document_id IS NOT NULL
  GROUP BY document_id
) tdl
WHERE tdl.document_id = fd.id
  AND fd.deleted_at IS NULL;

-- Also update invoices linked via sales_order_id on financial_documents (no direct link in tdl)
UPDATE financial_documents fd
SET
  amount_paid = COALESCE(tdl.total_allocated, 0),
  status = CASE
    WHEN COALESCE(tdl.total_allocated, 0) >= fd.total_ttc THEN 'paid'::document_status
    WHEN COALESCE(tdl.total_allocated, 0) > 0 THEN 'partially_paid'::document_status
    ELSE fd.status
  END,
  updated_at = NOW()
FROM (
  SELECT sales_order_id, SUM(allocated_amount) as total_allocated
  FROM transaction_document_links
  WHERE sales_order_id IS NOT NULL
  GROUP BY sales_order_id
) tdl
WHERE fd.sales_order_id = tdl.sales_order_id
  AND fd.document_type = 'customer_invoice'
  AND fd.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM transaction_document_links x
    WHERE x.document_id = fd.id
  );

-- =====================================================================
-- Migration: order_payments table + fix RPCs for unified payment tracking
-- =====================================================================
-- Problem: Manual payments stored as flat fields on sales_orders (no history),
--          and link/unlink RPCs overwrite paid_amount ignoring manual payments.
-- Fix: Dedicated order_payments table + recalculate_order_paid_amount helper
--       called by all payment paths (manual, link, unlink).
-- =====================================================================

-- =====================================================================
-- 1. Create order_payments table
-- =====================================================================
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  payment_type manual_payment_type NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference TEXT,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_one_order CHECK (
    (sales_order_id IS NOT NULL AND purchase_order_id IS NULL) OR
    (sales_order_id IS NULL AND purchase_order_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_payments_sales_order
  ON order_payments(sales_order_id) WHERE sales_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_payments_purchase_order
  ON order_payments(purchase_order_id) WHERE purchase_order_id IS NOT NULL;

-- RLS
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access" ON order_payments
  FOR ALL TO authenticated USING (is_backoffice_user());

-- =====================================================================
-- 2. Migrate existing manual payments from sales_orders to order_payments
-- =====================================================================
INSERT INTO order_payments (sales_order_id, payment_type, amount, payment_date, reference, note, created_by)
SELECT
  so.id,
  so.manual_payment_type,
  GREATEST(0, COALESCE(so.paid_amount, 0) - COALESCE(
    (SELECT SUM(allocated_amount) FROM transaction_document_links WHERE sales_order_id = so.id), 0
  )),
  COALESCE(so.manual_payment_date, NOW()),
  so.manual_payment_reference,
  so.manual_payment_note,
  so.manual_payment_by
FROM sales_orders so
WHERE so.manual_payment_type IS NOT NULL
  AND GREATEST(0, COALESCE(so.paid_amount, 0) - COALESCE(
    (SELECT SUM(allocated_amount) FROM transaction_document_links WHERE sales_order_id = so.id), 0
  )) > 0;

-- =====================================================================
-- 3. Create recalculate_order_paid_amount helper
-- =====================================================================
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
    SELECT COALESCE(SUM(allocated_amount), 0) INTO v_links_total
    FROM transaction_document_links WHERE purchase_order_id = p_purchase_order_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_manual_total
    FROM order_payments WHERE purchase_order_id = p_purchase_order_id;

    v_total := v_links_total + v_manual_total;

    UPDATE purchase_orders SET
      paid_amount = v_total,
      paid_at = CASE WHEN v_total > 0 THEN COALESCE(paid_at, NOW()) ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_purchase_order_id;
  END IF;
END;
$$;

-- =====================================================================
-- 4. Fix link_transaction_to_document — use recalculate helper
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

  -- === Recalculate order paid_amount from BOTH sources (links + manual) ===
  IF v_resolved_sales_order_id IS NOT NULL THEN
    PERFORM recalculate_order_paid_amount(p_sales_order_id := v_resolved_sales_order_id);
  END IF;

  IF p_purchase_order_id IS NOT NULL THEN
    PERFORM recalculate_order_paid_amount(p_purchase_order_id := p_purchase_order_id);
  END IF;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 5. Fix unlink_transaction_document — use recalculate helper
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

  -- === Recalculate order paid_amount from BOTH sources (links + manual) ===
  IF v_link.sales_order_id IS NOT NULL THEN
    PERFORM recalculate_order_paid_amount(p_sales_order_id := v_link.sales_order_id);
  END IF;

  IF v_link.purchase_order_id IS NOT NULL THEN
    PERFORM recalculate_order_paid_amount(p_purchase_order_id := v_link.purchase_order_id);
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
-- 6. Fix mark_payment_received — insert into order_payments + recalculate
-- =====================================================================
CREATE OR REPLACE FUNCTION mark_payment_received(
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
BEGIN
  -- 1. Insert into order_payments
  INSERT INTO order_payments (
    sales_order_id, payment_type, amount, payment_date, reference, note, created_by
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

  -- 2. Recalculate paid_amount from both sources
  PERFORM recalculate_order_paid_amount(p_sales_order_id := p_order_id);

  -- 3. Update LinkMe commissions
  UPDATE linkme_commissions
  SET status = 'validated', validated_at = NOW()
  WHERE order_id = p_order_id AND status = 'pending';

  RETURN v_payment_id;
END;
$$;

-- =====================================================================
-- 7. Create delete_order_payment RPC
-- =====================================================================
CREATE OR REPLACE FUNCTION delete_order_payment(p_payment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  SELECT * INTO v_payment FROM order_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  DELETE FROM order_payments WHERE id = p_payment_id;

  -- Recalculate paid_amount
  PERFORM recalculate_order_paid_amount(
    p_sales_order_id := v_payment.sales_order_id,
    p_purchase_order_id := v_payment.purchase_order_id
  );

  -- Clean up legacy manual_payment_* fields if no more manual payments
  IF v_payment.sales_order_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM order_payments WHERE sales_order_id = v_payment.sales_order_id) THEN
      UPDATE sales_orders SET
        manual_payment_type = NULL,
        manual_payment_date = NULL,
        manual_payment_reference = NULL,
        manual_payment_note = NULL
      WHERE id = v_payment.sales_order_id;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

-- =====================================================================
-- 8. Fix legacy trigger that blindly sets payment_status_v2='paid'
-- =====================================================================
-- The old trigger sets 'paid' whenever manual_payment_type is set,
-- ignoring partial payments. Now recalculate_order_paid_amount handles this.
CREATE OR REPLACE FUNCTION update_sales_order_manual_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only set manual_payment_date default, do NOT override payment_status_v2
  -- (recalculate_order_paid_amount handles status based on actual amounts)
  IF NEW.manual_payment_type IS NOT NULL AND OLD.manual_payment_type IS NULL THEN
    NEW.manual_payment_date := COALESCE(NEW.manual_payment_date, NOW());
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================================
-- 9. Data repair: recalculate all orders with payments
-- =====================================================================
-- Re-run recalculate for all orders that have either manual payments or links
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Sales orders with any payment source
  FOR r IN
    SELECT DISTINCT so.id
    FROM sales_orders so
    WHERE EXISTS (SELECT 1 FROM order_payments WHERE sales_order_id = so.id)
       OR EXISTS (SELECT 1 FROM transaction_document_links WHERE sales_order_id = so.id)
  LOOP
    PERFORM recalculate_order_paid_amount(p_sales_order_id := r.id);
  END LOOP;

  -- Purchase orders with any payment source
  FOR r IN
    SELECT DISTINCT po.id
    FROM purchase_orders po
    WHERE EXISTS (SELECT 1 FROM order_payments WHERE purchase_order_id = po.id)
       OR EXISTS (SELECT 1 FROM transaction_document_links WHERE purchase_order_id = po.id)
  LOOP
    PERFORM recalculate_order_paid_amount(p_purchase_order_id := r.id);
  END LOOP;
END;
$$;

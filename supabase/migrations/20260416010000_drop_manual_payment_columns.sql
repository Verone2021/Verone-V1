-- ============================================================================
-- Migration: Drop legacy manual_payment_* columns from sales_orders & purchase_orders
-- ============================================================================
-- Context: The order_payments table (created 2026-03-10) is now the single source
-- of truth for manual payments. The 5 legacy columns on each order table are no
-- longer read or written by application code. This migration:
--   1. Migrates 8 orphan credit-note SOs (AV-25-*) that still rely on the flag
--   2. Drops 3 obsolete triggers + 3 obsolete functions
--   3. Rewrites 5 active functions to remove manual_payment_type references
--   4. Recreates the affiliate_pending_orders view without the 5 columns
--   5. Drops the 10 columns (5 per table)
--   6. Preserves the manual_payment_type ENUM (still used by order_payments)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Migrate 8 orphan compensation SOs (AV-25-*) to order_payments
-- These have manual_payment_type='compensation', paid_amount=0, no order_payments row.
-- They are credit notes (total_ttc < 0). We record a zero-amount compensation entry
-- for traceability, then ensure their payment_status_v2 stays 'paid'.
-- ============================================================================

INSERT INTO order_payments (sales_order_id, payment_type, amount, payment_date, reference, note)
SELECT
  so.id,
  'compensation'::manual_payment_type,
  0.01,  -- minimal positive amount (CHECK > 0 constraint)
  so.manual_payment_date,
  so.manual_payment_reference,
  COALESCE(so.manual_payment_note, 'Avoir - compensation migree depuis colonnes legacy')
FROM sales_orders so
WHERE so.manual_payment_type = 'compensation'
  AND NOT EXISTS (
    SELECT 1 FROM order_payments op WHERE op.sales_order_id = so.id
  );

-- Force payment_status_v2='paid' for credit notes (recalculate can't handle total_ttc < 0)
UPDATE sales_orders
SET payment_status_v2 = 'paid', updated_at = NOW()
WHERE order_number LIKE 'AV-25-%'
  AND total_ttc < 0;

-- ============================================================================
-- STEP 2: Drop 3 obsolete triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trg_update_sales_order_manual_payment ON sales_orders;
DROP TRIGGER IF EXISTS trg_update_purchase_order_manual_payment ON purchase_orders;
DROP TRIGGER IF EXISTS trg_purchase_order_manual_payment ON purchase_orders;

-- ============================================================================
-- STEP 3: Drop 3 obsolete functions
-- ============================================================================

DROP FUNCTION IF EXISTS update_sales_order_manual_payment_status();
DROP FUNCTION IF EXISTS update_purchase_order_manual_payment_status();
DROP FUNCTION IF EXISTS trg_purchase_order_manual_payment_update();

-- ============================================================================
-- STEP 4: Rewrite 5 active functions (remove v_has_manual_payment logic)
-- ============================================================================

-- 4a. update_sales_order_payment_status_v2()
-- Trigger on transaction_document_links for SO payment status
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

  SELECT total_ttc
  INTO v_total_ttc
  FROM sales_orders
  WHERE id = v_order_id;

  SELECT EXISTS (
    SELECT 1 FROM order_payments WHERE sales_order_id = v_order_id
  ) INTO v_has_order_payments;

  -- Payment status based on order_payments + bank reconciliation only
  IF (v_total_allocated + COALESCE((SELECT SUM(amount) FROM order_payments WHERE sales_order_id = v_order_id), 0)) >= v_total_ttc AND v_total_ttc > 0 THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > v_total_ttc AND v_total_ttc > 0 THEN
    v_new_status := 'overpaid';
  ELSIF v_total_allocated > 0 OR v_has_order_payments THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update sales_order status
  UPDATE sales_orders
  SET payment_status_v2 = v_new_status,
      updated_at = NOW()
  WHERE id = v_order_id;

  -- Passe 1 : Update documents qui ont encore des liens — CAP at total_ttc
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

  -- Passe 2 : Sur DELETE, remettre a sent les documents sans lien
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

-- 4b. update_purchase_order_payment_status_v2()
-- Trigger on transaction_document_links for PO payment status
CREATE OR REPLACE FUNCTION update_purchase_order_payment_status_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total_allocated NUMERIC;
  v_total_ttc NUMERIC;
  v_has_order_payments BOOLEAN;
  v_new_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.purchase_order_id;
  ELSE
    v_order_id := NEW.purchase_order_id;
  END IF;

  IF v_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE purchase_order_id = v_order_id;

  SELECT total_ttc
  INTO v_total_ttc
  FROM purchase_orders
  WHERE id = v_order_id;

  SELECT EXISTS (
    SELECT 1 FROM order_payments WHERE purchase_order_id = v_order_id
  ) INTO v_has_order_payments;

  -- Payment status based on order_payments + bank reconciliation only
  IF (v_total_allocated + COALESCE((SELECT SUM(amount) FROM order_payments WHERE purchase_order_id = v_order_id), 0)) >= v_total_ttc AND v_total_ttc > 0 THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > v_total_ttc AND v_total_ttc > 0 THEN
    v_new_status := 'overpaid';
  ELSIF v_total_allocated > 0 OR v_has_order_payments THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  UPDATE purchase_orders
  SET payment_status_v2 = v_new_status,
      updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4c. recalculate_so_payment_status_on_total_change()
-- Fires on sales_orders BEFORE UPDATE when total_ttc changes
CREATE OR REPLACE FUNCTION recalculate_so_payment_status_on_total_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_allocated NUMERIC;
  v_total_manual NUMERIC;
  v_total_paid NUMERIC;
  v_new_status TEXT;
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
BEGIN
  IF OLD.total_ttc IS NOT DISTINCT FROM NEW.total_ttc THEN
    RETURN NEW;
  END IF;

  -- Skip site-internet orders: Stripe manages payment status
  IF NEW.channel_id = v_site_internet_channel_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE sales_order_id = NEW.id;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_manual
  FROM order_payments
  WHERE sales_order_id = NEW.id;

  v_total_paid := v_total_allocated + v_total_manual;

  IF v_total_paid >= NEW.total_ttc AND NEW.total_ttc > 0 THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > NEW.total_ttc AND NEW.total_ttc > 0 THEN
    v_new_status := 'overpaid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  NEW.payment_status_v2 := v_new_status;
  RETURN NEW;
END;
$$;

-- 4d. recalculate_po_payment_status_on_total_change()
-- Fires on purchase_orders BEFORE UPDATE when total_ttc changes
CREATE OR REPLACE FUNCTION recalculate_po_payment_status_on_total_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_allocated NUMERIC;
  v_total_manual NUMERIC;
  v_total_paid NUMERIC;
  v_new_status TEXT;
BEGIN
  IF OLD.total_ttc IS NOT DISTINCT FROM NEW.total_ttc THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE purchase_order_id = NEW.id;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_manual
  FROM order_payments
  WHERE purchase_order_id = NEW.id;

  v_total_paid := v_total_allocated + v_total_manual;

  IF v_total_paid >= NEW.total_ttc AND NEW.total_ttc > 0 THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > NEW.total_ttc AND NEW.total_ttc > 0 THEN
    v_new_status := 'overpaid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  NEW.payment_status_v2 := v_new_status;
  RETURN NEW;
END;
$$;

-- 4e. delete_order_payment() — remove legacy UPDATE of manual_payment_* columns
CREATE OR REPLACE FUNCTION delete_order_payment(p_payment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  SELECT * INTO v_payment FROM order_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  DELETE FROM order_payments WHERE id = p_payment_id;

  PERFORM recalculate_order_paid_amount(
    p_sales_order_id := v_payment.sales_order_id,
    p_purchase_order_id := v_payment.purchase_order_id
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- STEP 5: Recreate affiliate_pending_orders view without manual_payment_* columns
-- ============================================================================

DROP VIEW IF EXISTS affiliate_pending_orders;

CREATE VIEW affiliate_pending_orders AS
SELECT
  so.id,
  so.order_number,
  so.customer_id,
  so.currency,
  so.tax_rate,
  so.total_ht,
  so.total_ttc,
  so.expected_delivery_date,
  so.shipping_address,
  so.billing_address,
  so.payment_terms,
  so.notes,
  so.created_by,
  so.confirmed_by,
  so.shipped_by,
  so.delivered_by,
  so.confirmed_at,
  so.shipped_at,
  so.delivered_at,
  so.cancelled_at,
  so.created_at,
  so.updated_at,
  so.paid_amount,
  so.paid_at,
  so.warehouse_exit_at,
  so.warehouse_exit_by,
  so.ready_for_shipment,
  so.cancellation_reason,
  so.customer_type,
  so.channel_id,
  so.applied_discount_codes,
  so.total_discount_amount,
  so.cancelled_by,
  so.eco_tax_total,
  so.eco_tax_vat_rate,
  so.closed_at,
  so.closed_by,
  so.payment_terms_type,
  so.payment_terms_notes,
  so.shipping_cost_ht,
  so.insurance_cost_ht,
  so.handling_cost_ht,
  so.affiliate_total_ht,
  so.affiliate_total_ttc,
  so.linkme_selection_id,
  so.created_by_affiliate_id,
  so.pending_admin_validation,
  so.payment_status_v2,
  so.fees_vat_rate,
  so.responsable_contact_id,
  so.billing_contact_id,
  so.delivery_contact_id,
  so.invoiced_at,
  so.order_date,
  so.status,
  so.is_shopping_center_delivery,
  so.accepts_semi_truck,
  la.display_name AS affiliate_name,
  la.email AS affiliate_email,
  la.affiliate_type,
  ls.name AS selection_name
FROM sales_orders so
JOIN linkme_affiliates la ON so.created_by_affiliate_id = la.id
LEFT JOIN linkme_selections ls ON so.linkme_selection_id = ls.id
WHERE so.status = 'pending_approval'::sales_order_status;

-- ============================================================================
-- STEP 6: Drop the 10 legacy columns
-- ============================================================================

ALTER TABLE sales_orders
  DROP COLUMN IF EXISTS manual_payment_type,
  DROP COLUMN IF EXISTS manual_payment_date,
  DROP COLUMN IF EXISTS manual_payment_reference,
  DROP COLUMN IF EXISTS manual_payment_note,
  DROP COLUMN IF EXISTS manual_payment_by;

ALTER TABLE purchase_orders
  DROP COLUMN IF EXISTS manual_payment_type,
  DROP COLUMN IF EXISTS manual_payment_date,
  DROP COLUMN IF EXISTS manual_payment_reference,
  DROP COLUMN IF EXISTS manual_payment_note,
  DROP COLUMN IF EXISTS manual_payment_by;

-- NOTE: The manual_payment_type ENUM is PRESERVED — it is still used by
-- order_payments.payment_type. Do NOT drop it.

-- ============================================================================
-- STEP 7: Safety net — ensure credit notes keep correct status
-- (in case any trigger fired during column drop)
-- ============================================================================

UPDATE sales_orders
SET payment_status_v2 = 'paid'
WHERE total_ttc < 0
  AND payment_status_v2 != 'paid';

COMMIT;

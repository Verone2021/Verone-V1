-- Migration: Fix payment status trigger + remove legacy enum value + cleanup
-- Context: The trigger forces 'paid' when manual_payment_type IS NOT NULL, even if paid_amount = 0.
-- This causes 10 legacy orders to show as "Paid" with 0 EUR actually received.
--
-- Fix:
-- 1. Create order_payments for 10 legacy orders (they were genuinely paid)
-- 2. Set paid_amount = total_ttc for these orders
-- 3. Convert legacy enum value → transfer_other, then remove it from enum
-- 4. Update triggers: manual_payment_type only forces 'paid' if backed by actual payments

-- ============================================================================
-- 1. Create order_payments for the 10 legacy orders
-- ============================================================================
INSERT INTO order_payments (sales_order_id, amount, payment_type, payment_date, note)
SELECT
  id,
  total_ttc,
  'transfer_other'::manual_payment_type,
  COALESCE(paid_at, created_at),
  'Paiement legacy importation. Montant reconstitué depuis total_ttc.'
FROM sales_orders
WHERE manual_payment_type = 'verified_bubble'
  AND paid_amount = 0
  AND total_ttc > 0;

-- ============================================================================
-- 2. Set paid_amount = total_ttc for these orders
-- ============================================================================
UPDATE sales_orders
SET paid_amount = total_ttc,
    updated_at = NOW()
WHERE manual_payment_type = 'verified_bubble'
  AND paid_amount = 0
  AND total_ttc > 0;

-- ============================================================================
-- 3. Convert legacy enum value → transfer_other, then recreate enum without it
-- ============================================================================

-- Convert all references
UPDATE sales_orders
SET manual_payment_type = 'transfer_other', updated_at = NOW()
WHERE manual_payment_type = 'verified_bubble';

UPDATE purchase_orders
SET manual_payment_type = 'transfer_other', updated_at = NOW()
WHERE manual_payment_type = 'verified_bubble';

UPDATE order_payments
SET payment_type = 'transfer_other'
WHERE payment_type = 'verified_bubble';

-- Drop dependent objects before altering enum
DROP VIEW IF EXISTS affiliate_pending_orders;
DROP TRIGGER IF EXISTS trg_update_sales_order_manual_payment ON sales_orders;
DROP TRIGGER IF EXISTS trg_update_purchase_order_manual_payment ON purchase_orders;
DROP TRIGGER IF EXISTS trg_purchase_order_manual_payment ON purchase_orders;

-- Recreate enum without legacy value
ALTER TYPE manual_payment_type RENAME TO manual_payment_type_old;

CREATE TYPE manual_payment_type AS ENUM (
  'cash', 'check', 'transfer_other', 'card', 'compensation'
);

ALTER TABLE sales_orders
  ALTER COLUMN manual_payment_type TYPE manual_payment_type
  USING manual_payment_type::text::manual_payment_type;

ALTER TABLE purchase_orders
  ALTER COLUMN manual_payment_type TYPE manual_payment_type
  USING manual_payment_type::text::manual_payment_type;

ALTER TABLE order_payments
  ALTER COLUMN payment_type TYPE manual_payment_type
  USING payment_type::text::manual_payment_type;

DROP TYPE manual_payment_type_old;

COMMENT ON COLUMN sales_orders.manual_payment_type IS 'Type de paiement manuel: cash, check, transfer_other, card, compensation';

-- Recreate triggers
CREATE TRIGGER trg_update_sales_order_manual_payment
  BEFORE UPDATE OF manual_payment_type ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION update_sales_order_manual_payment_status();

CREATE TRIGGER trg_update_purchase_order_manual_payment
  BEFORE UPDATE OF manual_payment_type ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_manual_payment_status();

CREATE TRIGGER trg_purchase_order_manual_payment
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION trg_purchase_order_manual_payment_update();

-- Recreate view
CREATE OR REPLACE VIEW affiliate_pending_orders AS
SELECT so.id, so.order_number, so.customer_id, so.currency, so.tax_rate,
    so.total_ht, so.total_ttc, so.expected_delivery_date, so.shipping_address,
    so.billing_address, so.payment_terms, so.notes, so.created_by, so.confirmed_by,
    so.shipped_by, so.delivered_by, so.confirmed_at, so.shipped_at, so.delivered_at,
    so.cancelled_at, so.created_at, so.updated_at, so.paid_amount, so.paid_at,
    so.warehouse_exit_at, so.warehouse_exit_by, so.ready_for_shipment,
    so.cancellation_reason, so.customer_type, so.channel_id,
    so.applied_discount_codes, so.total_discount_amount, so.cancelled_by,
    so.eco_tax_total, so.eco_tax_vat_rate, so.closed_at, so.closed_by,
    so.payment_terms_type, so.payment_terms_notes, so.shipping_cost_ht,
    so.insurance_cost_ht, so.handling_cost_ht, so.affiliate_total_ht,
    so.affiliate_total_ttc, so.linkme_selection_id, so.created_by_affiliate_id,
    so.pending_admin_validation, so.payment_status_v2, so.manual_payment_type,
    so.manual_payment_date, so.manual_payment_reference, so.manual_payment_note,
    so.manual_payment_by, so.fees_vat_rate, so.responsable_contact_id,
    so.billing_contact_id, so.delivery_contact_id, so.invoiced_at, so.order_date,
    so.status, so.is_shopping_center_delivery, so.accepts_semi_truck,
    la.display_name AS affiliate_name, la.email AS affiliate_email,
    la.affiliate_type, ls.name AS selection_name
FROM sales_orders so
JOIN linkme_affiliates la ON so.created_by_affiliate_id = la.id
LEFT JOIN linkme_selections ls ON so.linkme_selection_id = ls.id
WHERE so.status = 'pending_approval'::sales_order_status;

-- ============================================================================
-- 4. Fix trigger: manual_payment_type alone no longer forces 'paid'
--    Now requires either order_payments to exist OR allocated_amount > 0
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
  v_has_order_payments BOOLEAN;
  v_new_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
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

  -- manual_payment_type only forces 'paid' if backed by actual payment records
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
  SET payment_status_v2 = v_new_status, updated_at = NOW()
  WHERE id = v_order_id;

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
    WHERE tdl.document_id IS NOT NULL AND tdl.sales_order_id = v_order_id
    GROUP BY tdl.document_id
  ) link_totals
  WHERE fd.id = link_totals.document_id
    AND fd.document_type = 'customer_invoice' AND fd.deleted_at IS NULL;

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
    AND fd.document_type = 'customer_invoice' AND fd.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM transaction_document_links tdl
      WHERE tdl.document_id = fd.id AND tdl.sales_order_id = v_order_id
    );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 5. Fix purchase_order trigger
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

  SELECT total_ttc, (manual_payment_type IS NOT NULL)
  INTO v_total_ttc, v_has_manual_payment
  FROM purchase_orders
  WHERE id = v_order_id;

  SELECT EXISTS (
    SELECT 1 FROM order_payments WHERE purchase_order_id = v_order_id
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

  UPDATE purchase_orders
  SET payment_status_v2 = v_new_status, updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 6. Fix BEFORE trigger on sales_orders (total_ttc change)
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
  v_has_order_payments BOOLEAN;
  v_new_status TEXT;
BEGIN
  IF OLD.total_ttc IS NOT DISTINCT FROM NEW.total_ttc THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE sales_order_id = NEW.id;

  v_has_manual_payment := (NEW.manual_payment_type IS NOT NULL);

  SELECT EXISTS (
    SELECT 1 FROM order_payments WHERE sales_order_id = NEW.id
  ) INTO v_has_order_payments;

  IF v_has_manual_payment AND (v_total_allocated > 0 OR v_has_order_payments) THEN
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

  NEW.payment_status_v2 := v_new_status;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 7. Fix BEFORE trigger on purchase_orders (total_ttc change)
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
  v_has_order_payments BOOLEAN;
  v_new_status TEXT;
BEGIN
  IF OLD.total_ttc IS NOT DISTINCT FROM NEW.total_ttc THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM transaction_document_links
  WHERE purchase_order_id = NEW.id;

  v_has_manual_payment := (NEW.manual_payment_type IS NOT NULL);

  SELECT EXISTS (
    SELECT 1 FROM order_payments WHERE purchase_order_id = NEW.id
  ) INTO v_has_order_payments;

  IF v_has_manual_payment AND (v_total_allocated > 0 OR v_has_order_payments) THEN
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

  NEW.payment_status_v2 := v_new_status;
  RETURN NEW;
END;
$$;

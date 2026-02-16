-- ============================================
-- Fix: Update billing_contact_source check constraint to match form values
--
-- The form sends: 'same_as_responsable', 'existing', 'new'
-- The old constraint only allowed: 'step1', 'step2', 'custom'
-- ============================================

ALTER TABLE sales_order_linkme_details
  DROP CONSTRAINT IF EXISTS sales_order_linkme_details_billing_contact_source_check;

ALTER TABLE sales_order_linkme_details
  ADD CONSTRAINT sales_order_linkme_details_billing_contact_source_check
  CHECK (billing_contact_source = ANY (ARRAY[
    'same_as_responsable'::text,
    'existing'::text,
    'new'::text,
    -- Keep old values for backward compatibility
    'step1'::text,
    'step2'::text,
    'custom'::text
  ]));

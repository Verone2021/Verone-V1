-- Fix: Add 'parent_organisation' and 'responsable' to billing_contact_source CHECK constraint
-- The RPC create_public_linkme_order uses 'parent_organisation' when billing uses parent org,
-- and 'responsable' when billing contact is same as responsable.
-- Both values were missing from the CHECK constraint, causing insert failures.

ALTER TABLE sales_order_linkme_details
DROP CONSTRAINT IF EXISTS sales_order_linkme_details_billing_contact_source_check;

ALTER TABLE sales_order_linkme_details
ADD CONSTRAINT sales_order_linkme_details_billing_contact_source_check
CHECK (billing_contact_source = ANY (ARRAY[
  'same_as_responsable'::text,
  'existing'::text,
  'new'::text,
  'step1'::text,
  'step2'::text,
  'custom'::text,
  'parent_organisation'::text,
  'responsable'::text,
  'owner'::text
]));

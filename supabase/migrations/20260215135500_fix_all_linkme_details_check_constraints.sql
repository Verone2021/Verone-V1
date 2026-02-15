-- ============================================
-- Fix: Update ALL check constraints on sales_order_linkme_details
-- to match actual form values sent by the LinkMe order form
-- ============================================

-- 1. requester_type: form sends 'existing_contact' or 'manual_entry'
--    old: 'responsable_enseigne', 'architecte', 'franchisee'
ALTER TABLE sales_order_linkme_details
  DROP CONSTRAINT IF EXISTS sales_order_linkme_details_requester_type_check;

ALTER TABLE sales_order_linkme_details
  ADD CONSTRAINT sales_order_linkme_details_requester_type_check
  CHECK (requester_type = ANY (ARRAY[
    'existing_contact'::text,
    'manual_entry'::text,
    -- Keep old values for backward compatibility
    'responsable_enseigne'::text,
    'architecte'::text,
    'franchisee'::text
  ]));

-- 2. owner_type: form sends 'franchise' or 'succursale' (already compatible)
--    but also could send NULL or 'propre' - keep as-is, already fine

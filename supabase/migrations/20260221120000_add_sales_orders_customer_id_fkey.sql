-- Migration: Fix sales_orders_customer_id_fkey
-- Context: PostgREST fails with 400 when resolving
--   organisations!sales_orders_customer_id_fkey (id, trade_name, legal_name, siret)
-- Cause: FK was missing + 7 orphan customer_id values (legacy data, customer_type='individual')
--
-- Step 1: Nullify the 7 orphan customer_id values
--   These point to UUIDs that don't exist in organisations or contacts.
--   All 7 orders have status='shipped' (not active), safe to nullify.
UPDATE sales_orders
SET customer_id = NULL
WHERE customer_type = 'individual'
  AND customer_id IS NOT NULL
  AND customer_id NOT IN (SELECT id FROM organisations)
  AND customer_id NOT IN (SELECT id FROM contacts);

-- Step 2: Add the missing FK constraint
--   ON DELETE SET NULL preserves orders if an organisation is deleted.
ALTER TABLE sales_orders
ADD CONSTRAINT sales_orders_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES organisations(id)
ON DELETE SET NULL;

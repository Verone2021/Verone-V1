-- Migration: Add FK sales_orders.customer_id -> organisations.id
-- Reason: Back-office uses PostgREST implicit joins (organisations!sales_orders_customer_id_fkey)
-- which require a FK constraint to exist. Without it, PGRST200 errors on order detail pages.

-- Step 1: Make customer_id nullable (individual orders may not have an organisation)
ALTER TABLE sales_orders
ALTER COLUMN customer_id DROP NOT NULL;

-- Step 2: Clean up 7 orphan customer_id values (individual/shipped orders with invalid UUIDs)
-- These UUIDs don't exist in any table - they are legacy data artifacts.
UPDATE sales_orders
SET customer_id = NULL
WHERE customer_type = 'individual'
  AND customer_id IS NOT NULL
  AND customer_id NOT IN (SELECT id FROM organisations);

-- Step 3: Add the FK constraint
ALTER TABLE sales_orders
ADD CONSTRAINT sales_orders_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES organisations(id);

-- Step 4: Reload PostgREST schema cache so it discovers the new FK
NOTIFY pgrst, 'reload schema';

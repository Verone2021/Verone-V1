-- LM-ORD-007: Fix anonymous order creation by removing blocking RLS policies
-- Date: 2026-01-15
-- Root cause: "Staff can create" policies block SECURITY DEFINER RPC calls from anonymous users
-- Solution: Drop conflicting policies, keep "Public can create" policies (WITH CHECK true)

-- Remove blocking policies that prevent anonymous INSERT via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Staff can create sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "Staff can create sales_order_items" ON sales_order_items;

-- Document remaining policies for future reference
COMMENT ON TABLE sales_orders IS 'Public INSERT allowed for SECURITY DEFINER RPC create_public_linkme_order(). RPC validates all inputs server-side. Direct INSERT blocked by GRANT restrictions.';

COMMENT ON TABLE sales_order_items IS 'Public INSERT allowed for SECURITY DEFINER RPC create_public_linkme_order(). Linked to sales_orders via FK. RPC ensures data integrity.';

-- Verification query (run manually after migration):
-- SELECT policyname, cmd, with_check
-- FROM pg_policies
-- WHERE tablename IN ('sales_orders', 'sales_order_items') AND cmd = 'INSERT';
-- Expected: "Public can create sales_orders/items" with WITH CHECK = true

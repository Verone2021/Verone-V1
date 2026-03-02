-- ============================================================================
-- Migration: Fix RLS - Remove dangerous "Authenticated users can view their orders" policy
-- Date: 2026-03-02
--
-- PROBLEM: The policy "Authenticated users can view their orders" on sales_orders
--          allows ANY authenticated user to view ALL orders, regardless of affiliation.
--          USING: (SELECT auth.uid()) IS NOT NULL
--          This bypasses all other filtering policies (RLS is PERMISSIVE = OR logic).
--
-- RISK: A LinkMe affiliate from Pokawa can see orders from other enseignes.
--
-- FIX: Drop the dangerous policy. The 3 legitimate policies remain:
--   - staff_full_access_sales_orders (is_backoffice_user())
--   - affiliates_view_own_orders (enseigne_id / organisation_id filter)
--   - staff_delete_sales_orders (is_backoffice_user())
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view their orders" ON sales_orders;

-- Verification: ensure the 3 legitimate SELECT policies still exist
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales_orders'
      AND policyname = 'staff_full_access_sales_orders'
  ), 'Policy staff_full_access_sales_orders is missing!';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales_orders'
      AND policyname = 'affiliates_view_own_orders'
  ), 'Policy affiliates_view_own_orders is missing!';

  RAISE NOTICE 'RLS fix applied: dangerous open policy removed. Legitimate policies verified.';
END $$;

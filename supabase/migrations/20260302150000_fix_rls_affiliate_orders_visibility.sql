-- ============================================================================
-- Migration: Fix RLS affiliate orders visibility + data leak cleanup
-- Date: 2026-03-02
--
-- PROBLEMS:
-- 1. Affiliates see only 1/125 orders because policies filter ONLY on
--    created_by_affiliate_id, but 124 orders have it NULL (created by staff).
--    These orders ARE linked via linkme_selection_id → linkme_selections.affiliate_id.
--
-- 2. DATA LEAK on sales_order_linkme_details: policy "Authenticated can read
--    sales_order_linkme_details" uses USING(true) — exposes ALL linkme details
--    to every authenticated user.
--
-- 3. Duplicate SELECT policies on all 3 tables (legacy + canonical coexist).
--
-- FIX:
-- Step 1: Backfill created_by_affiliate_id from linkme_selections
-- Step 2: Consolidate sales_orders SELECT policies (add linkme_selection_id path)
-- Step 3: Fix data leak + consolidate sales_order_items SELECT policies
-- Step 4: Fix data leak + consolidate sales_order_linkme_details SELECT policies
-- Step 5: Cleanup obsolete DELETE policy
-- Step 6: Verification
-- ============================================================================

-- ============================================================================
-- STEP 1: Backfill created_by_affiliate_id for historical orders
-- ============================================================================

-- Orders created by staff have linkme_selection_id but NULL created_by_affiliate_id.
-- Fill from the linkme_selections.affiliate_id relationship.
UPDATE sales_orders
SET created_by_affiliate_id = ls.affiliate_id
FROM linkme_selections ls
WHERE ls.id = sales_orders.linkme_selection_id
  AND sales_orders.created_by_affiliate_id IS NULL
  AND sales_orders.linkme_selection_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Consolidate SELECT policies on sales_orders
-- ============================================================================

-- Drop ALL existing SELECT policies (legacy duplicates + canonical)
DROP POLICY IF EXISTS "Staff can view all sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "LinkMe affiliates can view their orders" ON sales_orders;
DROP POLICY IF EXISTS "staff_full_access_sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "affiliates_view_own_orders" ON sales_orders;

-- 1. Staff sees everything
CREATE POLICY "staff_select_sales_orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- 2. Affiliates see their orders via TWO paths:
--    Path A: created_by_affiliate_id (direct, covers backfilled + RPC-created)
--    Path B: linkme_selection_id (fallback for any future edge cases)
CREATE POLICY "affiliates_select_own_orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (
    created_by_affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
    OR
    linkme_selection_id IN (
      SELECT ls.id FROM linkme_selections ls
      JOIN linkme_affiliates la ON la.id = ls.affiliate_id
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- ============================================================================
-- STEP 3: Fix data leak + consolidate SELECT policies on sales_order_items
-- ============================================================================

-- Drop ALL existing SELECT policies (legacy duplicates + canonical)
DROP POLICY IF EXISTS "Authenticated users can view order items" ON sales_order_items;
DROP POLICY IF EXISTS "Staff can view all sales_order_items" ON sales_order_items;
DROP POLICY IF EXISTS "LinkMe affiliates can view their order items" ON sales_order_items;
DROP POLICY IF EXISTS "staff_full_access_sales_order_items" ON sales_order_items;
DROP POLICY IF EXISTS "affiliates_view_own_order_items" ON sales_order_items;

-- 1. Staff sees everything
CREATE POLICY "staff_select_sales_order_items" ON sales_order_items
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- 2. Affiliates see items from THEIR orders (delegates to parent sales_orders check)
CREATE POLICY "affiliates_select_own_order_items" ON sales_order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_items.sales_order_id
      AND (
        so.created_by_affiliate_id IN (
          SELECT la.id FROM linkme_affiliates la
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = (SELECT auth.uid())
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
        OR so.linkme_selection_id IN (
          SELECT ls.id FROM linkme_selections ls
          JOIN linkme_affiliates la ON la.id = ls.affiliate_id
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = (SELECT auth.uid())
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
      )
    )
  );

-- ============================================================================
-- STEP 4: Fix data leak + consolidate SELECT on sales_order_linkme_details
-- ============================================================================

-- Drop ALL existing SELECT policies INCLUDING the dangerous USING(true) one
DROP POLICY IF EXISTS "Authenticated can read sales_order_linkme_details" ON sales_order_linkme_details;
DROP POLICY IF EXISTS "Staff can view sales_order_linkme_details" ON sales_order_linkme_details;
DROP POLICY IF EXISTS "LinkMe affiliates can view their linkme details" ON sales_order_linkme_details;
DROP POLICY IF EXISTS "staff_full_access_sales_order_linkme_details" ON sales_order_linkme_details;
DROP POLICY IF EXISTS "affiliates_view_own_order_linkme_details" ON sales_order_linkme_details;

-- 1. Staff sees everything
CREATE POLICY "staff_select_sales_order_linkme_details" ON sales_order_linkme_details
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- 2. Affiliates see linkme details from THEIR orders
CREATE POLICY "affiliates_select_own_order_linkme_details" ON sales_order_linkme_details
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_linkme_details.sales_order_id
      AND (
        so.created_by_affiliate_id IN (
          SELECT la.id FROM linkme_affiliates la
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = (SELECT auth.uid())
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
        OR so.linkme_selection_id IN (
          SELECT ls.id FROM linkme_selections ls
          JOIN linkme_affiliates la ON la.id = ls.affiliate_id
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = (SELECT auth.uid())
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
      )
    )
  );

-- ============================================================================
-- STEP 5: Cleanup obsolete DELETE policy (uses get_user_role() — fragile)
-- ============================================================================

DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer leurs commandes clients" ON sales_orders;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
DECLARE
  backfilled_count INTEGER;
  so_policies INTEGER;
  soi_policies INTEGER;
  sold_policies INTEGER;
BEGIN
  -- Count backfilled orders
  GET DIAGNOSTICS backfilled_count = ROW_COUNT;
  RAISE NOTICE 'Backfill already applied in Step 1';

  -- Verify sales_orders SELECT policies (should be exactly 2)
  SELECT COUNT(*) INTO so_policies
  FROM pg_policies
  WHERE tablename = 'sales_orders' AND cmd = 'SELECT';
  ASSERT so_policies = 2,
    format('Expected 2 SELECT policies on sales_orders, found %s', so_policies);

  -- Verify sales_order_items SELECT policies (should be exactly 2)
  SELECT COUNT(*) INTO soi_policies
  FROM pg_policies
  WHERE tablename = 'sales_order_items' AND cmd = 'SELECT';
  ASSERT soi_policies = 2,
    format('Expected 2 SELECT policies on sales_order_items, found %s', soi_policies);

  -- Verify sales_order_linkme_details SELECT policies (should be exactly 2)
  SELECT COUNT(*) INTO sold_policies
  FROM pg_policies
  WHERE tablename = 'sales_order_linkme_details' AND cmd = 'SELECT';
  ASSERT sold_policies = 2,
    format('Expected 2 SELECT policies on sales_order_linkme_details, found %s', sold_policies);

  -- Verify NO dangerous open policies remain
  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename IN ('sales_orders', 'sales_order_items', 'sales_order_linkme_details')
      AND cmd = 'SELECT'
      AND qual = 'true'
  ), 'DANGER: Found a USING(true) SELECT policy!';

  RAISE NOTICE '✓ Migration verified: 2 SELECT policies per table, no open policies';
END $$;

-- Final policy inventory (for manual review)
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('sales_orders', 'sales_order_items', 'sales_order_linkme_details')
-- ORDER BY tablename, cmd, policyname;

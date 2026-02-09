-- Fix Sales Orders RLS with Canonical Pattern
--
-- Problem: Migration 20260125_002 uses obsolete user_profiles.role pattern
-- Solution: Replace with canonical is_backoffice_user() + user_app_roles pattern
--
-- Reference: .claude/rules/database/rls-patterns.md
-- Tables: sales_orders, sales_order_items, sales_order_linkme_details

-- ============================================================================
-- DROP OBSOLETE POLICIES
-- ============================================================================

-- Sales Orders (2 policies)
DROP POLICY IF EXISTS "allow_read_sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "allow_linkme_affiliates_read_own_sales_orders" ON sales_orders;

-- Sales Order Items (2 policies)
DROP POLICY IF EXISTS "allow_read_sales_order_items" ON sales_order_items;
DROP POLICY IF EXISTS "allow_linkme_affiliates_read_own_sales_order_items" ON sales_order_items;

-- Sales Order LinkMe Details (2 policies)
DROP POLICY IF EXISTS "allow_read_sales_order_linkme_details" ON sales_order_linkme_details;
DROP POLICY IF EXISTS "allow_linkme_affiliates_read_own_sales_order_linkme_details" ON sales_order_linkme_details;

-- ============================================================================
-- CREATE CANONICAL POLICIES - SALES ORDERS
-- ============================================================================

-- Back-Office Staff: Full access to all sales orders
CREATE POLICY "staff_full_access_sales_orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- LinkMe Affiliates: View only their own orders (via created_by_affiliate_id)
CREATE POLICY "affiliates_view_own_orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    created_by_affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- ============================================================================
-- CREATE CANONICAL POLICIES - SALES ORDER ITEMS
-- ============================================================================

-- Back-Office Staff: Full access to all order items
CREATE POLICY "staff_full_access_sales_order_items" ON sales_order_items
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- LinkMe Affiliates: View only items from their own orders
CREATE POLICY "affiliates_view_own_order_items" ON sales_order_items
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_items.sales_order_id
        AND so.created_by_affiliate_id IN (
          SELECT la.id FROM linkme_affiliates la
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = auth.uid()
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
    )
  );

-- ============================================================================
-- CREATE CANONICAL POLICIES - SALES ORDER LINKME DETAILS
-- ============================================================================

-- Back-Office Staff: Full access to all LinkMe details
CREATE POLICY "staff_full_access_sales_order_linkme_details" ON sales_order_linkme_details
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- LinkMe Affiliates: View only details from their own orders
CREATE POLICY "affiliates_view_own_order_linkme_details" ON sales_order_linkme_details
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_linkme_details.sales_order_id
        AND so.created_by_affiliate_id IN (
          SELECT la.id FROM linkme_affiliates la
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = auth.uid()
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check policies applied
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('sales_orders', 'sales_order_items', 'sales_order_linkme_details')
-- ORDER BY tablename, policyname;

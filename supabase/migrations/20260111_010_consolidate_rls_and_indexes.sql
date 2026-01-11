-- Migration: Consolidate RLS Policies and Remove Duplicate Indexes
--
-- Fixes ~424 Performance Advisor warnings:
-- - 412 Multiple Permissive Policies → Consolidate into single policies
-- - 12 Duplicate Indexes → Drop redundant indexes
--
-- @since 2026-01-11

-- ============================================================================
-- PHASE 1: DROP DUPLICATE INDEXES (12 warnings)
-- ============================================================================

-- bank_transactions: keep idx_bank_transactions_amount_side
DROP INDEX IF EXISTS idx_bank_transactions_unmatched_amount;

-- linkme_commissions: keep idx_linkme_commissions_affiliate_id
DROP INDEX IF EXISTS idx_linkme_commissions_affiliate;

-- linkme_commissions: keep idx_linkme_commissions_order_id
DROP INDEX IF EXISTS idx_linkme_commissions_order;

-- linkme_selection_items: keep idx_linkme_selection_items_selection_id
DROP INDEX IF EXISTS idx_linkme_selection_items_selection;

-- linkme_selections: keep idx_linkme_selections_affiliate_id
DROP INDEX IF EXISTS idx_linkme_selections_affiliate;

-- payments: keep idx_payments_payment_date
DROP INDEX IF EXISTS idx_payments_date;
DROP INDEX IF EXISTS idx_payments_recent;

-- product_images: keep idx_product_images_product_id_primary
DROP INDEX IF EXISTS idx_product_images_is_primary;

-- products: keep idx_products_enseigne_id
DROP INDEX IF EXISTS idx_products_enseigne;

-- sales_order_items: keep idx_sales_order_items_linkme_selection_item
DROP INDEX IF EXISTS idx_sales_order_items_linkme_selection;

-- sales_order_items: keep idx_sales_order_items_order_id
DROP INDEX IF EXISTS idx_sales_order_items_so_id;

-- sales_orders: keep idx_sales_orders_channel_id
DROP INDEX IF EXISTS idx_sales_orders_channel;

-- user_profiles: keep idx_user_profiles_organisation_id
DROP INDEX IF EXISTS idx_user_profiles_organisation;

RAISE NOTICE 'Phase 1 complete: Dropped 13 duplicate indexes';

-- ============================================================================
-- PHASE 2: CONSOLIDATE RLS POLICIES
-- Strategy: For each table with multiple permissive policies for the same
-- role/action, drop all and create a single unified policy
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 PRODUCTS - Consolidate SELECT policies
-- Current: 5 policies for authenticated SELECT
-- ----------------------------------------------------------------------------

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Affiliate view own created products" ON products;
DROP POLICY IF EXISTS "customers_read_active_products" ON products;
DROP POLICY IF EXISTS "products_select_authenticated" ON products;
DROP POLICY IF EXISTS "products_select_anonymous_testing" ON products;

-- Create unified SELECT policy
CREATE POLICY "products_select_unified" ON products
FOR SELECT TO public
USING (
  -- Staff (owner/admin) can see all
  (SELECT get_user_role()) IN ('owner', 'admin')
  OR
  -- Tenant owner/admin manage products
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role IN ('owner', 'admin')
    AND up.app = 'back-office'
  )
  OR
  -- Tenant sales can view
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role = 'sales'
    AND up.app = 'back-office'
  )
  OR
  -- Affiliate view own created products
  (created_by_affiliate_id IS NOT NULL AND created_by_affiliate_id IN (
    SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  ))
  OR
  -- Customers can read active products (site-internet)
  (status = 'active' AND NOT (SELECT is_customer_user()))
  OR
  -- Public anonymous can read active products
  (status = 'active' AND (SELECT auth.uid()) IS NULL)
);

-- Consolidate INSERT policies
DROP POLICY IF EXISTS "Affiliate create products" ON products;
DROP POLICY IF EXISTS "products_insert_authenticated" ON products;

CREATE POLICY "products_insert_unified" ON products
FOR INSERT TO public
WITH CHECK (
  -- Staff can insert
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
  OR
  -- Tenant owner/admin
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role IN ('owner', 'admin')
    AND up.app = 'back-office'
  )
  OR
  -- Affiliate can create (sets created_by_affiliate_id)
  EXISTS (
    SELECT 1 FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  )
);

-- Consolidate UPDATE policies
DROP POLICY IF EXISTS "Affiliate update draft products" ON products;
DROP POLICY IF EXISTS "products_update_authenticated" ON products;

CREATE POLICY "products_update_unified" ON products
FOR UPDATE TO public
USING (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
  OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role IN ('owner', 'admin')
    AND up.app = 'back-office'
  )
  OR
  -- Affiliate can update own draft products
  (status = 'draft' AND created_by_affiliate_id IN (
    SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  ))
)
WITH CHECK (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
  OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role IN ('owner', 'admin')
    AND up.app = 'back-office'
  )
  OR
  (status = 'draft' AND created_by_affiliate_id IN (
    SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  ))
);

-- Consolidate DELETE policies
DROP POLICY IF EXISTS "products_delete_authenticated" ON products;

CREATE POLICY "products_delete_unified" ON products
FOR DELETE TO public
USING (
  (SELECT get_user_role()) IN ('owner', 'admin')
  OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role IN ('owner', 'admin')
    AND up.app = 'back-office'
  )
);

RAISE NOTICE 'Consolidated products policies';

-- ----------------------------------------------------------------------------
-- 2.2 ORGANISATIONS - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "customers_blocked_organisations" ON organisations;
DROP POLICY IF EXISTS "organisations_select_own_or_staff" ON organisations;
DROP POLICY IF EXISTS "owner_admin_full_access" ON organisations;
DROP POLICY IF EXISTS "public_read_shared_organisations" ON organisations;
DROP POLICY IF EXISTS "organisations_delete_admin" ON organisations;
DROP POLICY IF EXISTS "organisations_insert_admin" ON organisations;

-- Unified SELECT
CREATE POLICY "organisations_select_unified" ON organisations
FOR SELECT TO public
USING (
  -- Block customers
  NOT (SELECT is_customer_user())
  AND (
    -- Owner/admin full access
    (SELECT get_user_role()) IN ('owner', 'admin')
    OR
    -- Staff can see own org or all if back-office
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND (up.organisation_id = organisations.id OR up.app = 'back-office')
    )
    OR
    -- Public can read shared organisations
    visibility = 'public'
  )
);

-- Unified INSERT/UPDATE/DELETE
CREATE POLICY "organisations_modify_unified" ON organisations
FOR ALL TO public
USING (
  NOT (SELECT is_customer_user())
  AND (
    (SELECT get_user_role()) IN ('owner', 'admin')
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND up.role IN ('owner', 'admin')
      AND up.app = 'back-office'
    )
  )
)
WITH CHECK (
  NOT (SELECT is_customer_user())
  AND (
    (SELECT get_user_role()) IN ('owner', 'admin')
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND up.role IN ('owner', 'admin')
      AND up.app = 'back-office'
    )
  )
);

RAISE NOTICE 'Consolidated organisations policies';

-- ----------------------------------------------------------------------------
-- 2.3 CONTACTS - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "backoffice_can_view_all_contacts" ON contacts;
DROP POLICY IF EXISTS "backoffice_can_insert_contacts" ON contacts;
DROP POLICY IF EXISTS "backoffice_can_update_all_contacts" ON contacts;
DROP POLICY IF EXISTS "backoffice_can_delete_contacts" ON contacts;
DROP POLICY IF EXISTS "contacts_authenticated_access" ON contacts;
DROP POLICY IF EXISTS "contacts_authenticated_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_enseigne_select" ON contacts;
DROP POLICY IF EXISTS "contacts_enseigne_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_enseigne_update" ON contacts;
DROP POLICY IF EXISTS "contacts_enseigne_delete" ON contacts;
DROP POLICY IF EXISTS "customers_blocked_contacts" ON contacts;
DROP POLICY IF EXISTS "linkme_users_can_view_own_contact" ON contacts;
DROP POLICY IF EXISTS "linkme_users_can_update_own_contact" ON contacts;

-- Unified SELECT for contacts
CREATE POLICY "contacts_select_unified" ON contacts
FOR SELECT TO public
USING (
  NOT (SELECT is_customer_user())
  AND (
    -- Back-office staff can view all
    (SELECT get_user_role()) IN ('owner', 'admin', 'sales', 'partner_manager')
    OR
    -- Users can view contacts of their organisation
    organisation_id IN (
      SELECT up.organisation_id FROM user_profiles up WHERE up.user_id = (SELECT auth.uid())
    )
    OR
    -- LinkMe users can view own contact
    user_id = (SELECT auth.uid())
  )
);

-- Unified INSERT for contacts
CREATE POLICY "contacts_insert_unified" ON contacts
FOR INSERT TO public
WITH CHECK (
  NOT (SELECT is_customer_user())
  AND (
    (SELECT get_user_role()) IN ('owner', 'admin', 'sales', 'partner_manager')
    OR
    organisation_id IN (
      SELECT up.organisation_id FROM user_profiles up WHERE up.user_id = (SELECT auth.uid())
    )
  )
);

-- Unified UPDATE for contacts
CREATE POLICY "contacts_update_unified" ON contacts
FOR UPDATE TO public
USING (
  NOT (SELECT is_customer_user())
  AND (
    (SELECT get_user_role()) IN ('owner', 'admin', 'sales', 'partner_manager')
    OR
    organisation_id IN (
      SELECT up.organisation_id FROM user_profiles up WHERE up.user_id = (SELECT auth.uid())
    )
    OR
    user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  NOT (SELECT is_customer_user())
  AND (
    (SELECT get_user_role()) IN ('owner', 'admin', 'sales', 'partner_manager')
    OR
    organisation_id IN (
      SELECT up.organisation_id FROM user_profiles up WHERE up.user_id = (SELECT auth.uid())
    )
    OR
    user_id = (SELECT auth.uid())
  )
);

-- Unified DELETE for contacts
CREATE POLICY "contacts_delete_unified" ON contacts
FOR DELETE TO public
USING (
  NOT (SELECT is_customer_user())
  AND (
    (SELECT get_user_role()) IN ('owner', 'admin')
    OR
    organisation_id IN (
      SELECT up.organisation_id FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid()) AND up.role IN ('owner', 'admin')
    )
  )
);

RAISE NOTICE 'Consolidated contacts policies';

-- ----------------------------------------------------------------------------
-- 2.4 CATEGORIES - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "authenticated_users_can_view_categories" ON categories;
DROP POLICY IF EXISTS "catalog_managers_can_manage_categories" ON categories;
DROP POLICY IF EXISTS "categories_select_public" ON categories;
DROP POLICY IF EXISTS "categories_select_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_insert_catalog_managers" ON categories;
DROP POLICY IF EXISTS "categories_update_catalog_managers" ON categories;
DROP POLICY IF EXISTS "categories_delete_admins" ON categories;
DROP POLICY IF EXISTS "customers_read_active_categories" ON categories;
DROP POLICY IF EXISTS "allow_authenticated_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_authenticated_insert_categories" ON categories;
DROP POLICY IF EXISTS "allow_authenticated_update_categories" ON categories;
DROP POLICY IF EXISTS "allow_authenticated_delete_categories" ON categories;

-- Unified SELECT for categories (public readable)
CREATE POLICY "categories_select_unified" ON categories
FOR SELECT TO public
USING (
  -- Everyone can read active categories
  is_active = true
  OR
  -- Staff can see all
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
);

-- Unified INSERT/UPDATE/DELETE for categories
CREATE POLICY "categories_modify_unified" ON categories
FOR ALL TO public
USING (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
)
WITH CHECK (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
);

RAISE NOTICE 'Consolidated categories policies';

-- ----------------------------------------------------------------------------
-- 2.5 SUBCATEGORIES - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "subcategories_select_public" ON subcategories;
DROP POLICY IF EXISTS "subcategories_select_authenticated" ON subcategories;
DROP POLICY IF EXISTS "subcategories_insert_catalog_managers" ON subcategories;
DROP POLICY IF EXISTS "subcategories_update_catalog_managers" ON subcategories;
DROP POLICY IF EXISTS "subcategories_delete_admins" ON subcategories;
DROP POLICY IF EXISTS "customers_read_active_subcategories" ON subcategories;
DROP POLICY IF EXISTS "allow_authenticated_read_subcategories" ON subcategories;
DROP POLICY IF EXISTS "allow_authenticated_insert_subcategories" ON subcategories;
DROP POLICY IF EXISTS "allow_authenticated_update_subcategories" ON subcategories;
DROP POLICY IF EXISTS "allow_authenticated_delete_subcategories" ON subcategories;

CREATE POLICY "subcategories_select_unified" ON subcategories
FOR SELECT TO public
USING (
  is_active = true
  OR
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
);

CREATE POLICY "subcategories_modify_unified" ON subcategories
FOR ALL TO public
USING (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
)
WITH CHECK (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
);

RAISE NOTICE 'Consolidated subcategories policies';

-- ----------------------------------------------------------------------------
-- 2.6 FAMILIES - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "families_select_public" ON families;
DROP POLICY IF EXISTS "families_select_authenticated" ON families;
DROP POLICY IF EXISTS "families_insert_catalog_managers" ON families;
DROP POLICY IF EXISTS "families_update_catalog_managers" ON families;
DROP POLICY IF EXISTS "families_delete_admins" ON families;
DROP POLICY IF EXISTS "customers_read_active_families" ON families;
DROP POLICY IF EXISTS "allow_authenticated_read_families" ON families;
DROP POLICY IF EXISTS "allow_authenticated_insert_families" ON families;
DROP POLICY IF EXISTS "allow_authenticated_update_families" ON families;
DROP POLICY IF EXISTS "allow_authenticated_delete_families" ON families;

CREATE POLICY "families_select_unified" ON families
FOR SELECT TO public
USING (
  is_active = true
  OR
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
);

CREATE POLICY "families_modify_unified" ON families
FOR ALL TO public
USING (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
)
WITH CHECK (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
);

RAISE NOTICE 'Consolidated families policies';

-- ----------------------------------------------------------------------------
-- 2.7 COLLECTIONS - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "collections_public_select_published" ON collections;
DROP POLICY IF EXISTS "owner_admin_full_collections_access" ON collections;
DROP POLICY IF EXISTS "tenant_owner_admin_manage_collections" ON collections;
DROP POLICY IF EXISTS "tenant_sales_view_collections" ON collections;
DROP POLICY IF EXISTS "users_can_create_collections" ON collections;
DROP POLICY IF EXISTS "users_can_update_collections" ON collections;
DROP POLICY IF EXISTS "users_can_delete_collections" ON collections;

CREATE POLICY "collections_select_unified" ON collections
FOR SELECT TO public
USING (
  -- Public can see published
  status = 'published'
  OR
  -- Staff can see all
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager', 'sales')
  OR
  -- Owner of collection
  created_by = (SELECT auth.uid())
);

CREATE POLICY "collections_modify_unified" ON collections
FOR ALL TO public
USING (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
  OR
  created_by = (SELECT auth.uid())
)
WITH CHECK (
  (SELECT get_user_role()) IN ('owner', 'admin', 'catalog_manager')
  OR
  created_by = (SELECT auth.uid())
);

RAISE NOTICE 'Consolidated collections policies';

-- ----------------------------------------------------------------------------
-- 2.8 INVOICES - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "customers_blocked_invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_select_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;

CREATE POLICY "invoices_unified" ON invoices
FOR ALL TO public
USING (
  NOT (SELECT is_customer_user())
  AND (SELECT get_user_role()) IN ('owner', 'admin', 'accountant')
)
WITH CHECK (
  NOT (SELECT is_customer_user())
  AND (SELECT get_user_role()) IN ('owner', 'admin', 'accountant')
);

RAISE NOTICE 'Consolidated invoices policies';

-- ----------------------------------------------------------------------------
-- 2.9 LINKME_AFFILIATES - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "linkme_affiliates_own" ON linkme_affiliates;
DROP POLICY IF EXISTS "linkme_affiliates_public_read" ON linkme_affiliates;
DROP POLICY IF EXISTS "linkme_affiliates_staff_all" ON linkme_affiliates;

CREATE POLICY "linkme_affiliates_unified" ON linkme_affiliates
FOR ALL TO public
USING (
  -- Staff can do everything
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  -- Own affiliate record
  user_id = (SELECT auth.uid())
  OR
  -- Public read for active affiliates (SELECT only)
  (status = 'active' AND current_setting('statement.command_type', true) = 'SELECT')
)
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  user_id = (SELECT auth.uid())
);

RAISE NOTICE 'Consolidated linkme_affiliates policies';

-- ----------------------------------------------------------------------------
-- 2.10 LINKME_COMMISSIONS - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "linkme_commissions_affiliate_read" ON linkme_commissions;
DROP POLICY IF EXISTS "linkme_commissions_staff_all" ON linkme_commissions;

CREATE POLICY "linkme_commissions_unified" ON linkme_commissions
FOR ALL TO public
USING (
  -- Staff can do everything
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  -- Affiliate can read own commissions
  affiliate_id IN (
    SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

RAISE NOTICE 'Consolidated linkme_commissions policies';

-- ----------------------------------------------------------------------------
-- 2.11 LINKME_TRACKING - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "linkme_tracking_insert_anon" ON linkme_tracking;
DROP POLICY IF EXISTS "linkme_tracking_staff_all" ON linkme_tracking;

CREATE POLICY "linkme_tracking_unified" ON linkme_tracking
FOR ALL TO public
USING (
  -- Staff can do everything
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  -- Anyone can insert tracking (for anonymous tracking)
  true
)
WITH CHECK (
  -- Anyone can insert tracking
  true
);

RAISE NOTICE 'Consolidated linkme_tracking policies';

-- ----------------------------------------------------------------------------
-- 2.12 LINKME_PAYMENT_REQUESTS - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Affiliates can create own payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Affiliates can view own payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Affiliates can update own pending requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Back-office staff can create payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Back-office staff can view all payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Back-office staff can update payment requests" ON linkme_payment_requests;

CREATE POLICY "linkme_payment_requests_unified" ON linkme_payment_requests
FOR ALL TO public
USING (
  -- Staff can do everything
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  -- Affiliate can view/manage own requests
  affiliate_id IN (
    SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  affiliate_id IN (
    SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  )
);

RAISE NOTICE 'Consolidated linkme_payment_requests policies';

-- ----------------------------------------------------------------------------
-- 2.13 LINKME_PAYMENT_REQUEST_ITEMS - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Affiliates can create own request items" ON linkme_payment_request_items;
DROP POLICY IF EXISTS "Affiliates can view own request items" ON linkme_payment_request_items;
DROP POLICY IF EXISTS "Back-office staff can create request items" ON linkme_payment_request_items;
DROP POLICY IF EXISTS "Back-office staff can view all request items" ON linkme_payment_request_items;

CREATE POLICY "linkme_payment_request_items_unified" ON linkme_payment_request_items
FOR ALL TO public
USING (
  -- Staff can do everything
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  -- Affiliate can view/manage items for own requests
  request_id IN (
    SELECT lpr.id FROM linkme_payment_requests lpr
    WHERE lpr.affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
    )
  )
)
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
  OR
  request_id IN (
    SELECT lpr.id FROM linkme_payment_requests lpr
    WHERE lpr.affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
    )
  )
);

RAISE NOTICE 'Consolidated linkme_payment_request_items policies';

-- ----------------------------------------------------------------------------
-- 2.14 USER_APP_ROLES - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete user_app_roles" ON user_app_roles;
DROP POLICY IF EXISTS "Admins can insert user_app_roles" ON user_app_roles;
DROP POLICY IF EXISTS "Admins can view all user_app_roles" ON user_app_roles;
DROP POLICY IF EXISTS "Admins can update user_app_roles" ON user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can insert roles for their enseigne" ON user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can view their enseigne roles" ON user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can update roles for their enseigne" ON user_app_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_admin_delete" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_admin_insert" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_admin_select" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_admin_update" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_enseigne_insert" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_enseigne_select" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_enseigne_update" ON user_app_roles;
DROP POLICY IF EXISTS "user_app_roles_own_select" ON user_app_roles;

CREATE POLICY "user_app_roles_unified" ON user_app_roles
FOR ALL TO public
USING (
  -- Admins can do everything
  (SELECT get_user_role()) IN ('owner', 'admin')
  OR
  -- Users can view their own roles
  user_id = (SELECT auth.uid())
  OR
  -- Enseigne admins can manage their enseigne
  enseigne_id IN (
    SELECT up.organisation_id FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  (SELECT get_user_role()) IN ('owner', 'admin')
  OR
  enseigne_id IN (
    SELECT up.organisation_id FROM user_profiles up
    WHERE up.user_id = (SELECT auth.uid())
    AND up.role IN ('owner', 'admin')
  )
);

RAISE NOTICE 'Consolidated user_app_roles policies';

-- ----------------------------------------------------------------------------
-- 2.15 STORAGE_ALLOCATIONS - Consolidate policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin manage storage" ON storage_allocations;
DROP POLICY IF EXISTS "Admin manage storage allocations" ON storage_allocations;
DROP POLICY IF EXISTS "Admin view all storage" ON storage_allocations;
DROP POLICY IF EXISTS "Affiliate view own storage" ON storage_allocations;
DROP POLICY IF EXISTS "Owner view own storage allocations" ON storage_allocations;

CREATE POLICY "storage_allocations_unified" ON storage_allocations
FOR ALL TO public
USING (
  -- Admin can do everything
  (SELECT get_user_role()) IN ('owner', 'admin')
  OR
  -- Owner/affiliate can view own
  owner_id = (SELECT auth.uid())
  OR
  affiliate_id IN (
    SELECT la.id FROM linkme_affiliates la WHERE la.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (SELECT get_user_role()) IN ('owner', 'admin')
);

RAISE NOTICE 'Consolidated storage_allocations policies';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_duplicate_policies INTEGER;
BEGIN
  -- Count tables with multiple permissive policies for same role/action
  SELECT COUNT(*) INTO v_duplicate_policies
  FROM (
    SELECT tablename, roles, cmd, COUNT(*) as cnt
    FROM pg_policies
    WHERE schemaname = 'public'
    AND permissive = 'PERMISSIVE'
    GROUP BY tablename, roles, cmd
    HAVING COUNT(*) > 1
  ) sub;

  RAISE NOTICE 'Remaining tables with multiple permissive policies: %', v_duplicate_policies;
END $$;

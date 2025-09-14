-- Migration: RLS Policies for Security
-- Phase 3: Row Level Security policies and helper functions
-- Depends on: 001_create_base_types, 002_create_auth_tables

-- ========================================
-- HELPER FUNCTIONS FOR RLS
-- ========================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role_type AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get current user's organisation ID (MVP: always Vérone organisation)
-- TODO Phase 3: Implement multi-tenancy when user_organisation_assignments is added
CREATE OR REPLACE FUNCTION get_user_organisation_id()
RETURNS UUID AS $$
  SELECT id FROM organisations WHERE slug = 'verone' LIMIT 1
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user has specific scope
CREATE OR REPLACE FUNCTION has_scope(required_scope TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND required_scope = ANY(scopes)
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Validate RLS setup
CREATE OR REPLACE FUNCTION validate_rls_setup()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policies_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    t.rowsecurity,
    COUNT(p.policyname)
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================

-- Auth tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Catalogue tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

-- Feed tables (if exist)
-- ALTER TABLE feed_configs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feed_exports ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ORGANISATIONS POLICIES
-- ========================================

-- Select: All authenticated users can see active organisations (MVP: simplified)
-- TODO Phase 3: Restrict to user's assigned organisations only
CREATE POLICY "users_can_view_organisations" ON organisations
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_active = TRUE
  );

-- Insert: Only owners can create organisations
CREATE POLICY "owners_can_create_organisations" ON organisations
  FOR INSERT WITH CHECK (
    get_user_role() = 'owner'
  );

-- Update: Owners and admins can update organisations
CREATE POLICY "admins_can_update_organisation" ON organisations
  FOR UPDATE USING (
    get_user_role() IN ('owner', 'admin')
  );

-- ========================================
-- USER PROFILES POLICIES
-- ========================================

-- Select: Users can view their profile and other team members (MVP: simplified)
-- TODO Phase 3: Restrict to same organisation when multi-tenancy is implemented
CREATE POLICY "users_can_view_profiles" ON user_profiles
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Insert/Update: Users can manage their own profile
CREATE POLICY "users_can_manage_own_profile" ON user_profiles
  FOR ALL USING (user_id = auth.uid());

-- ========================================
-- CATEGORIES POLICIES
-- ========================================

-- Select: All authenticated users can view categories
CREATE POLICY "authenticated_users_can_view_categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert/Update/Delete: Only catalog managers and above
CREATE POLICY "catalog_managers_can_manage_categories" ON categories
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- ========================================
-- PRODUCT GROUPS POLICIES
-- ========================================

-- Select: All authenticated users can view active product groups
CREATE POLICY "users_can_view_product_groups" ON product_groups
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (status = 'active' OR get_user_role() IN ('owner', 'admin', 'catalog_manager'))
  );

-- Insert/Update/Delete: Catalog managers and above
CREATE POLICY "catalog_managers_can_manage_product_groups" ON product_groups
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- ========================================
-- PRODUCTS POLICIES
-- ========================================

-- Select: Users can view available products
CREATE POLICY "users_can_view_products" ON products
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      status IN ('in_stock', 'preorder', 'coming_soon')
      OR get_user_role() IN ('owner', 'admin', 'catalog_manager')
    )
  );

-- Insert/Update/Delete: Catalog managers and above
CREATE POLICY "catalog_managers_can_manage_products" ON products
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- ========================================
-- COLLECTIONS POLICIES
-- ========================================

-- Select: Users can view public collections or their own
CREATE POLICY "users_can_view_collections" ON collections
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      is_public = TRUE
      OR created_by = auth.uid()
      OR get_user_role() IN ('owner', 'admin', 'catalog_manager')
    )
  );

-- Insert: Authenticated users can create collections
CREATE POLICY "users_can_create_collections" ON collections
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
  );

-- Update: Users can update their own collections or managers can update all
CREATE POLICY "users_can_update_collections" ON collections
  FOR UPDATE USING (
    created_by = auth.uid()
    OR get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- Delete: Users can delete their own collections or managers can delete all
CREATE POLICY "users_can_delete_collections" ON collections
  FOR DELETE USING (
    created_by = auth.uid()
    OR get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- ========================================
-- POLICIES FOR TRANSLATION TABLES
-- ========================================

-- Category translations: Follow category policies
CREATE POLICY "category_translations_follow_categories" ON category_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM categories c
      WHERE c.id = category_translations.category_id
    )
  );

-- Product translations: Follow product policies
CREATE POLICY "product_translations_follow_products" ON product_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_translations.product_id
    )
  );

-- Collection translations: Follow collection policies
CREATE POLICY "collection_translations_follow_collections" ON collection_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_translations.collection_id
    )
  );

-- ========================================
-- PRODUCT PACKAGES POLICIES
-- ========================================

-- Follow product policies
CREATE POLICY "product_packages_follow_products" ON product_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_packages.product_id
    )
  );

-- ========================================
-- COLLECTION PRODUCTS POLICIES
-- ========================================

-- Follow collection policies
CREATE POLICY "collection_products_follow_collections" ON collection_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_products.collection_id
    )
  );

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION get_user_role() IS 'Returns current authenticated user role from user_profiles';
COMMENT ON FUNCTION get_user_organisation_id() IS 'Returns Vérone organisation ID (MVP), will be user-specific in Phase 3';
COMMENT ON FUNCTION has_scope(TEXT) IS 'Check if current user has specific permission scope';
COMMENT ON FUNCTION validate_rls_setup() IS 'Validate RLS is properly configured on all tables';
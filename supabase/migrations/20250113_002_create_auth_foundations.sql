-- Migration: Auth Foundations & Multi-Tenant
-- Complements 001 with critical auth infrastructure
-- Based on roles-permissions-v1.md specifications

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ORGANISATIONS (Multi-tenant foundation)
-- ========================================

CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,

  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT organisations_name_check CHECK (length(name) >= 2),
  CONSTRAINT organisations_slug_check CHECK (slug ~ '^[a-z0-9\-]+$')
);

-- ========================================
-- USER ORGANISATION ASSIGNMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS user_organisation_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- Role assignment
  role user_role_type NOT NULL,
  scopes TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  assigned_by UUID REFERENCES auth.users(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, organisation_id)
);

-- ========================================
-- HELPER FUNCTIONS (Critical for RLS)
-- ========================================

-- Function: Get user role (Security Definer for RLS)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT uoa.role::TEXT
     FROM user_organisation_assignments uoa
     WHERE uoa.user_id = auth.uid()
     AND uoa.is_active = TRUE
     LIMIT 1),
    'guest'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function: Get user organisation ID
CREATE OR REPLACE FUNCTION get_user_organisation_id()
RETURNS UUID AS $$
  SELECT uoa.organisation_id
  FROM user_organisation_assignments uoa
  WHERE uoa.user_id = auth.uid()
  AND uoa.is_active = TRUE
  LIMIT 1
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function: Check if user has scope
CREATE OR REPLACE FUNCTION has_scope(scope_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT scope_name = ANY(
    SELECT unnest(uoa.scopes)
    FROM user_organisation_assignments uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.is_active = TRUE
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Trigger function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS (Auto-update timestamps)
-- ========================================

-- Apply triggers to existing tables from migration 001
CREATE TRIGGER IF NOT EXISTS trigger_update_product_groups_updated_at
  BEFORE UPDATE ON product_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_update_product_packages_updated_at
  BEFORE UPDATE ON product_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply triggers to new tables
CREATE TRIGGER IF NOT EXISTS trigger_update_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_update_user_assignments_updated_at
  BEFORE UPDATE ON user_organisation_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Organisations indexes
CREATE INDEX IF NOT EXISTS idx_organisations_slug ON organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisations_active ON organisations(is_active) WHERE is_active = TRUE;

-- User assignments indexes
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON user_organisation_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_org ON user_organisation_assignments(organisation_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_role ON user_organisation_assignments(role);
CREATE INDEX IF NOT EXISTS idx_user_assignments_active ON user_organisation_assignments(is_active) WHERE is_active = TRUE;

-- Composite index for RLS performance
CREATE INDEX IF NOT EXISTS idx_user_assignments_auth ON user_organisation_assignments(user_id, is_active, role)
WHERE is_active = TRUE;

-- ========================================
-- COMMENTS (Documentation)
-- ========================================

COMMENT ON TABLE organisations IS 'Multi-tenant organisations table - foundation for RLS';
COMMENT ON TABLE user_organisation_assignments IS 'User role assignments per organisation - critical for RBAC V1';
COMMENT ON FUNCTION get_user_role() IS 'RLS helper: returns current user role (owner/admin/catalog_manager)';
COMMENT ON FUNCTION get_user_organisation_id() IS 'RLS helper: returns current user organisation ID';
COMMENT ON FUNCTION has_scope(TEXT) IS 'RLS helper: checks if user has specific permission scope';
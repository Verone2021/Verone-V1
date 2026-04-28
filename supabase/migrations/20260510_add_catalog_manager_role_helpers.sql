-- ============================================================================
-- BO-RBAC-CATALOG-MGR-001 — RLS helpers for catalog_manager role
-- ============================================================================
--
-- Adds three SECURITY DEFINER STABLE helper functions to detect specific
-- back-office roles. These complement the existing helpers:
--   - is_backoffice_user() : true for any active BO staff (any role)
--   - is_back_office_admin() : true for role='admin' only
--
-- New helpers:
--   - is_catalog_manager() : true for role='catalog_manager'
--   - is_back_office_owner() : true for role='owner' (was missing)
--   - is_back_office_admin_or_owner() : true for role IN ('owner','admin')
--
-- Used by application code (UI gating, API route guards) to enforce that
-- catalog_manager users (sourcing subcontractors) cannot edit selling prices,
-- margins, retrocession, publish to channels, or access finance/qonto pages.
--
-- This migration does NOT modify existing RLS policies on business tables.
-- Defense-in-depth on RLS for sensitive tables (finance, qonto, ambassadeurs)
-- is scoped to a future migration BO-RBAC-CATALOG-MGR-002.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- is_catalog_manager()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_catalog_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = (SELECT auth.uid())
      AND app = 'back-office'
      AND role = 'catalog_manager'
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_catalog_manager() IS
  'Returns true if current user has active back-office role catalog_manager. '
  'Used to gate UI restrictions on selling prices, margins, publication actions, '
  'finance/qonto/ambassadeurs pages.';

GRANT EXECUTE ON FUNCTION public.is_catalog_manager() TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- is_back_office_owner()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_back_office_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = (SELECT auth.uid())
      AND app = 'back-office'
      AND role = 'owner'
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_back_office_owner() IS
  'Returns true if current user has active back-office role owner. '
  'Used to gate user management actions (CRUD on user_app_roles), category '
  'creation/deletion, and other owner-exclusive operations.';

GRANT EXECUTE ON FUNCTION public.is_back_office_owner() TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- is_back_office_admin_or_owner()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_back_office_admin_or_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = (SELECT auth.uid())
      AND app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_back_office_admin_or_owner() IS
  'Returns true if current user has active back-office role owner OR admin. '
  'Used to gate finance, ambassador commissions, channel publication, '
  'pricing edits — operations that catalog_manager cannot perform.';

GRANT EXECUTE ON FUNCTION public.is_back_office_admin_or_owner() TO authenticated, anon;

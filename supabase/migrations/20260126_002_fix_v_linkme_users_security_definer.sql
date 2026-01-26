-- ============================================================================
-- Migration: Fix v_linkme_users - Restore SECURITY DEFINER
-- Date: 2026-01-26
-- Priority: CRITICAL - Fixes infinite auth loop on LinkMe
--
-- Problem: Migration 20260124_000 added security_invoker = true which breaks
--          access to auth.users for authenticated users (they don't have
--          direct permission to query auth.users).
--
-- Error in console:
--   [AuthContext] v_linkme_users ERROR {}
--   [AuthContext] user_app_roles FALLBACK ERROR {}
--
-- Solution: Remove security_invoker (defaults to SECURITY DEFINER) while
--           keeping the user_role_id field added by 20260124_000.
-- ============================================================================

DROP VIEW IF EXISTS public.v_linkme_users CASCADE;

-- Create view WITHOUT security_invoker = defaults to SECURITY DEFINER
-- SECURITY DEFINER = view runs with owner (postgres) privileges
-- This allows access to auth.users which is protected by RLS
CREATE VIEW public.v_linkme_users AS
SELECT
  au.id as user_id,
  uar.id as user_role_id,                    -- Keep this from 20260124_000
  au.email,
  up.first_name,
  up.last_name,
  up.avatar_url,
  up.phone,
  uar.role as linkme_role,
  uar.enseigne_id,
  uar.organisation_id,
  uar.permissions,
  uar.is_active,
  uar.created_at as role_created_at,
  uar.default_margin_rate,
  e.name as enseigne_name,
  e.logo_url as enseigne_logo,
  COALESCE(o.trade_name, o.legal_name) as organisation_name,
  o.logo_url as organisation_logo
FROM auth.users au
INNER JOIN public.user_app_roles uar
  ON au.id = uar.user_id
  AND uar.app = 'linkme'
LEFT JOIN public.user_profiles up
  ON au.id = up.user_id
LEFT JOIN public.enseignes e
  ON uar.enseigne_id = e.id
LEFT JOIN public.organisations o
  ON uar.organisation_id = o.id
WHERE uar.is_active = true;

-- Grant permissions
GRANT SELECT ON public.v_linkme_users TO authenticated;
GRANT SELECT ON public.v_linkme_users TO service_role;

COMMENT ON VIEW public.v_linkme_users IS
'LinkMe users view - SECURITY DEFINER (default) required for auth.users access.
Includes user_role_id for AuthContext. Security via RLS on user_app_roles.
Fix 2026-01-26: Removed security_invoker that caused infinite auth loop.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260126_002: Fixed v_linkme_users - restored SECURITY DEFINER';
END $$;

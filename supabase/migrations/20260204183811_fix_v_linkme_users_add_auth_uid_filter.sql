-- ============================================================================
-- Migration: Fix v_linkme_users - Add auth.uid() Filter (CRITICAL SECURITY FIX)
-- Date: 2026-02-04
-- Priority: CRITICAL - Security vulnerability
--
-- Problem: Supabase Advisor still reports "auth_users_exposed" error after
--          REVOKE anon fix (migration 20260204183345).
--
--          Root cause: View doesn't filter by auth.uid(), so ANY authenticated
--          user can see ALL LinkMe users' data (not just their own).
--
--          Current WHERE: uar.is_active = true
--          Missing: AND au.id = auth.uid()
--
-- Risk: Authenticated users can potentially read emails and IDs of OTHER LinkMe users.
--
-- Solution: Recreate view with auth.uid() filter in WHERE clause.
--           Each user will only see THEIR OWN row.
--
-- Reference:
--   - Supabase Linter: https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed
--   - Current migration: 20260126_002_fix_v_linkme_users_security_definer.sql
-- ============================================================================

DROP VIEW IF EXISTS public.v_linkme_users CASCADE;

-- Create view with auth.uid() filter for row-level security
CREATE VIEW public.v_linkme_users AS
SELECT
  au.id as user_id,
  uar.id as user_role_id,
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
WHERE uar.is_active = true
  AND au.id = auth.uid();  -- ⭐ SECURITY FIX: Users only see their own row

-- Grant permissions (keep same as before)
GRANT SELECT ON public.v_linkme_users TO authenticated;
GRANT SELECT ON public.v_linkme_users TO service_role;

COMMENT ON VIEW public.v_linkme_users IS
'LinkMe users view - SECURITY DEFINER with auth.uid() filter.
Each user can ONLY see their own row (auth_users_exposed fix 2026-02-04).
Security via auth.uid() WHERE filter + RLS on underlying tables.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260204183811: Fixed v_linkme_users - added auth.uid() filter';
END $$;

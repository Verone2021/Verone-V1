-- ============================================================================
-- Migration: Fix v_linkme_users RLS - Block Anon Access
-- Date: 2026-02-04
-- Priority: CRITICAL - Security vulnerability
--
-- Problem: Supabase Advisor reports "auth_users_exposed" error:
--          View v_linkme_users in public schema exposes auth.users to anon role.
--          Without RLS, PostgREST automatically exposes views to anon, even if
--          GRANT SELECT only mentions authenticated.
--
-- Risk: Anonymous users can potentially read emails and IDs of LinkMe users.
--
-- Solution:
--   1. Enable RLS on v_linkme_users
--   2. Create policy that allows ONLY authenticated users (blocks anon)
--
-- Reference:
--   - Supabase Linter: https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed
--   - Current migration: 20260126_002_fix_v_linkme_users_security_definer.sql
-- ============================================================================

-- Revoke ALL permissions from anon and public roles
-- (Views don't support RLS, so we use GRANT/REVOKE instead)
REVOKE ALL ON public.v_linkme_users FROM anon;
REVOKE ALL ON public.v_linkme_users FROM public;

-- Grant SELECT ONLY to authenticated and service_role
GRANT SELECT ON public.v_linkme_users TO authenticated;
GRANT SELECT ON public.v_linkme_users TO service_role;

COMMENT ON VIEW public.v_linkme_users IS
'LinkMe users view - SECURITY DEFINER with explicit permissions.
Access blocked for anon role via REVOKE (auth_users_exposed fix 2026-02-04).
Only authenticated users and service_role can read this view.
Security via GRANT/REVOKE + RLS on underlying tables (user_app_roles, auth.users).';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260204183345: Fixed v_linkme_users RLS - blocked anon access';
END $$;

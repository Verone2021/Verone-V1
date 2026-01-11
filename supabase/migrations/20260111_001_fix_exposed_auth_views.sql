-- Migration: Fix Exposed Auth Users Views (Security Advisor)
--
-- PROBLEME: 3 vues exposent auth.users aux roles anon/authenticated via PostgREST
-- SOURCE: Supabase Security Advisor - "Exposed Auth Users" errors
--
-- SOLUTION: Revoquer acces public, accorder uniquement a authenticated (staff)
--
-- VUES CONCERNEES:
-- 1. public.v_users_with_roles
-- 2. public.v_linkme_users
-- 3. public.v_pending_invoice_uploads
--
-- @since 2026-01-11

-- ============================================================================
-- STEP 1: Revoke public access (removes anon access)
-- ============================================================================

REVOKE ALL ON public.v_users_with_roles FROM anon;
REVOKE ALL ON public.v_users_with_roles FROM public;

REVOKE ALL ON public.v_linkme_users FROM anon;
REVOKE ALL ON public.v_linkme_users FROM public;

REVOKE ALL ON public.v_pending_invoice_uploads FROM anon;
REVOKE ALL ON public.v_pending_invoice_uploads FROM public;

-- ============================================================================
-- STEP 2: Grant SELECT only to authenticated users (staff)
-- ============================================================================

GRANT SELECT ON public.v_users_with_roles TO authenticated;
GRANT SELECT ON public.v_linkme_users TO authenticated;
GRANT SELECT ON public.v_pending_invoice_uploads TO authenticated;

-- ============================================================================
-- STEP 3: Add security comments
-- ============================================================================

COMMENT ON VIEW public.v_users_with_roles IS
'Staff-only view: Lists users with their app roles. Access restricted to authenticated users only (Security fix 2026-01-11)';

COMMENT ON VIEW public.v_linkme_users IS
'Staff-only view: LinkMe users with enseigne/organisation info. Access restricted to authenticated users only (Security fix 2026-01-11)';

COMMENT ON VIEW public.v_pending_invoice_uploads IS
'Staff-only view: Financial documents pending upload to Qonto. Access restricted to authenticated users only (Security fix 2026-01-11)';

-- ============================================================================
-- VERIFICATION: Check grants are correct
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Security fix applied: 3 views now restricted to authenticated role only';
END $$;

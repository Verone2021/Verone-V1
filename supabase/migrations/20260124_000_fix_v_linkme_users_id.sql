-- ============================================================================
-- Migration: Fix v_linkme_users - Add user_role_id field
-- Date: 2026-01-24
-- Description: Add uar.id as user_role_id to the view so AuthContext can
--              properly access the role ID. This fixes infinite loading bug
--              where data.id was undefined.
--
-- Bug: AuthContext.tsx line 167 tries to access data.id but the view
--      only returns user_id (from auth.users). The correct ID for the
--      LinkMe role is uar.id from user_app_roles.
--
-- Solution: Add uar.id as user_role_id to the view.
-- ============================================================================

-- Drop and recreate view (keeping SECURITY INVOKER from previous migration)
DROP VIEW IF EXISTS public.v_linkme_users CASCADE;

CREATE VIEW public.v_linkme_users
WITH (security_invoker = true)
AS
SELECT
  au.id as user_id,
  uar.id as user_role_id,                    -- FIX: Add role ID for AuthContext
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
'LinkMe users view with user_role_id - Fix for AuthContext (2026-01-24)';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260124_000: Added user_role_id to v_linkme_users view';
END $$;

-- Restore v_linkme_users without SECURITY INVOKER (= SECURITY DEFINER by default)
--
-- Context: Migration 20260121_001 converted v_linkme_users to SECURITY INVOKER,
-- but this view accesses auth.users (protected by RLS). Result: back-office users page shows 0 users.
--
-- Solution: Restore SECURITY DEFINER mode (default) so the view can access auth.users.
-- Security is ensured by RLS on user_app_roles table.
--
-- @since 2026-01-22

DROP VIEW IF EXISTS public.v_linkme_users CASCADE;

CREATE VIEW public.v_linkme_users AS
SELECT
  au.id as user_id,
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
  ON au.id = uar.user_id AND uar.app = 'linkme'
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.enseignes e ON uar.enseigne_id = e.id
LEFT JOIN public.organisations o ON uar.organisation_id = o.id
WHERE uar.is_active = true;

GRANT SELECT ON public.v_linkme_users TO authenticated;
GRANT SELECT ON public.v_linkme_users TO service_role;

COMMENT ON VIEW public.v_linkme_users IS
'Vue LinkMe users - SECURITY DEFINER requis car accès à auth.users.
Sécurité assurée par RLS sur user_app_roles.';

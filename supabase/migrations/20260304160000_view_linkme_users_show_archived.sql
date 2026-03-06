-- Migration: Show archived users in v_linkme_users view
-- Previously filtered by is_active = true, now shows all LinkMe users
-- so the frontend can manage archive/delete workflow
--
-- IMPORTANT: security_definer (default) instead of security_invoker
-- because auth.users has RLS "Users can view their own profile" (auth.uid() = id)
-- which blocks back-office staff from seeing other users' emails.

DROP VIEW IF EXISTS public.v_linkme_users;

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
  ON uar.organisation_id = o.id;
-- No WHERE is_active filter: frontend handles display of archived users

-- Grant access to Supabase roles
GRANT SELECT ON public.v_linkme_users TO authenticated;
GRANT SELECT ON public.v_linkme_users TO anon;
GRANT SELECT ON public.v_linkme_users TO service_role;

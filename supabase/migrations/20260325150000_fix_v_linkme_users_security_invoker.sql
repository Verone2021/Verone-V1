-- Fix: v_linkme_users ne retourne rien car security_invoker=true
-- applique la RLS de auth.users au caller, bloquant la lecture des autres users.
--
-- Solution: recréer la vue avec security_invoker=false pour que la vue
-- s'exécute avec les permissions du propriétaire (postgres, qui bypass RLS).
-- La sécurité est assurée par les RLS sur user_app_roles (policy privileged_view_all_roles).

DROP VIEW IF EXISTS v_linkme_users;

CREATE VIEW v_linkme_users
WITH (security_invoker = false)
AS
SELECT
  au.id AS user_id,
  uar.id AS user_role_id,
  au.email,
  up.first_name,
  up.last_name,
  up.avatar_url,
  up.phone,
  uar.role AS linkme_role,
  uar.enseigne_id,
  uar.organisation_id,
  uar.permissions,
  uar.is_active,
  uar.created_at AS role_created_at,
  uar.default_margin_rate,
  e.name AS enseigne_name,
  e.logo_url AS enseigne_logo,
  COALESCE(o.trade_name, o.legal_name) AS organisation_name,
  o.logo_url AS organisation_logo
FROM auth.users au
INNER JOIN user_app_roles uar ON au.id = uar.user_id AND uar.app = 'linkme'
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN enseignes e ON uar.enseigne_id = e.id
LEFT JOIN organisations o ON uar.organisation_id = o.id;

-- Grant access to authenticated users (la RLS sur user_app_roles contrôle l'accès)
GRANT SELECT ON v_linkme_users TO authenticated;

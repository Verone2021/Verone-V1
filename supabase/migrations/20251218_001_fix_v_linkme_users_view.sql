-- Migration: Fix v_linkme_users View (Broken in 20251205)
--
-- PROBLÈME: La migration 20251205_001_add_default_margin_rate.sql a cassé la vue
-- en remplaçant le JOIN avec auth.users par un JOIN incorrect avec user_profiles
--
-- SOLUTION: Restaurer la définition correcte avec auth.users + ajouter default_margin_rate
--
-- @since 2025-12-18

-- Drop existing broken view
DROP VIEW IF EXISTS public.v_linkme_users CASCADE;

-- Recreate with CORRECT definition (from 20251201 + new column)
CREATE OR REPLACE VIEW public.v_linkme_users AS
SELECT
  au.id as user_id,                         -- ✅ FROM auth.users (correct)
  au.email,                                  -- ✅ FROM auth.users (correct)
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
  uar.default_margin_rate,                  -- ✅ NEW COLUMN from 20251205
  e.name as enseigne_name,
  e.logo_url as enseigne_logo,
  COALESCE(o.trade_name, o.legal_name) as organisation_name,
  o.logo_url as organisation_logo
FROM auth.users au                          -- ✅ CORRECT: Start from auth.users
INNER JOIN public.user_app_roles uar
  ON au.id = uar.user_id
  AND uar.app = 'linkme'                    -- Filter LinkMe roles only
LEFT JOIN public.user_profiles up
  ON au.id = up.user_id                     -- ✅ CORRECT: Join on auth.users.id
LEFT JOIN public.enseignes e
  ON uar.enseigne_id = e.id
LEFT JOIN public.organisations o
  ON uar.organisation_id = o.id
WHERE uar.is_active = true;

-- Grant SELECT to authenticated users (inherits RLS from user_app_roles)
GRANT SELECT ON public.v_linkme_users TO authenticated;

-- Comment explaining the fix
COMMENT ON VIEW public.v_linkme_users IS
'LinkMe users view - Fixed 2025-12-18: Restored correct auth.users join that was broken in migration 20251205';

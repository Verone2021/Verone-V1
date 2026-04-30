-- =======================================================================
-- BO-SEC-CRITICAL-002 — Fix `v_linkme_users` auth.users leak
-- =======================================================================
-- Date         : 2026-04-30
-- Source       : docs/scratchpad/dev-plan-2026-04-30-BO-SEC-CRITICAL-002.md
-- Suite de    : BO-SEC-CRITICAL-001 (PR #840) — stop-the-bleed.
--
-- Cible : 2 ERROR Supabase Advisors :
--   - `auth_users_exposed` ERROR x1 sur `v_linkme_users` (RGPD critique)
--   - `security_definer_view` ERROR x1 sur `v_linkme_users` (12 restantes)
--
-- Stratégie :
--   1. Recréer la vue SANS le JOIN sur `auth.users` :
--        - retire la colonne `email` (sensible RGPD)
--        - garde `user_id` (provient désormais de `uar.user_id`, pas `au.id`)
--        - ajoute `WITH (security_invoker = true)` → respecte les RLS
--          du caller au lieu d'utiliser celles du créateur (postgres).
--   2. Créer une RPC SECURITY DEFINER `get_linkme_users_emails(uuid[])`
--      avec check `is_backoffice_user()` qui retourne (user_id, email)
--      pour les seuls staff back-office.
--
-- Refacto code TS (5 occurrences sur 8 affectées — voir dev-plan) :
--   - apps/back-office/src/app/(protected)/canaux-vente/linkme/messages/components/hooks.ts
--   - apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/linkme-user-queries.ts
--   - packages/@verone/orders/src/hooks/linkme/use-organisation-contacts-bo.ts
-- (les 3 autres usages — useSendNotification x2 + use-organisations-independantes —
--  ne sélectionnaient PAS `email`, aucun changement nécessaire.)
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. DROP + CREATE VIEW v_linkme_users (sans auth.users JOIN, security_invoker)
-- -----------------------------------------------------------------------
-- pg_depend confirme : 0 vue/fonction DB ne dépend de v_linkme_users.
-- 8 fichiers code consomment la vue (3 SAFE après changement, 5 nécessitent
-- la nouvelle RPC pour l'email — refacto dans cette même PR).

DROP VIEW IF EXISTS public.v_linkme_users;

CREATE VIEW public.v_linkme_users WITH (security_invoker = true) AS
  SELECT
    uar.id              AS user_role_id,
    uar.user_id,                                            -- = uar.user_id (PAS auth.users.id)
    up.first_name,
    up.last_name,
    up.avatar_url,
    up.phone,
    uar.role            AS linkme_role,
    uar.enseigne_id,
    uar.organisation_id,
    uar.permissions,
    uar.is_active,
    uar.created_at      AS role_created_at,
    uar.default_margin_rate,
    e.name              AS enseigne_name,
    e.logo_url          AS enseigne_logo,
    COALESCE(o.trade_name, o.legal_name) AS organisation_name,
    o.logo_url          AS organisation_logo
  FROM public.user_app_roles uar
    LEFT JOIN public.user_profiles up ON up.user_id = uar.user_id
    LEFT JOIN public.enseignes     e  ON e.id       = uar.enseigne_id
    LEFT JOIN public.organisations o  ON o.id       = uar.organisation_id
  WHERE uar.app = 'linkme'::app_type;

COMMENT ON VIEW public.v_linkme_users IS
  'Vue LinkMe users — security_invoker=true (respecte RLS du caller). '
  'Colonne `email` retirée (était auth_users_exposed ERROR). '
  'Pour récupérer les emails côté staff back-office : utiliser '
  'get_linkme_users_emails(user_ids uuid[]).';

-- Grants standards (anon en lecture car la vue est dans public + utilisée
-- côté staff authentifié uniquement via les RLS de user_app_roles).
GRANT SELECT ON public.v_linkme_users TO anon, authenticated, service_role;


-- -----------------------------------------------------------------------
-- 2. Nouvelle RPC `get_linkme_users_emails(uuid[])`
-- -----------------------------------------------------------------------
-- Retourne les emails des users LinkMe à partir d'un tableau de user_id.
-- SECURITY DEFINER + check `is_backoffice_user()` → seul staff BO reçoit
-- les emails. Tout autre rôle (anon, affilié LinkMe authentifié) reçoit
-- un set vide.
--
-- Le paramètre est un UUID[] pour permettre le bulk fetch en une seule
-- requête depuis le frontend (vs N×1 requêtes).

CREATE OR REPLACE FUNCTION public.get_linkme_users_emails(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT au.id, au.email
  FROM auth.users au
  JOIN public.user_app_roles uar
    ON uar.user_id = au.id
   AND uar.app = 'linkme'::app_type
  WHERE au.id = ANY(user_ids)
    AND public.is_backoffice_user();
$$;

COMMENT ON FUNCTION public.get_linkme_users_emails(uuid[]) IS
  'Bulk fetch emails for LinkMe users — SECURITY DEFINER, '
  'gated by is_backoffice_user(). Returns empty set if caller is not BO staff.';

-- Permet aux rôles authentifiés d'appeler la RPC (le check is_backoffice_user
-- décide si le résultat est non vide ou non).
REVOKE ALL ON FUNCTION public.get_linkme_users_emails(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_linkme_users_emails(uuid[]) TO authenticated, service_role;

COMMIT;

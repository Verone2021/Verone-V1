-- ============================================================================
-- Migration: 20251201_002_migrate_existing_users.sql
-- Description: Migre les utilisateurs existants vers user_app_roles
-- Auteur: Claude Code
-- Date: 2025-12-01
-- ============================================================================

-- ============================================================================
-- SECTION 1: Migration des user_profiles existants vers user_app_roles
-- ============================================================================

-- Migrer les utilisateurs back-office existants
-- Mapping des rôles: owner/admin → admin, catalog_manager → manager, customer → user
INSERT INTO public.user_app_roles (user_id, app, role, organisation_id, is_active, created_at)
SELECT
  up.user_id,
  up.app_source::app_type,
  CASE
    WHEN up.role IN ('owner', 'admin') THEN 'admin'
    WHEN up.role = 'catalog_manager' THEN 'manager'
    ELSE 'user'
  END as role,
  up.organisation_id,
  true,
  COALESCE(up.created_at, now())
FROM public.user_profiles up
WHERE up.app_source = 'back-office'
  AND up.user_id IS NOT NULL
ON CONFLICT (user_id, app) DO NOTHING;

-- ============================================================================
-- SECTION 2: Ajouter colonne is_public à linkme_selections
-- ============================================================================

-- Ajouter la colonne is_public si elle n'existe pas
ALTER TABLE public.linkme_selections
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false NOT NULL;

-- Commentaire documentation
COMMENT ON COLUMN public.linkme_selections.is_public IS
'Si true, la sélection est publique et découvrable sur internet. Si false, visible uniquement par le réseau de l''enseigne.';

-- Index pour requêtes publiques
CREATE INDEX IF NOT EXISTS idx_linkme_selections_is_public
ON public.linkme_selections(is_public) WHERE is_public = true;

-- ============================================================================
-- SECTION 3: Vue utilitaire pour lister les utilisateurs avec leurs rôles
-- ============================================================================

CREATE OR REPLACE VIEW public.v_users_with_roles AS
SELECT
  au.id as user_id,
  au.email,
  au.created_at as user_created_at,
  au.last_sign_in_at,
  up.first_name,
  up.last_name,
  up.avatar_url,
  up.phone,
  uar.app,
  uar.role,
  uar.enseigne_id,
  uar.organisation_id,
  uar.permissions,
  uar.is_active as role_is_active,
  e.name as enseigne_name,
  COALESCE(o.trade_name, o.legal_name) as organisation_name
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.user_app_roles uar ON au.id = uar.user_id
LEFT JOIN public.enseignes e ON uar.enseigne_id = e.id
LEFT JOIN public.organisations o ON uar.organisation_id = o.id
WHERE uar.id IS NOT NULL;

COMMENT ON VIEW public.v_users_with_roles IS
'Vue consolidée des utilisateurs avec leurs rôles par application';

-- ============================================================================
-- SECTION 4: Vue spécifique LinkMe utilisateurs
-- ============================================================================

CREATE OR REPLACE VIEW public.v_linkme_users AS
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
  e.name as enseigne_name,
  e.logo_url as enseigne_logo,
  COALESCE(o.trade_name, o.legal_name) as organisation_name,
  o.logo_url as organisation_logo
FROM auth.users au
INNER JOIN public.user_app_roles uar ON au.id = uar.user_id AND uar.app = 'linkme'
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.enseignes e ON uar.enseigne_id = e.id
LEFT JOIN public.organisations o ON uar.organisation_id = o.id
WHERE uar.is_active = true;

COMMENT ON VIEW public.v_linkme_users IS
'Vue des utilisateurs LinkMe actifs avec informations enseigne/organisation';

-- ============================================================================
-- SECTION 5: Fonction pour créer un utilisateur avec rôle
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_with_role(
  p_email text,
  p_password text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_app app_type DEFAULT 'linkme',
  p_role text DEFAULT 'client',
  p_enseigne_id uuid DEFAULT NULL,
  p_organisation_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Cette fonction est un placeholder - la création d'utilisateur
  -- doit se faire via l'Admin API Supabase côté serveur
  -- Elle sert principalement à documenter le workflow attendu

  RAISE EXCEPTION 'Utilisez l''Admin API Supabase pour créer des utilisateurs. Cette fonction est un placeholder documentaire.';

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.create_user_with_role IS
'Placeholder documentaire. La création d''utilisateurs doit se faire via l''Admin API Supabase côté Next.js Server Actions.';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================

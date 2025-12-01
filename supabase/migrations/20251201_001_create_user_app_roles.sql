-- ============================================================================
-- Migration: 20251201_001_create_user_app_roles.sql
-- Description: Crée la table user_app_roles pour supporter multi-app par user
-- Objectif: Un utilisateur peut avoir différents rôles sur différentes apps
-- Auteur: Claude Code
-- Date: 2025-12-01
-- ============================================================================

-- ============================================================================
-- SECTION 1: Création table user_app_roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_app_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence utilisateur Supabase Auth
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Application (utilise le type enum existant)
  app app_type NOT NULL,

  -- Rôle spécifique à l'app
  -- LinkMe: enseigne_admin, organisation_admin, client
  -- Back-office: admin, manager, user
  -- Site-internet: customer
  role text NOT NULL,

  -- Contexte organisationnel (pour LinkMe)
  enseigne_id uuid REFERENCES public.enseignes(id) ON DELETE SET NULL,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,

  -- Permissions additionnelles (JSON array pour flexibilité)
  permissions text[] DEFAULT '{}',

  -- Statut
  is_active boolean DEFAULT true NOT NULL,

  -- Métadonnées
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Contraintes
  CONSTRAINT unique_user_app UNIQUE (user_id, app),

  -- Validation rôles LinkMe
  CONSTRAINT valid_linkme_role CHECK (
    app != 'linkme' OR role IN ('enseigne_admin', 'organisation_admin', 'client')
  ),

  -- Validation rôles Back-office
  CONSTRAINT valid_backoffice_role CHECK (
    app != 'back-office' OR role IN ('admin', 'manager', 'user')
  ),

  -- Validation rôles Site-internet
  CONSTRAINT valid_siteinternet_role CHECK (
    app != 'site-internet' OR role IN ('customer')
  ),

  -- enseigne_admin doit avoir enseigne_id
  CONSTRAINT enseigne_admin_needs_enseigne CHECK (
    NOT (app = 'linkme' AND role = 'enseigne_admin' AND enseigne_id IS NULL)
  ),

  -- organisation_admin doit avoir organisation_id
  CONSTRAINT org_admin_needs_org CHECK (
    NOT (app = 'linkme' AND role = 'organisation_admin' AND organisation_id IS NULL)
  )
);

-- ============================================================================
-- SECTION 2: Index pour performances
-- ============================================================================

-- Index principal pour lookup par user_id
CREATE INDEX IF NOT EXISTS idx_user_app_roles_user_id
  ON public.user_app_roles(user_id);

-- Index pour lookup par app
CREATE INDEX IF NOT EXISTS idx_user_app_roles_app
  ON public.user_app_roles(app);

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_app_roles_user_app_active
  ON public.user_app_roles(user_id, app) WHERE is_active = true;

-- Index pour filtrage par enseigne
CREATE INDEX IF NOT EXISTS idx_user_app_roles_enseigne
  ON public.user_app_roles(enseigne_id) WHERE enseigne_id IS NOT NULL;

-- Index pour filtrage par organisation
CREATE INDEX IF NOT EXISTS idx_user_app_roles_organisation
  ON public.user_app_roles(organisation_id) WHERE organisation_id IS NOT NULL;

-- Index pour filtrage par rôle LinkMe
CREATE INDEX IF NOT EXISTS idx_user_app_roles_linkme_role
  ON public.user_app_roles(role) WHERE app = 'linkme';

-- ============================================================================
-- SECTION 3: Trigger updated_at
-- ============================================================================

-- Fonction trigger si pas déjà existante
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at automatique
DROP TRIGGER IF EXISTS set_updated_at_user_app_roles ON public.user_app_roles;
CREATE TRIGGER set_updated_at_user_app_roles
  BEFORE UPDATE ON public.user_app_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- SECTION 4: RLS Policies
-- ============================================================================

-- Activer RLS
ALTER TABLE public.user_app_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Les admins back-office peuvent tout voir
CREATE POLICY "Admins can view all user_app_roles"
  ON public.user_app_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
    )
  );

-- Policy: Utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view their own roles"
  ON public.user_app_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: enseigne_admin peut voir les rôles de son enseigne
CREATE POLICY "Enseigne admins can view their enseigne roles"
  ON public.user_app_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.role = 'enseigne_admin'
        AND uar.enseigne_id = user_app_roles.enseigne_id
        AND uar.is_active = true
    )
  );

-- Policy: Admins back-office peuvent insérer
CREATE POLICY "Admins can insert user_app_roles"
  ON public.user_app_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
    )
  );

-- Policy: enseigne_admin peut créer des rôles pour son enseigne
CREATE POLICY "Enseigne admins can insert roles for their enseigne"
  ON public.user_app_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.role = 'enseigne_admin'
        AND uar.enseigne_id = user_app_roles.enseigne_id
        AND uar.is_active = true
    )
    AND user_app_roles.app = 'linkme'
    AND user_app_roles.role IN ('organisation_admin', 'client')
  );

-- Policy: Admins back-office peuvent mettre à jour
CREATE POLICY "Admins can update user_app_roles"
  ON public.user_app_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
    )
  );

-- Policy: enseigne_admin peut mettre à jour les rôles de son enseigne
CREATE POLICY "Enseigne admins can update roles for their enseigne"
  ON public.user_app_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.role = 'enseigne_admin'
        AND uar.enseigne_id = user_app_roles.enseigne_id
        AND uar.is_active = true
    )
    AND user_app_roles.app = 'linkme'
    AND user_app_roles.role IN ('organisation_admin', 'client')
  );

-- Policy: Admins back-office peuvent supprimer
CREATE POLICY "Admins can delete user_app_roles"
  ON public.user_app_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
    )
  );

-- ============================================================================
-- SECTION 5: Commentaires documentation
-- ============================================================================

COMMENT ON TABLE public.user_app_roles IS
'Table centrale pour les rôles utilisateurs multi-applications.
Permet à un utilisateur d''avoir différents rôles sur différentes apps (back-office, site-internet, linkme).
Remplace la logique app_source unique de user_profiles.';

COMMENT ON COLUMN public.user_app_roles.user_id IS 'Référence vers auth.users - l''utilisateur Supabase';
COMMENT ON COLUMN public.user_app_roles.app IS 'Application concernée (back-office, site-internet, linkme)';
COMMENT ON COLUMN public.user_app_roles.role IS 'Rôle dans l''application (enseigne_admin, organisation_admin, client pour LinkMe)';
COMMENT ON COLUMN public.user_app_roles.enseigne_id IS 'Enseigne associée (obligatoire pour enseigne_admin)';
COMMENT ON COLUMN public.user_app_roles.organisation_id IS 'Organisation associée (obligatoire pour organisation_admin)';
COMMENT ON COLUMN public.user_app_roles.permissions IS 'Permissions additionnelles en array texte';
COMMENT ON COLUMN public.user_app_roles.is_active IS 'Si le rôle est actif (permet désactivation soft)';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================

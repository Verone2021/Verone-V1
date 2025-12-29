-- ============================================
-- FIX: RLS Recursive Loop on user_app_roles
-- ============================================
-- Problème: Les politiques RLS lisent user_app_roles pour vérifier
-- si l'utilisateur est admin, créant une boucle infinie.
-- Solution: Fonction SECURITY DEFINER qui bypass RLS.
--
-- Date: 2025-12-21
-- Author: Claude Code

-- 1. Créer la fonction helper avec SECURITY DEFINER
-- Cette fonction s'exécute avec les privilèges du créateur, bypasse RLS
CREATE OR REPLACE FUNCTION public.is_backoffice_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- 2. Créer fonction pour vérifier enseigne_admin
CREATE OR REPLACE FUNCTION public.is_enseigne_admin_for(target_enseigne_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'linkme'
      AND role = 'enseigne_admin'
      AND enseigne_id = target_enseigne_id
      AND is_active = true
  );
$$;

-- 3. Supprimer les anciennes politiques (qui causent la boucle récursive)
DROP POLICY IF EXISTS "Admins can view all user_app_roles" ON public.user_app_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can view their enseigne roles" ON public.user_app_roles;
DROP POLICY IF EXISTS "Admins can insert user_app_roles" ON public.user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can insert roles for their enseigne" ON public.user_app_roles;
DROP POLICY IF EXISTS "Admins can update user_app_roles" ON public.user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can update roles for their enseigne" ON public.user_app_roles;
DROP POLICY IF EXISTS "Admins can delete user_app_roles" ON public.user_app_roles;

-- 4. Recréer les politiques avec les fonctions helper (sans récursion)

-- SELECT policies
CREATE POLICY "Admins can view all user_app_roles"
  ON public.user_app_roles
  FOR SELECT
  USING (public.is_backoffice_admin());

CREATE POLICY "Users can view their own roles"
  ON public.user_app_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Enseigne admins can view their enseigne roles"
  ON public.user_app_roles
  FOR SELECT
  USING (
    enseigne_id IS NOT NULL
    AND public.is_enseigne_admin_for(enseigne_id)
  );

-- INSERT policies
CREATE POLICY "Admins can insert user_app_roles"
  ON public.user_app_roles
  FOR INSERT
  WITH CHECK (public.is_backoffice_admin());

CREATE POLICY "Enseigne admins can insert roles for their enseigne"
  ON public.user_app_roles
  FOR INSERT
  WITH CHECK (
    app = 'linkme'
    AND role IN ('organisation_admin', 'org_independante', 'client')
    AND public.is_enseigne_admin_for(enseigne_id)
  );

-- UPDATE policies
CREATE POLICY "Admins can update user_app_roles"
  ON public.user_app_roles
  FOR UPDATE
  USING (public.is_backoffice_admin());

CREATE POLICY "Enseigne admins can update roles for their enseigne"
  ON public.user_app_roles
  FOR UPDATE
  USING (
    enseigne_id IS NOT NULL
    AND public.is_enseigne_admin_for(enseigne_id)
    AND role IN ('organisation_admin', 'org_independante', 'client')
  );

-- DELETE policy
CREATE POLICY "Admins can delete user_app_roles"
  ON public.user_app_roles
  FOR DELETE
  USING (public.is_backoffice_admin());

-- Commentaire de fin
COMMENT ON FUNCTION public.is_backoffice_admin() IS 'Helper function to check if current user is back-office admin. Uses SECURITY DEFINER to bypass RLS and avoid recursive loop.';
COMMENT ON FUNCTION public.is_enseigne_admin_for(uuid) IS 'Helper function to check if current user is enseigne_admin for a specific enseigne. Uses SECURITY DEFINER to bypass RLS.';

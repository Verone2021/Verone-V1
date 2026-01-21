-- ============================================================================
-- Migration: Fix RLS recursion on user_app_roles
-- Date: 2026-01-21
-- URGENCE: Corrige l'erreur 500 sur LinkMe dashboard
--
-- PROBLEME:
-- La migration 20260121_003 a créé des politiques RLS sur user_app_roles
-- qui font des sous-requêtes sur la MÊME table user_app_roles.
-- Cela cause une récursion infinie quand PostgreSQL évalue les politiques.
--
-- SOLUTION:
-- 1. Supprimer les politiques récursives
-- 2. Créer des fonctions helper SECURITY DEFINER (qui bypass RLS)
-- 3. Recréer les politiques en utilisant ces helpers
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Supprimer les politiques problématiques (récursives)
-- ============================================================================

DROP POLICY IF EXISTS "Back-office admins can view all roles" ON user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can view their enseigne roles" ON user_app_roles;
DROP POLICY IF EXISTS "Back-office admins can insert roles" ON user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can insert roles for their enseigne" ON user_app_roles;
DROP POLICY IF EXISTS "Back-office admins can delete roles" ON user_app_roles;

-- Note: On garde "Users can view their own roles" car elle n'est PAS récursive
-- (elle compare simplement user_id = auth.uid(), sans sous-requête sur la table)

-- ============================================================================
-- ÉTAPE 2: Créer fonctions helper SECURITY DEFINER (bypass RLS)
-- Ces fonctions peuvent lire user_app_roles sans déclencher les politiques RLS
-- ============================================================================

-- Helper: Vérifier si l'utilisateur est admin back-office
CREATE OR REPLACE FUNCTION is_back_office_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- Helper: Vérifier si l'utilisateur est admin d'une enseigne spécifique
CREATE OR REPLACE FUNCTION is_enseigne_admin_for(p_enseigne_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'linkme'
      AND role = 'enseigne_admin'
      AND enseigne_id = p_enseigne_id
      AND is_active = true
  );
$$;

-- Helper: Vérifier si l'utilisateur est un utilisateur back-office (any role)
-- Note: Cette fonction existe déjà dans 003 mais on la recrée pour s'assurer
-- qu'elle a row_security = off
CREATE OR REPLACE FUNCTION is_backoffice_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND is_active = true
  );
$$;

-- ============================================================================
-- ÉTAPE 3: Recréer les politiques SANS récursion (via helpers)
-- ============================================================================

-- Admin back-office peut voir tous les rôles
CREATE POLICY "Back-office admins can view all roles"
  ON user_app_roles
  FOR SELECT
  USING (is_back_office_admin());

-- Admin enseigne peut voir les rôles de son enseigne
CREATE POLICY "Enseigne admins can view their enseigne roles"
  ON user_app_roles
  FOR SELECT
  USING (is_enseigne_admin_for(enseigne_id));

-- Admin back-office peut créer des rôles
CREATE POLICY "Back-office admins can insert roles"
  ON user_app_roles
  FOR INSERT
  WITH CHECK (is_back_office_admin());

-- Admin enseigne peut créer des rôles pour son enseigne
CREATE POLICY "Enseigne admins can insert roles for their enseigne"
  ON user_app_roles
  FOR INSERT
  WITH CHECK (is_enseigne_admin_for(enseigne_id));

-- Admin back-office peut supprimer des rôles
CREATE POLICY "Back-office admins can delete roles"
  ON user_app_roles
  FOR DELETE
  USING (is_back_office_admin());

-- ============================================================================
-- ÉTAPE 4: Corriger aussi les autres politiques qui font référence à user_app_roles
-- ============================================================================

-- form_submissions: utiliser is_backoffice_user() au lieu d'une sous-requête
DROP POLICY IF EXISTS "Back-office full access to form_submissions" ON form_submissions;
CREATE POLICY "Back-office full access to form_submissions" ON form_submissions
FOR ALL USING (is_backoffice_user());

-- form_types: utiliser is_backoffice_user()
DROP POLICY IF EXISTS "Back-office full access to form_types" ON form_types;
CREATE POLICY "Back-office full access to form_types" ON form_types
FOR ALL USING (is_backoffice_user());

-- app_settings: utiliser is_backoffice_user()
DROP POLICY IF EXISTS "Back-office full access to app_settings" ON app_settings;
CREATE POLICY "Back-office full access to app_settings" ON app_settings
FOR ALL USING (is_backoffice_user());

-- form_submission_messages: utiliser is_backoffice_user()
DROP POLICY IF EXISTS "Back-office full access to messages" ON form_submission_messages;
CREATE POLICY "Back-office full access to messages" ON form_submission_messages
FOR ALL USING (is_backoffice_user());

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260121_005: Correction récursion RLS user_app_roles';
  RAISE NOTICE 'Politiques récursives remplacées par fonctions SECURITY DEFINER';
  RAISE NOTICE 'Le dashboard LinkMe devrait fonctionner maintenant';
END $$;

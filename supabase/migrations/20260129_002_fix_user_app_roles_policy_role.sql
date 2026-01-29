-- ============================================================================
-- Migration: Fix RLS policy role (public → authenticated)
-- Date: 2026-01-29
-- URGENCE: CRITIQUE - Corrige l'authentification LinkMe en production
--
-- PROBLEME:
-- Migration 20260129_001 a créé la policy pour le role {public} au lieu de
-- {authenticated}, donc les utilisateurs connectés ne peuvent pas lire leurs
-- propres rôles.
--
-- SOLUTION:
-- Drop et recréer la policy avec TO authenticated explicite.
-- ============================================================================

-- Drop policy incorrecte
DROP POLICY IF EXISTS "Users can view their own roles" ON user_app_roles;

-- Recréer CORRECTEMENT avec TO authenticated
CREATE POLICY "Users can view their own roles"
  ON user_app_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  policy_roles TEXT[];
BEGIN
  SELECT roles INTO policy_roles
  FROM pg_policies
  WHERE tablename = 'user_app_roles'
    AND policyname = 'Users can view their own roles';

  IF policy_roles IS NULL THEN
    RAISE EXCEPTION 'Policy "Users can view their own roles" non trouvée !';
  END IF;

  IF NOT ('authenticated' = ANY(policy_roles)) THEN
    RAISE EXCEPTION 'Policy créée pour %, devrait être {authenticated}', policy_roles;
  END IF;

  RAISE NOTICE '✅ Policy correctement créée pour role {authenticated}';
  RAISE NOTICE '✅ Les utilisateurs authentifiés peuvent lire leurs rôles';
END $$;

-- ============================================================================
-- Migration: Fix RLS policy linkme_affiliates_staff_all (staff back-office)
-- Date: 2026-01-30
-- Problème: Policy utilise user_profiles.app qui N'EXISTE PAS
-- Solution: Remplacer par is_backoffice_user() helper function
-- Référence: .claude/rules/database/rls-patterns.md
-- ============================================================================

-- PROBLÈME IDENTIFIÉ :
-- Migration 20260111_013 ligne 51 utilise:
--   WHERE user_profiles.app = 'back-office'::app_type
-- Cette colonne N'EXISTE PAS dans user_profiles.
--
-- SOLUTION :
-- Utiliser is_backoffice_user() (défini dans migration 20260121_005)
-- qui vérifie user_app_roles.app = 'back-office' (table CORRECTE)
-- ============================================================================

-- 1. Supprimer policy incorrecte
DROP POLICY IF EXISTS "linkme_affiliates_staff_all" ON linkme_affiliates;

-- 2. Recréer policy CORRECTE pour staff back-office
CREATE POLICY "linkme_affiliates_staff_all"
  ON linkme_affiliates
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- Commentaire pour documentation
COMMENT ON POLICY "linkme_affiliates_staff_all" ON linkme_affiliates
  IS 'Staff back-office a accès complet à TOUS les affiliés LinkMe (is_backoffice_user)';

-- ============================================================================
-- VÉRIFICATION : linkme_affiliates doit avoir AU MOINS 3 policies
-- ============================================================================
-- 1. linkme_affiliates_own - Affiliés LinkMe voient leurs données
-- 2. linkme_affiliates_staff_all - Staff back-office voit tout (corrigée)
-- 3. linkme_affiliates_public_read - Lecture publique affiliés actifs
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_staff_policy_exists BOOLEAN;
BEGIN
  -- Compter policies totales
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'linkme_affiliates';

  -- Vérifier que policy staff existe avec is_backoffice_user()
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'linkme_affiliates'
      AND policyname = 'linkme_affiliates_staff_all'
  ) INTO v_staff_policy_exists;

  -- Logs de validation
  IF v_count >= 3 AND v_staff_policy_exists THEN
    RAISE NOTICE '✅ SUCCESS: linkme_affiliates has % policies (staff policy fixed)', v_count;
  ELSE
    RAISE WARNING '❌ PROBLEM: linkme_affiliates has only % policies or staff policy missing', v_count;
  END IF;
END $$;

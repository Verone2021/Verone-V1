-- ============================================================================
-- Migration: Fix RLS policies enseignes (staff back-office)
-- Date: 2026-02-03
-- Problème: Policies utilisent user_profiles.role qui N'EXISTE PAS
-- Solution: Remplacer par is_backoffice_user() helper function
-- Référence: .claude/rules/database/rls-patterns.md
-- Impact: Fix erreur 400 sur embedded relation organisations->enseignes
-- ============================================================================

-- PROBLÈME IDENTIFIÉ :
-- Les policies sur enseignes utilisent:
--   WHERE user_profiles.role = ANY (ARRAY['owner', 'admin'...])
-- Cette approche utilise user_profiles.role qui est obsolète.
--
-- IMPACT :
-- Quand organisations fait un embedded select vers enseignes:
--   organisations?select=...,enseigne:enseignes(legal_name)
-- PostgREST évalue les RLS sur les DEUX tables.
-- La policy enseignes échoue → 400 Bad Request
--
-- SOLUTION :
-- Utiliser is_backoffice_user() comme pour organisations
-- ============================================================================

-- Supprimer les 4 policies incorrectes
DROP POLICY IF EXISTS "enseignes_select_staff" ON enseignes;
DROP POLICY IF EXISTS "enseignes_insert_admin" ON enseignes;
DROP POLICY IF EXISTS "enseignes_update_admin" ON enseignes;
DROP POLICY IF EXISTS "enseignes_delete_owner" ON enseignes;

-- Créer policy SELECT pour staff back-office + affiliés LinkMe
CREATE POLICY "enseignes_select_all"
  ON enseignes
  FOR SELECT TO authenticated
  USING (
    -- Staff back-office voit tout
    is_backoffice_user()
    OR
    -- Affiliés LinkMe voient leur enseigne
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id = enseignes.id
    )
  );

-- Créer policy INSERT/UPDATE/DELETE pour staff uniquement
CREATE POLICY "enseignes_modify_staff"
  ON enseignes
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- Commentaires pour documentation
COMMENT ON POLICY "enseignes_select_all" ON enseignes
  IS 'Staff back-office + Affiliés LinkMe (leur enseigne uniquement)';

COMMENT ON POLICY "enseignes_modify_staff" ON enseignes
  IS 'Seul le staff back-office peut créer/modifier/supprimer des enseignes';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  v_select_exists BOOLEAN;
  v_modify_exists BOOLEAN;
BEGIN
  -- Vérifier policies existent
  SELECT
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'enseignes' AND policyname = 'enseignes_select_all'),
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'enseignes' AND policyname = 'enseignes_modify_staff')
  INTO v_select_exists, v_modify_exists;

  IF v_select_exists AND v_modify_exists THEN
    RAISE NOTICE '✅ SUCCESS: enseignes policies fixed (select + modify)';
  ELSE
    RAISE WARNING '❌ PROBLEM: enseignes policies missing (select=% modify=%)', v_select_exists, v_modify_exists;
  END IF;

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Migration 20260203_002 appliquée avec succès';
  RAISE NOTICE 'Fix: Erreur 400 sur embedded relation organisations->enseignes';
  RAISE NOTICE '====================================================';
END $$;

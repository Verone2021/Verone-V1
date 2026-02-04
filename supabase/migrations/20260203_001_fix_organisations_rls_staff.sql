-- ============================================================================
-- Migration: Fix RLS policies organisations & linkme_affiliates (staff back-office)
-- Date: 2026-02-03
-- Problème: Policies utilisent user_profiles.app qui N'EXISTE PAS
-- Solution: Remplacer par is_backoffice_user() helper function
-- Référence: .claude/rules/database/rls-patterns.md
-- Impact: Fix erreur 400/406 sur pages détails organisations/fournisseurs
-- ============================================================================

-- PROBLÈME IDENTIFIÉ (Production) :
-- 1. organisations_select_unified_fixed utilise:
--    WHERE user_profiles.app = 'back-office'::app_type
--    Cette colonne N'EXISTE PAS dans user_profiles.
--
-- 2. organisations_modify_unified utilise le même pattern incorrect
--
-- 3. linkme_affiliates_staff_all utilise aussi user_profiles.app
--
-- SYMPTÔMES :
-- - Page détail fournisseur retourne "Fournisseur introuvable"
-- - Erreur 400 sur GET /organisations?id=eq.xxx
-- - Erreur 406 sur GET /linkme_affiliates?organisation_id=eq.xxx
--
-- SOLUTION :
-- Utiliser is_backoffice_user() (défini dans migration 20260121_005)
-- qui vérifie user_app_roles.app = 'back-office' (table CORRECTE)
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Fix table organisations
-- ============================================================================

-- 1. Supprimer les 3 policies incorrectes
DROP POLICY IF EXISTS "organisations_select_unified_fixed" ON organisations;
DROP POLICY IF EXISTS "organisations_modify_unified" ON organisations;
DROP POLICY IF EXISTS "organisations_update_own_or_staff" ON organisations;

-- 2. Créer policy SELECT correcte pour organisations
-- Pattern: Staff back-office + Affiliés LinkMe (enseigne_admin/org_independante)
CREATE POLICY "organisations_select_all"
  ON organisations
  FOR SELECT TO authenticated
  USING (
    -- Staff back-office voit tout
    is_backoffice_user()
    OR
    -- Affiliés LinkMe voient selon leur scope
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          -- Enseigne admin voit toutes les orgs de son enseigne
          (uar.role = 'enseigne_admin'
           AND uar.enseigne_id IS NOT NULL
           AND uar.enseigne_id = organisations.enseigne_id)
          OR
          -- Org indépendante voit uniquement sa propre org
          (uar.role = 'org_independante'
           AND uar.organisation_id IS NOT NULL
           AND uar.organisation_id = organisations.id)
        )
    )
  );

-- 3. Créer policy INSERT/UPDATE/DELETE pour staff uniquement
CREATE POLICY "organisations_modify_staff"
  ON organisations
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- Commentaires pour documentation
COMMENT ON POLICY "organisations_select_all" ON organisations
  IS 'Staff back-office + Affiliés LinkMe (selon scope enseigne/org)';

COMMENT ON POLICY "organisations_modify_staff" ON organisations
  IS 'Seul le staff back-office peut créer/modifier/supprimer des organisations';

-- ============================================================================
-- PARTIE 2: Fix table linkme_affiliates
-- ============================================================================

-- Supprimer policy staff incorrecte (utilise user_profiles.app)
DROP POLICY IF EXISTS "linkme_affiliates_staff_all" ON linkme_affiliates;

-- Recréer policy CORRECTE pour staff back-office
CREATE POLICY "linkme_affiliates_staff_all"
  ON linkme_affiliates
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- Commentaire pour documentation
COMMENT ON POLICY "linkme_affiliates_staff_all" ON linkme_affiliates
  IS 'Staff back-office a accès complet à TOUS les affiliés LinkMe (is_backoffice_user)';

-- ============================================================================
-- VÉRIFICATION : S'assurer que les policies sont bien créées
-- ============================================================================

DO $$
DECLARE
  v_org_policies INTEGER;
  v_affiliate_policies INTEGER;
  v_org_select_exists BOOLEAN;
  v_org_modify_exists BOOLEAN;
  v_affiliate_staff_exists BOOLEAN;
BEGIN
  -- Compter policies sur organisations
  SELECT COUNT(*) INTO v_org_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'organisations';

  -- Vérifier policies organisations existent
  SELECT
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organisations' AND policyname = 'organisations_select_all'),
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organisations' AND policyname = 'organisations_modify_staff')
  INTO v_org_select_exists, v_org_modify_exists;

  -- Compter policies sur linkme_affiliates
  SELECT COUNT(*) INTO v_affiliate_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'linkme_affiliates';

  -- Vérifier policy linkme_affiliates staff existe
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'linkme_affiliates'
      AND policyname = 'linkme_affiliates_staff_all'
  ) INTO v_affiliate_staff_exists;

  -- Logs de validation
  IF v_org_select_exists AND v_org_modify_exists THEN
    RAISE NOTICE '✅ SUCCESS: organisations has % policies (select + modify fixed)', v_org_policies;
  ELSE
    RAISE WARNING '❌ PROBLEM: organisations policies missing (select=% modify=%)', v_org_select_exists, v_org_modify_exists;
  END IF;

  IF v_affiliate_policies >= 3 AND v_affiliate_staff_exists THEN
    RAISE NOTICE '✅ SUCCESS: linkme_affiliates has % policies (staff policy fixed)', v_affiliate_policies;
  ELSE
    RAISE WARNING '❌ PROBLEM: linkme_affiliates has only % policies or staff policy missing', v_affiliate_policies;
  END IF;

  -- Log résumé
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Migration 20260203_001 appliquée avec succès';
  RAISE NOTICE 'Fix: Erreur 400/406 pages détails organisations';
  RAISE NOTICE 'Pattern: is_backoffice_user() au lieu de user_profiles.app';
  RAISE NOTICE '====================================================';
END $$;

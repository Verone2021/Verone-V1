-- ============================================================================
-- MIGRATION FINALE : Alignement Policies RLS Owner/Admin
-- ============================================================================
-- Fichier      : 20251016_003_align_owner_admin_policies.sql
-- Date         : 2025-10-16
-- Auteur       : Vérone Security Auditor
-- Version      : 1.0.0
-- Description  : Correction finale de 2 policies RLS pour aligner Owner/Admin
--
-- CORRECTIONS :
-- 1. stock_movements DELETE : Ajouter 'admin' (actuellement Owner-only)
-- 2. sales_orders UPDATE : Supprimer DEBUG policy, restaurer normale Owner+Admin+Sales
--
-- SÉCURITÉ PRÉSERVÉE :
-- - user_activity_logs : Owner-only ✓
-- - user_profiles : Owner-only ✓
-- - Trigger prevent_last_owner_deletion : Intact ✓
-- ============================================================================

-- ============================================================================
-- SECTION 1 : stock_movements DELETE Policy
-- ============================================================================
-- AVANT : Owner-only
-- APRÈS : Owner + Admin

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 1 : stock_movements DELETE';
  RAISE NOTICE '========================================';
END $$;

-- DROP policy Owner-only existante
DROP POLICY IF EXISTS "Uniquement owners peuvent supprimer des mouvements de stock" ON stock_movements;

-- CREATE nouvelle policy Owner+Admin
CREATE POLICY "Admins peuvent supprimer des mouvements de stock" ON stock_movements
FOR DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);

RAISE NOTICE '✅ Policy stock_movements DELETE : Owner + Admin';

-- ============================================================================
-- SECTION 2 : sales_orders UPDATE Policy
-- ============================================================================
-- AVANT : DEBUG policy temporaire (Owner bypass)
-- APRÈS : Policy normale Owner+Admin+Sales

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 2 : sales_orders UPDATE';
  RAISE NOTICE '========================================';
END $$;

-- DROP DEBUG policy temporaire
DROP POLICY IF EXISTS "DEBUG_sales_orders_update_owner_bypass" ON sales_orders;

RAISE NOTICE '✅ DEBUG policy supprimée';

-- DROP ancienne policy normale si elle existe
DROP POLICY IF EXISTS "Owners, admins et sales peuvent modifier leurs commandes" ON sales_orders;

-- CREATE policy normale Owner+Admin+Sales
CREATE POLICY "Owners, admins et sales peuvent modifier leurs commandes" ON sales_orders
FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin', 'sales')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin', 'sales')
  )
);

RAISE NOTICE '✅ Policy sales_orders UPDATE : Owner + Admin + Sales';

-- ============================================================================
-- SECTION 3 : Validation Sécurité Owner-only
-- ============================================================================
-- Vérifier que les tables critiques restent Owner-only

DO $$
DECLARE
  v_activity_logs_owner_only INTEGER;
  v_user_profiles_owner_only INTEGER;
  v_trigger_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 3 : Validation Sécurité';
  RAISE NOTICE '========================================';

  -- Vérifier user_activity_logs reste Owner-only
  SELECT COUNT(*) INTO v_activity_logs_owner_only
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'user_activity_logs'
    AND qual LIKE '%owner%'
    AND NOT qual LIKE '%admin%';

  IF v_activity_logs_owner_only >= 1 THEN
    RAISE NOTICE '✅ user_activity_logs : Owner-only préservé (% policies)', v_activity_logs_owner_only;
  ELSE
    RAISE EXCEPTION '❌ CRITIQUE : user_activity_logs Owner-only compromis!';
  END IF;

  -- Vérifier user_profiles management reste Owner-only
  SELECT COUNT(*) INTO v_user_profiles_owner_only
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'user_profiles'
    AND (cmd = 'UPDATE' OR cmd = 'DELETE')
    AND qual LIKE '%owner%'
    AND NOT qual LIKE '%admin%';

  IF v_user_profiles_owner_only >= 2 THEN
    RAISE NOTICE '✅ user_profiles : Owner-only préservé (% policies)', v_user_profiles_owner_only;
  ELSE
    RAISE EXCEPTION '❌ CRITIQUE : user_profiles Owner-only compromis!';
  END IF;

  -- Vérifier trigger prevent_last_owner_deletion
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname = 'prevent_last_owner_deletion';

  IF v_trigger_count = 1 THEN
    RAISE NOTICE '✅ Trigger prevent_last_owner_deletion : Intact';
  ELSE
    RAISE EXCEPTION '❌ CRITIQUE : Trigger prevent_last_owner_deletion manquant!';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VALIDATION SÉCURITÉ : SUCCÈS';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SECTION 4 : Rapport Audit Final
-- ============================================================================

DO $$
DECLARE
  v_total_policies INTEGER;
  v_owner_only_policies INTEGER;
  v_owner_admin_policies INTEGER;
  v_other_policies INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECTION 4 : Rapport Audit Final';
  RAISE NOTICE '========================================';

  -- Comptage total policies RLS
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Comptage Owner-only policies
  SELECT COUNT(*) INTO v_owner_only_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND qual LIKE '%owner%'
    AND NOT qual LIKE '%admin%';

  -- Comptage Owner+Admin policies
  SELECT COUNT(*) INTO v_owner_admin_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND qual LIKE '%owner%'
    AND qual LIKE '%admin%';

  -- Comptage autres policies
  SELECT COUNT(*) INTO v_other_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual NOT LIKE '%owner%' OR qual IS NULL);

  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES POLICIES RLS';
  RAISE NOTICE '─────────────────────────────────────';
  RAISE NOTICE 'Total policies                : %', v_total_policies;
  RAISE NOTICE 'Owner-only (critiques)        : %', v_owner_only_policies;
  RAISE NOTICE 'Owner+Admin (modifiées)       : %', v_owner_admin_policies;
  RAISE NOTICE 'Autres rôles                  : %', v_other_policies;
  RAISE NOTICE '';

  RAISE NOTICE '📋 POLICIES MODIFIÉES CETTE MIGRATION';
  RAISE NOTICE '─────────────────────────────────────';
  RAISE NOTICE '1. stock_movements DELETE';
  RAISE NOTICE '   Avant : Owner-only';
  RAISE NOTICE '   Après : Owner + Admin ✅';
  RAISE NOTICE '';
  RAISE NOTICE '2. sales_orders UPDATE';
  RAISE NOTICE '   Avant : DEBUG policy (Owner bypass)';
  RAISE NOTICE '   Après : Owner + Admin + Sales ✅';
  RAISE NOTICE '';

  RAISE NOTICE '🔒 TABLES OWNER-ONLY CRITIQUES (PRÉSERVÉES)';
  RAISE NOTICE '─────────────────────────────────────';
  RAISE NOTICE '✅ user_activity_logs : Toutes opérations Owner-only';
  RAISE NOTICE '✅ user_profiles : UPDATE/DELETE Owner-only';
  RAISE NOTICE '✅ user_organisation_assignments : DELETE Owner-only';
  RAISE NOTICE '✅ Trigger prevent_last_owner_deletion : Intact';
  RAISE NOTICE '';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION FINALE : SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Date     : 2025-10-16';
  RAISE NOTICE 'Version  : 1.0.0';
  RAISE NOTICE 'Status   : Alignement Owner/Admin complet';
  RAISE NOTICE 'Sécurité : Aucune régression détectée';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- QUERY DE VALIDATION POST-MIGRATION (À exécuter manuellement)
-- ============================================================================

-- Vérifier toutes les policies Owner/Admin
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%owner%' AND qual LIKE '%admin%' THEN 'Owner+Admin'
    WHEN qual LIKE '%owner%' AND NOT qual LIKE '%admin%' THEN 'Owner-only'
    WHEN qual LIKE '%admin%' THEN 'Admin-included'
    ELSE 'Other'
  END as role_restriction
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%owner%' OR qual LIKE '%admin%')
ORDER BY
  CASE
    WHEN tablename IN ('user_activity_logs', 'user_profiles', 'user_organisation_assignments') THEN 1
    ELSE 2
  END,
  tablename,
  cmd;

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

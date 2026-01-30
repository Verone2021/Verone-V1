-- ============================================================================
-- Migration: Fix RLS policies expenses (staff back-office)
-- Date: 2026-01-30
-- Problème: Fonction is_admin() locale utilise raw_user_meta_data (obsolète)
--           et entre en conflit avec is_back_office_admin() (standard)
-- Solution: Supprimer is_admin() locale, utiliser is_backoffice_user() standard
-- Référence: .claude/rules/database/rls-patterns.md
-- ============================================================================

-- PROBLÈME IDENTIFIÉ :
-- Migration 20251223_100 crée fonction locale is_admin() qui:
--   1. Utilise raw_user_meta_data->>'role' = 'admin' (pattern obsolète)
--   2. Entre en conflit avec is_back_office_admin() (fonction standard)
--   3. Vérifie uniquement 'admin' (ne couvre pas 'owner', 'partner_manager')
--
-- SOLUTION :
-- 1. Supprimer fonction is_admin() locale (conflit + obsolète)
-- 2. Utiliser is_backoffice_user() (fonction standard, couvre TOUS les rôles staff)
-- ============================================================================

-- 1. Supprimer fonction is_admin() locale (obsolète)
DROP FUNCTION IF EXISTS is_admin();

-- ============================================================================
-- FIX counterparties
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access counterparties" ON counterparties;

CREATE POLICY "staff_full_access_counterparties"
  ON counterparties
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "staff_full_access_counterparties" ON counterparties
  IS 'Staff back-office a accès complet à TOUS les counterparties (is_backoffice_user)';

-- ============================================================================
-- FIX counterparty_bank_accounts
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access counterparty_bank_accounts" ON counterparty_bank_accounts;

CREATE POLICY "staff_full_access_counterparty_bank_accounts"
  ON counterparty_bank_accounts
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "staff_full_access_counterparty_bank_accounts" ON counterparty_bank_accounts
  IS 'Staff back-office a accès complet à TOUS les comptes bancaires counterparty (is_backoffice_user)';

-- ============================================================================
-- FIX expenses
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access expenses" ON expenses;

CREATE POLICY "staff_full_access_expenses"
  ON expenses
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "staff_full_access_expenses" ON expenses
  IS 'Staff back-office a accès complet à TOUTES les expenses (is_backoffice_user)';

-- ============================================================================
-- FIX matching_rules
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access matching_rules" ON matching_rules;

CREATE POLICY "staff_full_access_matching_rules"
  ON matching_rules
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "staff_full_access_matching_rules" ON matching_rules
  IS 'Staff back-office a accès complet à TOUTES les matching rules (is_backoffice_user)';

-- ============================================================================
-- VÉRIFICATION : Chaque table doit avoir AU MOINS 1 policy staff
-- ============================================================================
-- counterparties, counterparty_bank_accounts, expenses, matching_rules
-- ============================================================================

DO $$
DECLARE
  v_counterparties_count INTEGER;
  v_accounts_count INTEGER;
  v_expenses_count INTEGER;
  v_rules_count INTEGER;
  v_all_staff_exist BOOLEAN;
  v_is_admin_exists BOOLEAN;
BEGIN
  -- Compter policies par table
  SELECT COUNT(*) INTO v_counterparties_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'counterparties';

  SELECT COUNT(*) INTO v_accounts_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'counterparty_bank_accounts';

  SELECT COUNT(*) INTO v_expenses_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'expenses';

  SELECT COUNT(*) INTO v_rules_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'matching_rules';

  -- Vérifier que TOUTES les policies staff existent
  SELECT (
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'counterparties'
        AND policyname = 'staff_full_access_counterparties'
    )
    AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'counterparty_bank_accounts'
        AND policyname = 'staff_full_access_counterparty_bank_accounts'
    )
    AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'expenses'
        AND policyname = 'staff_full_access_expenses'
    )
    AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'matching_rules'
        AND policyname = 'staff_full_access_matching_rules'
    )
  ) INTO v_all_staff_exist;

  -- Vérifier que fonction is_admin() locale a bien été supprimée
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_admin'
      AND pg_get_function_result(oid) = 'boolean'
  ) INTO v_is_admin_exists;

  -- Logs de validation
  IF v_all_staff_exist AND NOT v_is_admin_exists THEN
    RAISE NOTICE '✅ SUCCESS: All 4 expense tables have correct staff policies';
    RAISE NOTICE '  - counterparties: % policies', v_counterparties_count;
    RAISE NOTICE '  - counterparty_bank_accounts: % policies', v_accounts_count;
    RAISE NOTICE '  - expenses: % policies', v_expenses_count;
    RAISE NOTICE '  - matching_rules: % policies', v_rules_count;
    RAISE NOTICE '  - is_admin() locale supprimée: ✅';
  ELSE
    RAISE WARNING '❌ PROBLEM: Some expense tables missing policies or is_admin() still exists';
    RAISE WARNING '  - counterparties: % policies', v_counterparties_count;
    RAISE WARNING '  - counterparty_bank_accounts: % policies', v_accounts_count;
    RAISE WARNING '  - expenses: % policies', v_expenses_count;
    RAISE WARNING '  - matching_rules: % policies', v_rules_count;
    IF v_is_admin_exists THEN
      RAISE WARNING '  - is_admin() locale existe encore: ❌';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Migration: Fix RLS policies linkme_selections + linkme_selection_items (staff)
-- Date: 2026-01-30
-- Problème: Policies utilisent raw_user_meta_data->>'role' (pattern obsolète)
-- Solution: Remplacer par is_backoffice_user() helper function
-- Référence: .claude/rules/database/rls-patterns.md
-- ============================================================================

-- PROBLÈME IDENTIFIÉ :
-- Migration 20251205_002 utilise (4 occurrences):
--   WHERE u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
-- Ce pattern est OBSOLÈTE et FRAGILE (non standard, dépend de JWT).
--
-- SOLUTION :
-- Utiliser is_backoffice_user() (défini dans migration 20260121_005)
-- qui est le pattern standard pour vérifier si user est staff back-office.
-- ============================================================================

-- ============================================================================
-- FIX linkme_selections
-- ============================================================================

-- 1. Supprimer policy staff incorrecte
DROP POLICY IF EXISTS "linkme_selections_staff_all" ON linkme_selections;

-- 2. Recréer policy CORRECTE pour staff back-office
CREATE POLICY "linkme_selections_staff_all"
  ON linkme_selections
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "linkme_selections_staff_all" ON linkme_selections
  IS 'Staff back-office a accès complet à TOUTES les sélections LinkMe (is_backoffice_user)';

-- ============================================================================
-- FIX linkme_selection_items
-- ============================================================================

-- 3. Supprimer policy staff incorrecte
DROP POLICY IF EXISTS "linkme_selection_items_staff_all" ON linkme_selection_items;

-- 4. Recréer policy CORRECTE pour staff back-office
CREATE POLICY "linkme_selection_items_staff_all"
  ON linkme_selection_items
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "linkme_selection_items_staff_all" ON linkme_selection_items
  IS 'Staff back-office a accès complet à TOUS les items de sélection LinkMe (is_backoffice_user)';

-- ============================================================================
-- VÉRIFICATION : Chaque table doit avoir AU MOINS 5 policies
-- ============================================================================
-- linkme_selections:
--   1. linkme_selections_staff_all (corrigée)
--   2. linkme_selections_affiliate_select
--   3. linkme_selections_affiliate_insert
--   4. linkme_selections_affiliate_update
--   5. linkme_selections_affiliate_delete
--   6. linkme_selections_public_read
--
-- linkme_selection_items:
--   1. linkme_selection_items_staff_all (corrigée)
--   2. linkme_selection_items_affiliate_select
--   3. linkme_selection_items_affiliate_insert
--   4. linkme_selection_items_affiliate_update
--   5. linkme_selection_items_affiliate_delete
--   6. linkme_selection_items_public_read
-- ============================================================================

DO $$
DECLARE
  v_selections_count INTEGER;
  v_items_count INTEGER;
  v_selections_staff_exists BOOLEAN;
  v_items_staff_exists BOOLEAN;
BEGIN
  -- Compter policies linkme_selections
  SELECT COUNT(*) INTO v_selections_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'linkme_selections';

  -- Compter policies linkme_selection_items
  SELECT COUNT(*) INTO v_items_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'linkme_selection_items';

  -- Vérifier que policies staff existent
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'linkme_selections'
      AND policyname = 'linkme_selections_staff_all'
  ) INTO v_selections_staff_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'linkme_selection_items'
      AND policyname = 'linkme_selection_items_staff_all'
  ) INTO v_items_staff_exists;

  -- Logs de validation
  IF v_selections_count >= 5 AND v_selections_staff_exists THEN
    RAISE NOTICE '✅ SUCCESS: linkme_selections has % policies (staff policy fixed)', v_selections_count;
  ELSE
    RAISE WARNING '❌ PROBLEM: linkme_selections has only % policies or staff policy missing', v_selections_count;
  END IF;

  IF v_items_count >= 5 AND v_items_staff_exists THEN
    RAISE NOTICE '✅ SUCCESS: linkme_selection_items has % policies (staff policy fixed)', v_items_count;
  ELSE
    RAISE WARNING '❌ PROBLEM: linkme_selection_items has only % policies or staff policy missing', v_items_count;
  END IF;
END $$;

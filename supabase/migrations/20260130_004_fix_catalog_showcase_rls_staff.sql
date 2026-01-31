-- ============================================================================
-- Migration: Fix RLS policies linkme_catalog_* (staff back-office)
-- Date: 2026-01-30
-- Problème: Policies utilisent raw_user_meta_data->>'role' (pattern obsolète)
-- Solution: Remplacer par is_backoffice_user() helper function
-- Référence: .claude/rules/database/rls-patterns.md
-- ============================================================================

-- PROBLÈME IDENTIFIÉ :
-- Migration 20251130_001 utilise (3 occurrences):
--   WHERE u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
-- Ce pattern est OBSOLÈTE et FRAGILE (non standard, dépend de JWT).
--
-- SOLUTION :
-- Utiliser is_backoffice_user() (défini dans migration 20260121_005)
-- qui est le pattern standard pour vérifier si user est staff back-office.
-- ============================================================================

-- ============================================================================
-- FIX linkme_catalog_products
-- ============================================================================

DROP POLICY IF EXISTS "linkme_catalog_products_staff_all" ON linkme_catalog_products;

CREATE POLICY "linkme_catalog_products_staff_all"
  ON linkme_catalog_products
  FOR ALL TO authenticated
  USING (is_backoffice_user());

COMMENT ON POLICY "linkme_catalog_products_staff_all" ON linkme_catalog_products
  IS 'Staff back-office a accès complet à TOUS les produits catalogue LinkMe (is_backoffice_user)';

-- ============================================================================
-- FIX linkme_showcase_collections
-- ============================================================================

DROP POLICY IF EXISTS "linkme_showcase_collections_staff_all" ON linkme_showcase_collections;

CREATE POLICY "linkme_showcase_collections_staff_all"
  ON linkme_showcase_collections
  FOR ALL TO authenticated
  USING (is_backoffice_user());

COMMENT ON POLICY "linkme_showcase_collections_staff_all" ON linkme_showcase_collections
  IS 'Staff back-office a accès complet à TOUTES les collections showcase LinkMe (is_backoffice_user)';

-- ============================================================================
-- FIX linkme_showcase_collection_items
-- ============================================================================

DROP POLICY IF EXISTS "linkme_showcase_collection_items_staff_all" ON linkme_showcase_collection_items;

CREATE POLICY "linkme_showcase_collection_items_staff_all"
  ON linkme_showcase_collection_items
  FOR ALL TO authenticated
  USING (is_backoffice_user());

COMMENT ON POLICY "linkme_showcase_collection_items_staff_all" ON linkme_showcase_collection_items
  IS 'Staff back-office a accès complet à TOUS les items de collection showcase (is_backoffice_user)';

-- ============================================================================
-- VÉRIFICATION : Chaque table doit avoir AU MOINS 2 policies
-- ============================================================================
-- linkme_catalog_products:
--   1. linkme_catalog_products_staff_all (corrigée)
--   2. linkme_catalog_products_public_read
--   3. linkme_catalog_products_anon_read
--
-- linkme_showcase_collections:
--   1. linkme_showcase_collections_staff_all (corrigée)
--   2. linkme_showcase_collections_public_read
--
-- linkme_showcase_collection_items:
--   1. linkme_showcase_collection_items_staff_all (corrigée)
--   2. linkme_showcase_collection_items_public_read
-- ============================================================================

DO $$
DECLARE
  v_catalog_count INTEGER;
  v_collections_count INTEGER;
  v_items_count INTEGER;
  v_all_staff_exist BOOLEAN;
BEGIN
  -- Compter policies par table
  SELECT COUNT(*) INTO v_catalog_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'linkme_catalog_products';

  SELECT COUNT(*) INTO v_collections_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'linkme_showcase_collections';

  SELECT COUNT(*) INTO v_items_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'linkme_showcase_collection_items';

  -- Vérifier que TOUTES les policies staff existent
  SELECT (
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'linkme_catalog_products'
        AND policyname = 'linkme_catalog_products_staff_all'
    )
    AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'linkme_showcase_collections'
        AND policyname = 'linkme_showcase_collections_staff_all'
    )
    AND EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'linkme_showcase_collection_items'
        AND policyname = 'linkme_showcase_collection_items_staff_all'
    )
  ) INTO v_all_staff_exist;

  -- Logs de validation
  IF v_catalog_count >= 2 AND v_collections_count >= 2 AND v_items_count >= 2 AND v_all_staff_exist THEN
    RAISE NOTICE '✅ SUCCESS: All 3 catalog/showcase tables have correct staff policies';
    RAISE NOTICE '  - linkme_catalog_products: % policies', v_catalog_count;
    RAISE NOTICE '  - linkme_showcase_collections: % policies', v_collections_count;
    RAISE NOTICE '  - linkme_showcase_collection_items: % policies', v_items_count;
  ELSE
    RAISE WARNING '❌ PROBLEM: Some catalog/showcase tables missing policies or staff policies';
    RAISE WARNING '  - linkme_catalog_products: % policies', v_catalog_count;
    RAISE WARNING '  - linkme_showcase_collections: % policies', v_collections_count;
    RAISE WARNING '  - linkme_showcase_collection_items: % policies', v_items_count;
  END IF;
END $$;

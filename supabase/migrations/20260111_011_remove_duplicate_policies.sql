-- ============================================================================
-- Migration: Remove Duplicate RLS Policies
-- Date: 2026-01-11
--
-- This migration removes 8 duplicate/vestigial RLS policies:
--
-- TIER 1A - EXACT DUPLICATES (stock_reservations):
--   4 policies with identical logic (same role + qual=true)
--
-- TIER 1B - TESTING VESTIGES:
--   4 policies (*_anonymous_testing) that were leftover from development
--   LinkMe public pages use RPC SECURITY DEFINER functions, not direct table access
--
-- NO ACCESS LOGIC CHANGE - all removed policies were redundant
-- ============================================================================

-- TIER 1A: stock_reservations duplicates (4 policies)
-- These are exact duplicates of *_authenticated policies
DROP POLICY IF EXISTS "stock_reservations_authenticated_delete" ON stock_reservations;
DROP POLICY IF EXISTS "stock_reservations_authenticated_insert" ON stock_reservations;
DROP POLICY IF EXISTS "stock_reservations_authenticated_select" ON stock_reservations;
DROP POLICY IF EXISTS "stock_reservations_authenticated_update" ON stock_reservations;

-- TIER 1B: Testing vestiges (4 policies)
-- These were for development testing and are not used by LinkMe public pages
-- (LinkMe uses RPC functions with SECURITY DEFINER that bypass RLS)
DROP POLICY IF EXISTS "product_images_select_anonymous_testing" ON product_images;
DROP POLICY IF EXISTS "product_groups_select_anonymous_testing" ON product_groups;
DROP POLICY IF EXISTS "product_group_members_select_anonymous_testing" ON product_group_members;
DROP POLICY IF EXISTS "variant_groups_select_anonymous_testing" ON variant_groups;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND policyname IN (
    'stock_reservations_authenticated_delete',
    'stock_reservations_authenticated_insert',
    'stock_reservations_authenticated_select',
    'stock_reservations_authenticated_update',
    'product_images_select_anonymous_testing',
    'product_groups_select_anonymous_testing',
    'product_group_members_select_anonymous_testing',
    'variant_groups_select_anonymous_testing'
  );

  IF v_count = 0 THEN
    RAISE NOTICE 'SUCCESS: 8 duplicate/vestigial policies removed';
  ELSE
    RAISE WARNING 'Some policies may not have been dropped: % remaining', v_count;
  END IF;
END $$;

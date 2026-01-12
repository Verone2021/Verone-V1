-- ============================================
-- Migration: Optimize Performance Advisor Warnings
-- Date: 2026-01-11
-- Description:
--   Phase 1.1: Remove duplicate BRIN index
--   Phase 1.2: Optimize helper functions with (SELECT auth.uid())
--   Phase 2.1: Consolidate linkme_selections policies
-- ============================================

-- ============================================
-- Phase 1.1: Remove duplicate BRIN index
-- Both indexes are identical: BRIN on created_at
-- ============================================
DROP INDEX IF EXISTS idx_price_list_items_created_brin;

-- ============================================
-- Phase 1.2: Optimize helper functions
-- Problem: auth.uid() without SELECT wrapper causes re-evaluation per row
-- Solution: Use (SELECT auth.uid()) for single evaluation
-- ============================================

-- 1. get_user_role()
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role_type
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role_type;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE user_id = (SELECT auth.uid());

  RETURN user_role;
END;
$$;

-- 2. is_customer_user()
CREATE OR REPLACE FUNCTION public.is_customer_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role = 'customer'
    FROM user_profiles
    WHERE user_id = (SELECT auth.uid())
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 3. get_user_organisation_id()
CREATE OR REPLACE FUNCTION public.get_user_organisation_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organisation_id INTO org_id
  FROM public.user_profiles
  WHERE user_id = (SELECT auth.uid());

  RETURN org_id;
END;
$$;

-- ============================================
-- Phase 2.1: Consolidate linkme_selections policies
-- Keep: _affiliate_own (ALL), _public_read (SELECT), _staff_all (ALL)
-- Remove: _affiliate_delete, _affiliate_insert, _affiliate_select, _affiliate_update
-- Reason: _affiliate_own with ALL covers all CRUD operations
-- ============================================
DROP POLICY IF EXISTS "linkme_selections_affiliate_delete" ON linkme_selections;
DROP POLICY IF EXISTS "linkme_selections_affiliate_insert" ON linkme_selections;
DROP POLICY IF EXISTS "linkme_selections_affiliate_select" ON linkme_selections;
DROP POLICY IF EXISTS "linkme_selections_affiliate_update" ON linkme_selections;

-- ============================================
-- Verification: List remaining policies on linkme_selections
-- Expected: 3 policies (_affiliate_own, _public_read, _staff_all)
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'linkme_selections' AND schemaname = 'public';

  RAISE NOTICE 'linkme_selections now has % policies', policy_count;
END;
$$;

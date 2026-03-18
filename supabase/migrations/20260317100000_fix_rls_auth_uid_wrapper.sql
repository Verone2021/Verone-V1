-- Migration: Fix RLS auth.uid() missing wrapper (SELECT auth.uid())
-- Scope: user_profiles, stock_movements
-- Problem: auth.uid() without wrapper is evaluated N times (once per row)
--          causing 32M+ seq_scans on user_profiles and 6.3M+ on stock_movements
-- Fix: wrap auth.uid() in (SELECT auth.uid()) so it's evaluated ONCE
-- Ref: .claude/rules/database/rls-patterns.md

-- ============================================================
-- TABLE: user_profiles
-- Policy: users_own_user_profiles
-- Before: (user_id = auth.uid())
-- After:  (user_id = (SELECT auth.uid()))
-- ============================================================
DROP POLICY IF EXISTS "users_own_user_profiles" ON "public"."user_profiles";

CREATE POLICY "users_own_user_profiles" ON "public"."user_profiles"
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- TABLE: stock_movements
-- Policy: users_own_stock_movements
-- Before: (performed_by = auth.uid())
-- After:  (performed_by = (SELECT auth.uid()))
-- ============================================================
DROP POLICY IF EXISTS "users_own_stock_movements" ON "public"."stock_movements";

CREATE POLICY "users_own_stock_movements" ON "public"."stock_movements"
  FOR ALL
  TO authenticated
  USING (performed_by = (SELECT auth.uid()))
  WITH CHECK (performed_by = (SELECT auth.uid()));

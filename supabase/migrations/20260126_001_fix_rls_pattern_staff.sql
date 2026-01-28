-- ============================================================================
-- Migration: Fix RLS policies to use established helper functions
-- Date: 2026-01-26
-- Description: Corriger les politiques créées par 20260125_002 qui utilisent
--              user_profiles.role au lieu du pattern helper établi
--
-- Contexte:
--   La migration 20260125_002 a créé des politiques avec:
--     EXISTS (SELECT 1 FROM user_profiles up WHERE up.role IN (...))
--
--   Cela viole le pattern établi par 20260121_005:
--     is_backoffice_user() - fonction SECURITY DEFINER avec SET row_security = off
--
-- Tables affectées:
--   - sales_orders
--   - sales_order_items
--   - sales_order_linkme_details
-- ============================================================================

-- ============================================
-- 1. sales_orders - Corriger politique staff
-- ============================================

DROP POLICY IF EXISTS "Staff can view all sales_orders" ON sales_orders;

CREATE POLICY "Staff can view all sales_orders" ON sales_orders
  FOR SELECT
  USING (is_backoffice_user());

-- Note: La politique "LinkMe affiliates can view their orders" reste inchangée
-- car elle utilise correctement user_app_roles

-- ============================================
-- 2. sales_order_items - Corriger politique staff
-- ============================================

DROP POLICY IF EXISTS "Staff can view all sales_order_items" ON sales_order_items;

CREATE POLICY "Staff can view all sales_order_items" ON sales_order_items
  FOR SELECT
  USING (is_backoffice_user());

-- Note: La politique "LinkMe affiliates can view their order items" reste inchangée

-- ============================================
-- 3. sales_order_linkme_details - Corriger politique staff
-- ============================================

DROP POLICY IF EXISTS "Staff can view sales_order_linkme_details" ON sales_order_linkme_details;

CREATE POLICY "Staff can view sales_order_linkme_details" ON sales_order_linkme_details
  FOR SELECT
  USING (is_backoffice_user());

-- Note: La politique "LinkMe affiliates can view their linkme details" reste inchangée

-- ============================================
-- Vérification
-- ============================================

SELECT 'Migration 20260126_001_fix_rls_pattern_staff applied successfully' AS status;

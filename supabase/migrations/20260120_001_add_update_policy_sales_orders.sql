-- ============================================================================
-- Migration: Add UPDATE policy for sales_orders
-- Date: 2026-01-20
-- Description: Enforce admin-only UPDATE access to sales_orders
--              Prevents non-admin users from bypassing pending_admin_validation
-- ============================================================================

-- 1. Policy UPDATE pour sales_orders
-- Seuls les staff back-office peuvent mettre à jour les commandes
CREATE POLICY "Staff can update sales_orders" ON sales_orders
  FOR UPDATE
  TO authenticated
  USING (
    -- L'utilisateur doit être staff back-office
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager')
    )
  )
  WITH CHECK (
    -- Même condition pour le WITH CHECK
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager')
    )
  );

COMMENT ON POLICY "Staff can update sales_orders" ON sales_orders IS
  'Seuls les staff back-office peuvent mettre à jour les commandes. Empêche bypass de pending_admin_validation par users non-admin.';

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
-- DROP POLICY IF EXISTS "Staff can update sales_orders" ON sales_orders;

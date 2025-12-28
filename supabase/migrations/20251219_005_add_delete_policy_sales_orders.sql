-- =====================================================
-- MIGRATION: Add DELETE policy for sales_orders
-- Date: 2025-12-19
-- Issue: Impossible de supprimer les commandes annulees
-- Cause: Aucune politique RLS DELETE n'existait
-- =====================================================

-- 1. Policy DELETE pour sales_orders
-- Permet au staff back-office de supprimer les commandes annulees
DROP POLICY IF EXISTS "Staff can delete sales_orders" ON sales_orders;
CREATE POLICY "Staff can delete sales_orders" ON sales_orders
  FOR DELETE
  TO authenticated
  USING (
    -- L'utilisateur doit etre staff back-office
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager')
    )
    -- Et la commande doit etre annulee
    AND status = 'cancelled'
  );

COMMENT ON POLICY "Staff can delete sales_orders" ON sales_orders IS
  'Staff back-office peut supprimer uniquement les commandes annulees';

-- 2. Policy DELETE pour sales_order_items
-- Cascade avec la commande parente
DROP POLICY IF EXISTS "Staff can delete sales_order_items" ON sales_order_items;
CREATE POLICY "Staff can delete sales_order_items" ON sales_order_items
  FOR DELETE
  TO authenticated
  USING (
    -- L'utilisateur doit etre staff back-office
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager')
    )
    -- Et la commande parente doit etre annulee
    AND EXISTS (
      SELECT 1 FROM sales_orders
      WHERE id = sales_order_items.sales_order_id
      AND status = 'cancelled'
    )
  );

COMMENT ON POLICY "Staff can delete sales_order_items" ON sales_order_items IS
  'Staff back-office peut supprimer les items des commandes annulees';

-- =====================================================
-- ROLLBACK (si necessaire)
-- =====================================================
-- DROP POLICY IF EXISTS "Staff can delete sales_orders" ON sales_orders;
-- DROP POLICY IF EXISTS "Staff can delete sales_order_items" ON sales_order_items;

-- =====================================================
-- MIGRATION: Fix RLS circular dependency
-- Date: 2025-12-07
-- Issue: RLS error 42501 due to circular dependency
-- Root cause: Policies SELECT user_profiles → user_profiles RLS → get_user_role() → SELECT user_profiles
-- Solution: Create SECURITY DEFINER function to bypass RLS when checking staff role
-- =====================================================

-- 1. Créer une fonction qui vérifie si l'utilisateur courant est staff
-- SECURITY DEFINER + row_security = off pour éviter la dépendance circulaire
CREATE OR REPLACE FUNCTION is_staff_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET row_security = off
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager')
  );
$$;

COMMENT ON FUNCTION is_staff_user IS 'Vérifie si utilisateur courant est staff. SECURITY DEFINER + row_security=off pour éviter dépendance circulaire RLS.';

-- 2. Mettre à jour la policy INSERT sur sales_orders pour utiliser is_staff_user()
DROP POLICY IF EXISTS "Staff can create sales_orders" ON sales_orders;
CREATE POLICY "Staff can create sales_orders" ON sales_orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_staff_user()
  );

-- 3. Mettre à jour la policy INSERT sur sales_order_items pour utiliser is_staff_user()
DROP POLICY IF EXISTS "Staff can create sales_order_items" ON sales_order_items;
CREATE POLICY "Staff can create sales_order_items" ON sales_order_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_staff_user()
  );

-- 4. Vérifier/créer policy SELECT sur sales_orders pour staff
-- (nécessaire pour le .select() après insert)
DROP POLICY IF EXISTS "Staff can view all sales_orders" ON sales_orders;
CREATE POLICY "Staff can view all sales_orders" ON sales_orders
  FOR SELECT
  USING (
    is_staff_user()
  );

-- 5. Vérifier/créer policy SELECT sur sales_order_items pour staff
DROP POLICY IF EXISTS "Staff can view all sales_order_items" ON sales_order_items;
CREATE POLICY "Staff can view all sales_order_items" ON sales_order_items
  FOR SELECT
  USING (
    is_staff_user()
  );


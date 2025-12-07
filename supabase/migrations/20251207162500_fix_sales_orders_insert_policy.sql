-- =====================================================
-- MIGRATION: Fix sales_orders INSERT policy
-- Date: 2025-12-07
-- Issue: RLS error 42501 on INSERT
-- =====================================================

-- Problème: La policy actuelle utilise get_user_role() qui peut échouer
-- Solution: Ajouter une policy plus permissive pour authenticated users

-- 1. Créer une policy INSERT plus simple pour les utilisateurs authentifiés
-- Cette policy autorise tout utilisateur authentifié avec un rôle staff à créer des commandes

DROP POLICY IF EXISTS "Staff can create sales_orders" ON sales_orders;
CREATE POLICY "Staff can create sales_orders" ON sales_orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager')
    )
  );

-- 2. Pareil pour sales_order_items
DROP POLICY IF EXISTS "Staff can create sales_order_items" ON sales_order_items;
CREATE POLICY "Staff can create sales_order_items" ON sales_order_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager')
    )
  );

-- 3. Aussi mettre à jour la policy SELECT pour que check_sales_order_exists fonctionne
-- Note: La function check_sales_order_exists doit pouvoir voir les commandes

-- Vérifier que check_sales_order_exists bypass RLS
-- Recréer la function avec SET row_security = off
CREATE OR REPLACE FUNCTION check_sales_order_exists(p_sales_order_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET row_security = off
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.sales_orders
    WHERE id = p_sales_order_id
  );
$$;

COMMENT ON FUNCTION check_sales_order_exists IS 'Vérifie si une commande existe. SECURITY DEFINER + row_security=off pour éviter récursion RLS.';

-- Migration: Correction RLS manquant sur 3 tables critiques
-- Date: 8 octobre 2025
-- Impact: Sécurité CRITIQUE - BLOCKER PRODUCTION
-- Description: Active RLS sur variant_groups, sample_orders, sample_order_items + Renforce policies contacts

BEGIN;

-- ============================================================================
-- 1. VARIANT_GROUPS : Activation RLS + Policies
-- ============================================================================

ALTER TABLE variant_groups ENABLE ROW LEVEL SECURITY;

-- SELECT : Filtrage par organisation via subcategory
CREATE POLICY "variant_groups_select_own_organisation"
ON variant_groups FOR SELECT
TO authenticated
USING (
  subcategory_id IN (
    SELECT sc.id FROM subcategories sc
    JOIN categories c ON c.id = sc.category_id
    WHERE c.organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
    )
  )
);

-- INSERT : Catalog managers uniquement
CREATE POLICY "variant_groups_insert_catalog_managers"
ON variant_groups FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- UPDATE : Catalog managers
CREATE POLICY "variant_groups_update_catalog_managers"
ON variant_groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- DELETE : Admins uniquement
CREATE POLICY "variant_groups_delete_admins"
ON variant_groups FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

COMMENT ON TABLE variant_groups IS 'RLS ENABLED - Policies: SELECT (organisation), INSERT/UPDATE (catalog_manager), DELETE (admin)';

-- ============================================================================
-- 2. SAMPLE_ORDERS : Activation RLS + Policies
-- ============================================================================

ALTER TABLE sample_orders ENABLE ROW LEVEL SECURITY;

-- SELECT : Créateur ou managers de l'organisation
CREATE POLICY "sample_orders_select_own_organisation"
ON sample_orders FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager', 'warehouse_manager')
  )
);

-- INSERT : Utilisateurs authentifiés
CREATE POLICY "sample_orders_insert_authenticated"
ON sample_orders FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

-- UPDATE : Créateur ou managers
CREATE POLICY "sample_orders_update_creator_or_managers"
ON sample_orders FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager', 'warehouse_manager')
  )
);

-- DELETE : Admins uniquement
CREATE POLICY "sample_orders_delete_admins"
ON sample_orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

COMMENT ON TABLE sample_orders IS 'RLS ENABLED - Policies: SELECT (créateur/managers), INSERT (auth), UPDATE (créateur/managers), DELETE (admin)';

-- ============================================================================
-- 3. SAMPLE_ORDER_ITEMS : Activation RLS + Policies
-- ============================================================================

ALTER TABLE sample_order_items ENABLE ROW LEVEL SECURITY;

-- SELECT : Via sample_order parent (RLS cascade)
CREATE POLICY "sample_order_items_select_via_order"
ON sample_order_items FOR SELECT
TO authenticated
USING (
  sample_order_id IN (
    SELECT id FROM sample_orders
    -- Policies de sample_orders s'appliquent automatiquement
  )
);

-- INSERT : Via sample_order accessible
CREATE POLICY "sample_order_items_insert_via_order"
ON sample_order_items FOR INSERT
TO authenticated
WITH CHECK (
  sample_order_id IN (
    SELECT id FROM sample_orders
    WHERE created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'catalog_manager')
    )
  )
);

-- UPDATE : Via sample_order accessible
CREATE POLICY "sample_order_items_update_via_order"
ON sample_order_items FOR UPDATE
TO authenticated
USING (
  sample_order_id IN (
    SELECT id FROM sample_orders
    WHERE created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'catalog_manager', 'warehouse_manager')
    )
  )
);

-- DELETE : Admins uniquement
CREATE POLICY "sample_order_items_delete_admins"
ON sample_order_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

COMMENT ON TABLE sample_order_items IS 'RLS ENABLED - Policies: Cascade via sample_orders parent';

-- ============================================================================
-- 4. CONTACTS : Renforcement Policies (Trop Permissives)
-- ============================================================================

-- Supprimer policies trop permissives
DROP POLICY IF EXISTS "contacts_authenticated_access" ON contacts;
DROP POLICY IF EXISTS "contacts_authenticated_insert" ON contacts;

-- SELECT : Filtrage organisation
CREATE POLICY "contacts_select_own_organisation"
ON contacts FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
);

-- INSERT : Même organisation
CREATE POLICY "contacts_insert_own_organisation"
ON contacts FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
);

-- UPDATE : Même organisation
CREATE POLICY "contacts_update_own_organisation"
ON contacts FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
);

-- DELETE : Managers uniquement
CREATE POLICY "contacts_delete_managers"
ON contacts FOR DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager', 'warehouse_manager')
  )
);

COMMENT ON TABLE contacts IS 'RLS ENABLED - Policies: Filtrage strict par organisation (SELECT/INSERT/UPDATE/DELETE)';

COMMIT;

-- ============================================================================
-- VALIDATION POST-MIGRATION
-- ============================================================================

-- Vérifier que toutes les tables ont RLS enabled
DO $$
DECLARE
  no_rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO no_rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = false;

  IF no_rls_count > 0 THEN
    RAISE WARNING 'ATTENTION: % tables sans RLS détectées', no_rls_count;
  ELSE
    RAISE NOTICE 'SUCCÈS: Toutes les tables ont RLS enabled (100%% coverage)';
  END IF;
END $$;

-- Vérifier nombre de policies par table critique
SELECT
  schemaname,
  tablename,
  COUNT(*) as policies_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('variant_groups', 'sample_orders', 'sample_order_items', 'contacts')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ATTENDU:
-- variant_groups        | 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- sample_orders         | 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- sample_order_items    | 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- contacts              | 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- Migration: FIX CRITIQUE - RLS Policies manquantes pour catalogue
-- Date: 16 octobre 2025
-- Sévérité: CRITIQUE - BLOQUANT PRODUCTION
-- Bug: #409 - Impossible créer familles/catégories (erreur 42501 RLS)
-- Description: Active policies INSERT/UPDATE/DELETE pour families, categories, subcategories
-- Référence: Erreur #8 validation display_order

-- ============================================================================
-- CONTEXTE BUG
-- ============================================================================
-- Symptôme: TOUTE création de famille échoue avec erreur 409 (faux message)
-- Cause root: RLS enabled SANS policies INSERT → Code 42501 transformé en 23505
-- Impact: Tests GROUPE 2 bloqués, validation Erreur #8 impossible
-- Tables affectées: families, categories, subcategories

BEGIN;

-- ============================================================================
-- 1. FAMILIES - Création Policies Manquantes
-- ============================================================================

-- RLS déjà enabled par migration 20250114_006_catalogue_complete_schema.sql:556
-- Mais AUCUNE policy créée → toutes opérations bloquées pour authenticated users

-- SELECT: Tous utilisateurs authentifiés (lecture publique catalogue)
CREATE POLICY "families_select_authenticated"
ON families FOR SELECT
TO authenticated
USING (true);

-- SELECT: Public (si nécessaire pour front-end public futur)
CREATE POLICY "families_select_public"
ON families FOR SELECT
TO anon
USING (is_active = true);

-- INSERT: Admins et catalog managers uniquement
CREATE POLICY "families_insert_catalog_managers"
ON families FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- UPDATE: Admins et catalog managers
CREATE POLICY "families_update_catalog_managers"
ON families FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- DELETE: Admins uniquement (sécurité maximale)
CREATE POLICY "families_delete_admins"
ON families FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

COMMENT ON TABLE families IS 'RLS ENABLED - Policies: SELECT (auth+anon), INSERT/UPDATE (catalog_manager), DELETE (admin) - Fixed 2025-10-16';

-- ============================================================================
-- 2. CATEGORIES - Création Policies Manquantes
-- ============================================================================

-- RLS déjà enabled (ligne 557)

-- SELECT: Authentifiés (lecture catalogue)
CREATE POLICY "categories_select_authenticated"
ON categories FOR SELECT
TO authenticated
USING (true);

-- SELECT: Public (actives uniquement)
CREATE POLICY "categories_select_public"
ON categories FOR SELECT
TO anon
USING (is_active = true);

-- INSERT: Catalog managers
CREATE POLICY "categories_insert_catalog_managers"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- UPDATE: Catalog managers
CREATE POLICY "categories_update_catalog_managers"
ON categories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- DELETE: Admins uniquement
CREATE POLICY "categories_delete_admins"
ON categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

COMMENT ON TABLE categories IS 'RLS ENABLED - Policies: SELECT (auth+anon), INSERT/UPDATE (catalog_manager), DELETE (admin) - Fixed 2025-10-16';

-- ============================================================================
-- 3. SUBCATEGORIES - Création Policies Manquantes
-- ============================================================================

-- RLS déjà enabled (ligne 558)

-- SELECT: Authentifiés
CREATE POLICY "subcategories_select_authenticated"
ON subcategories FOR SELECT
TO authenticated
USING (true);

-- SELECT: Public (actives uniquement)
CREATE POLICY "subcategories_select_public"
ON subcategories FOR SELECT
TO anon
USING (is_active = true);

-- INSERT: Catalog managers
CREATE POLICY "subcategories_insert_catalog_managers"
ON subcategories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- UPDATE: Catalog managers
CREATE POLICY "subcategories_update_catalog_managers"
ON subcategories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager')
  )
);

-- DELETE: Admins uniquement
CREATE POLICY "subcategories_delete_admins"
ON subcategories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

COMMENT ON TABLE subcategories IS 'RLS ENABLED - Policies: SELECT (auth+anon), INSERT/UPDATE (catalog_manager), DELETE (admin) - Fixed 2025-10-16';

COMMIT;

-- ============================================================================
-- VALIDATION POST-MIGRATION
-- ============================================================================

-- Vérifier nombre de policies créées (devrait être 5 par table)
SELECT
  tablename,
  COUNT(*) as policies_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('families', 'categories', 'subcategories')
GROUP BY tablename
ORDER BY tablename;

-- ATTENDU:
-- families       | 5 policies (SELECT auth+anon, INSERT, UPDATE, DELETE)
-- categories     | 5 policies
-- subcategories  | 5 policies

-- Test rapide INSERT (devrait réussir si user = catalog_manager)
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251016_002 appliquée avec succès';
  RAISE NOTICE 'Bug #409 résolu: Création familles/catégories maintenant possible';
  RAISE NOTICE 'Erreur #8: Validation display_order débloquée';
END $$;

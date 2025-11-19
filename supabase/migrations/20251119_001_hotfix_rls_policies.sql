-- =====================================================================
-- 🚨 MIGRATION CRITIQUE: Hotfix RLS Policies Cassées
-- =====================================================================
-- Date: 2025-11-19
-- Auteur: Claude Code (Audit Dette Technique Auth)
-- Priorité: P0 BLOCKER
-- =====================================================================
-- CONTEXTE:
-- 17 RLS policies référencent table fantôme `user_organisation_assignments`
-- qui a été supprimée pour MVP (voir 20250113_002 ligne 31-32).
--
-- Impact: Toutes les policies sont CASSÉES → Aucune sécurité effective
--
-- Fix: Remplacer par policies MVP basées sur user_profiles.role UNIQUEMENT
-- (sans isolation tenant organisation_id pour l'instant).
--
-- Phase 2 ajoutera isolation tenant correcte.
-- =====================================================================

-- Référence:
-- docs/audits/2025-11/AUDIT-DETTE-TECHNIQUE-AUTH-2025-11-19.md
-- Section: Problème Critique RLS user_organisation_assignments

-- =====================================================================
-- 1. SUPPRIMER TOUTES LES POLICIES CASSÉES (17 policies)
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Suppression 17 policies cassées référençant user_organisation_assignments...';
END $$;

-- 1.1 products (2 policies)
DROP POLICY IF EXISTS "Owner/Admin peuvent gérer produits (strict)" ON products;
DROP POLICY IF EXISTS "Sales peuvent voir produits de leur org" ON products;

-- 1.2 collections (2 policies)
DROP POLICY IF EXISTS "Owner/Admin peuvent gérer collections" ON collections;
DROP POLICY IF EXISTS "Sales peuvent voir collections" ON collections;

-- 1.3 collection_products (2 policies)
DROP POLICY IF EXISTS "Owner/Admin peuvent gérer produits collections" ON collection_products;
DROP POLICY IF EXISTS "Sales peuvent voir produits collections" ON collection_products;

-- 1.4 collection_shares (1 policy)
DROP POLICY IF EXISTS "Owner/Admin peuvent gérer partages collections" ON collection_shares;

-- 1.5 product_status_changes (2 policies)
DROP POLICY IF EXISTS "Tous utilisateurs peuvent voir historique statuts produits" ON product_status_changes;
DROP POLICY IF EXISTS "Owner/Admin peuvent créer changements statuts" ON product_status_changes;

-- 1.6 sample_orders (1 policy)
DROP POLICY IF EXISTS "Owner/Admin peuvent gérer commandes échantillons" ON sample_orders;

-- 1.7 sample_order_items (1 policy)
DROP POLICY IF EXISTS "Owner/Admin peuvent gérer items échantillons" ON sample_order_items;

-- 1.8 variant_groups (2 policies)
DROP POLICY IF EXISTS "Owner/Admin peuvent gérer groupes variantes" ON variant_groups;
DROP POLICY IF EXISTS "Sales peuvent voir groupes variantes" ON variant_groups;

-- 1.9 shipments (4 policies)
DROP POLICY IF EXISTS "Owner/Admin/Sales peuvent voir shipments de leur org" ON shipments;
DROP POLICY IF EXISTS "Owner/Admin/Sales peuvent créer shipments de leur org" ON shipments;
DROP POLICY IF EXISTS "Owner/Admin/Sales peuvent modifier shipments de leur org" ON shipments;
DROP POLICY IF EXISTS "Owner/Admin peuvent supprimer shipments de leur org" ON shipments;

-- =====================================================================
-- 2. RECRÉER POLICIES SIMPLIFIÉES (MVP - Sans isolation tenant)
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Création policies MVP basées sur user_profiles.role...';
END $$;

-- =====================================================================
-- 2.1 PRODUCTS
-- =====================================================================

-- Owner/Admin - Full CRUD
CREATE POLICY "owner_admin_manage_products"
ON products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- Sales - Read only
CREATE POLICY "sales_view_products"
ON products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'sales'
  )
);

-- =====================================================================
-- 2.2 COLLECTIONS
-- =====================================================================

-- Owner/Admin - Full CRUD
CREATE POLICY "owner_admin_manage_collections"
ON collections
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- Sales - Read only
CREATE POLICY "sales_view_collections"
ON collections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'sales'
  )
);

-- =====================================================================
-- 2.3 COLLECTION_PRODUCTS
-- =====================================================================

-- Owner/Admin - Full CRUD
CREATE POLICY "owner_admin_manage_collection_products"
ON collection_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- Sales - Read only
CREATE POLICY "sales_view_collection_products"
ON collection_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'sales'
  )
);

-- =====================================================================
-- 2.4 COLLECTION_SHARES
-- =====================================================================

-- Owner/Admin only - Full CRUD
CREATE POLICY "owner_admin_manage_collection_shares"
ON collection_shares
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- =====================================================================
-- 2.5 PRODUCT_STATUS_CHANGES
-- =====================================================================

-- All authenticated - Read (historique)
CREATE POLICY "authenticated_view_product_status_changes"
ON product_status_changes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
  )
);

-- Owner/Admin - Write only (INSERT, pas UPDATE/DELETE car historique)
CREATE POLICY "owner_admin_insert_product_status_changes"
ON product_status_changes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- =====================================================================
-- 2.6 SAMPLE_ORDERS
-- =====================================================================

-- Owner/Admin - Full CRUD
CREATE POLICY "owner_admin_manage_sample_orders"
ON sample_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- =====================================================================
-- 2.7 SAMPLE_ORDER_ITEMS
-- =====================================================================

-- Owner/Admin - Full CRUD
CREATE POLICY "owner_admin_manage_sample_order_items"
ON sample_order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- =====================================================================
-- 2.8 VARIANT_GROUPS
-- =====================================================================

-- Owner/Admin - Full CRUD
CREATE POLICY "owner_admin_manage_variant_groups"
ON variant_groups
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- Sales - Read only
CREATE POLICY "sales_view_variant_groups"
ON variant_groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'sales'
  )
);

-- =====================================================================
-- 2.9 SHIPMENTS
-- =====================================================================

-- Owner/Admin/Sales - SELECT
CREATE POLICY "owner_admin_sales_view_shipments"
ON shipments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales')
  )
);

-- Owner/Admin/Sales - INSERT
CREATE POLICY "owner_admin_sales_insert_shipments"
ON shipments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales')
  )
);

-- Owner/Admin/Sales - UPDATE
CREATE POLICY "owner_admin_sales_update_shipments"
ON shipments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'sales')
  )
);

-- Owner/Admin only - DELETE
CREATE POLICY "owner_admin_delete_shipments"
ON shipments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- =====================================================================
-- 3. VALIDATION MIGRATION
-- =====================================================================

-- 3.1 Vérifier aucune policy ne référence user_organisation_assignments
DO $$
DECLARE
  broken_policies INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO broken_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      qual::text LIKE '%user_organisation_assignments%'
      OR with_check::text LIKE '%user_organisation_assignments%'
    );

  IF broken_policies > 0 THEN
    RAISE EXCEPTION '❌ ÉCHEC: % policies référencent encore user_organisation_assignments', broken_policies;
  ELSE
    RAISE NOTICE '✅ SUCCESS: Aucune policy ne référence user_organisation_assignments';
  END IF;
END $$;

-- 3.2 Compter policies créées
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'products',
      'collections',
      'collection_products',
      'collection_shares',
      'product_status_changes',
      'sample_orders',
      'sample_order_items',
      'variant_groups',
      'shipments'
    );

  IF policy_count < 17 THEN
    RAISE WARNING '⚠️ Seulement % policies créées (attendu 17)', policy_count;
  ELSE
    RAISE NOTICE '✅ SUCCESS: % RLS policies créées (MVP sans isolation tenant)', policy_count;
  END IF;
END $$;

-- =====================================================================
-- 4. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON POLICY "owner_admin_manage_products" ON products IS
  'HOTFIX 2025-11-19: Policy MVP basée sur user_profiles.role. Sans isolation tenant (Phase 2).';

COMMENT ON POLICY "owner_admin_manage_collections" ON collections IS
  'HOTFIX 2025-11-19: Policy MVP basée sur user_profiles.role. Sans isolation tenant (Phase 2).';

COMMENT ON POLICY "owner_admin_manage_variant_groups" ON variant_groups IS
  'HOTFIX 2025-11-19: Policy MVP basée sur user_profiles.role. Sans isolation tenant (Phase 2).';

COMMENT ON POLICY "owner_admin_delete_shipments" ON shipments IS
  'HOTFIX 2025-11-19: DELETE réservé Owner/Admin uniquement.';

-- =====================================================================
-- 5. AVERTISSEMENTS
-- =====================================================================

DO $$
BEGIN
  RAISE WARNING '⚠️ IMPORTANT: Ces policies MVP ne filtrent PAS par organisation_id';
  RAISE WARNING '⚠️ Phase 2 (migration 20251119_010) ajoutera isolation tenant correcte';
  RAISE WARNING '⚠️ Pour l''instant, tous les users authentifiés voient TOUTES les données (pas de multi-tenancy)';
END $$;

-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
-- Statut: READY FOR PRODUCTION (MVP)
-- Limitation: Pas d'isolation tenant (mono-tenant de facto)
-- Next Step: Phase 2 - Ajouter organisation_id + RLS tenant isolé
-- =====================================================================

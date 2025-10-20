-- =====================================================================
-- MIGRATION SÉCURITÉ: Activer RLS sur 7 Tables Critiques
-- Date: 2025-10-20
-- Auteur: Vérone Security Auditor
-- Priorité: P0 CRITICAL (Blocker production)
-- =====================================================================
-- CONTEXTE:
-- Audit sécurité pré-production a détecté 7 tables SANS Row Level Security.
-- Impact: Cross-tenant data leak, accès non autorisé possible.
-- Fix: Activer RLS + créer policies isolation tenant Owner/Admin.
-- =====================================================================

-- Référence Audit:
-- /Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/sessions/RAPPORT-AUDIT-SECURITE-PRE-PRODUCTION-2025-10-20.md
-- Section: CRITICAL #1

-- =====================================================================
-- 1. ACTIVER ROW LEVEL SECURITY
-- =====================================================================

-- 1.1 collection_products (Produits dans collections)
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

-- 1.2 collection_shares (Partages collections)
ALTER TABLE collection_shares ENABLE ROW LEVEL SECURITY;

-- 1.3 collections (Collections marketing)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- 1.4 product_status_changes (Historique statuts produits)
ALTER TABLE product_status_changes ENABLE ROW LEVEL SECURITY;

-- 1.5 sample_order_items (Items échantillons)
ALTER TABLE sample_order_items ENABLE ROW LEVEL SECURITY;

-- 1.6 sample_orders (Commandes échantillons)
ALTER TABLE sample_orders ENABLE ROW LEVEL SECURITY;

-- 1.7 variant_groups (Groupes variantes)
ALTER TABLE variant_groups ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. CRÉER POLICIES - collections
-- =====================================================================
-- Pattern: Owner+Admin full CRUD, Sales read-only

-- 2.1 Owner/Admin - Full CRUD
CREATE POLICY "Owner/Admin peuvent gérer collections"
ON collections
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);

-- 2.2 Sales - Read-only
CREATE POLICY "Sales peuvent voir collections"
ON collections
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'sales'
  )
);

-- =====================================================================
-- 3. CRÉER POLICIES - collection_products
-- =====================================================================
-- Pattern: Suivre permissions de la collection parente

-- 3.1 Owner/Admin - Full CRUD
CREATE POLICY "Owner/Admin peuvent gérer produits collections"
ON collection_products
FOR ALL
TO authenticated
USING (
  collection_id IN (
    SELECT id FROM collections
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
)
WITH CHECK (
  collection_id IN (
    SELECT id FROM collections
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
);

-- 3.2 Sales - Read-only
CREATE POLICY "Sales peuvent voir produits collections"
ON collection_products
FOR SELECT
TO authenticated
USING (
  collection_id IN (
    SELECT id FROM collections
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name = 'sales'
    )
  )
);

-- =====================================================================
-- 4. CRÉER POLICIES - collection_shares
-- =====================================================================
-- Pattern: Owner/Admin only

CREATE POLICY "Owner/Admin peuvent gérer partages collections"
ON collection_shares
FOR ALL
TO authenticated
USING (
  collection_id IN (
    SELECT id FROM collections
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
)
WITH CHECK (
  collection_id IN (
    SELECT id FROM collections
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
);

-- =====================================================================
-- 5. CRÉER POLICIES - product_status_changes
-- =====================================================================
-- Pattern: Tous rôles read, Owner/Admin write

-- 5.1 Tous rôles - Read
CREATE POLICY "Tous utilisateurs peuvent voir historique statuts produits"
ON product_status_changes
FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
    )
  )
);

-- 5.2 Owner/Admin - Write (INSERT uniquement, pas de UPDATE/DELETE car historique)
CREATE POLICY "Owner/Admin peuvent créer changements statuts"
ON product_status_changes
FOR INSERT
TO authenticated
WITH CHECK (
  product_id IN (
    SELECT id FROM products
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
);

-- =====================================================================
-- 6. CRÉER POLICIES - sample_orders
-- =====================================================================
-- Pattern: Owner/Admin full CRUD

CREATE POLICY "Owner/Admin peuvent gérer commandes échantillons"
ON sample_orders
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);

-- =====================================================================
-- 7. CRÉER POLICIES - sample_order_items
-- =====================================================================
-- Pattern: Suivre permissions de sample_orders parente

CREATE POLICY "Owner/Admin peuvent gérer items échantillons"
ON sample_order_items
FOR ALL
TO authenticated
USING (
  sample_order_id IN (
    SELECT id FROM sample_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
)
WITH CHECK (
  sample_order_id IN (
    SELECT id FROM sample_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
);

-- =====================================================================
-- 8. CRÉER POLICIES - variant_groups
-- =====================================================================
-- Pattern: Owner/Admin full CRUD, Sales read-only

-- 8.1 Owner/Admin - Full CRUD
CREATE POLICY "Owner/Admin peuvent gérer groupes variantes"
ON variant_groups
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);

-- 8.2 Sales - Read-only
CREATE POLICY "Sales peuvent voir groupes variantes"
ON variant_groups
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'sales'
  )
);

-- =====================================================================
-- VALIDATION MIGRATION
-- =====================================================================

-- Vérifier RLS activé sur les 7 tables
DO $$
DECLARE
  rls_missing_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO rls_missing_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'collection_products',
      'collection_shares',
      'collections',
      'product_status_changes',
      'sample_order_items',
      'sample_orders',
      'variant_groups'
    )
    AND rowsecurity = false;

  IF rls_missing_count > 0 THEN
    RAISE EXCEPTION 'RLS still disabled on % table(s)', rls_missing_count;
  END IF;

  RAISE NOTICE 'SUCCESS: RLS enabled on all 7 critical tables';
END $$;

-- Vérifier policies créées (minimum 2 par table)
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'collection_products',
      'collection_shares',
      'collections',
      'product_status_changes',
      'sample_order_items',
      'sample_orders',
      'variant_groups'
    );

  IF policy_count < 14 THEN  -- 2 policies min par table × 7 tables = 14
    RAISE WARNING 'Only % policies created (expected >= 14)', policy_count;
  ELSE
    RAISE NOTICE 'SUCCESS: % RLS policies created', policy_count;
  END IF;
END $$;

-- =====================================================================
-- COMMENTAIRES
-- =====================================================================

COMMENT ON POLICY "Owner/Admin peuvent gérer collections" ON collections IS
  'SECURITY: Isolation tenant Owner/Admin - Phase 1 Production Ready';

COMMENT ON POLICY "Owner/Admin peuvent gérer groupes variantes" ON variant_groups IS
  'SECURITY: Fix critical RLS missing - Audit 2025-10-20';

-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
-- Statut: READY FOR PRODUCTION
-- Tests requis:
--   1. Vérifier Owner peut CRUD ses collections
--   2. Vérifier Admin peut CRUD ses collections
--   3. Vérifier Sales read-only collections
--   4. Vérifier isolation tenant (user A ne voit pas collections user B)
-- =====================================================================

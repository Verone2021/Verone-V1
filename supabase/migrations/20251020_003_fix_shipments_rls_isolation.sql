-- =====================================================================
-- MIGRATION SÉCURITÉ: Fix RLS Policies Shipments (Isolation Tenant)
-- Date: 2025-10-20
-- Auteur: Vérone Security Auditor
-- Priorité: P1 MAJOR (Urgent)
-- =====================================================================
-- CONTEXTE:
-- Table shipments a policy "Authenticated users can read shipments"
-- sans filtre organisation_id → Cross-tenant data leak possible.
--
-- Fix: Ajouter isolation tenant via sales_orders.organisation_id
-- =====================================================================

-- Référence Audit:
-- /Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/sessions/RAPPORT-AUDIT-SECURITE-PRE-PRODUCTION-2025-10-20.md
-- Section: MAJOR #2 - RLS Policies Trop Permissives (Problème 2: shipments)

-- =====================================================================
-- 1. SUPPRIMER POLICIES PERMISSIVES EXISTANTES
-- =====================================================================

DROP POLICY IF EXISTS "Authenticated users can read shipments" ON shipments;
DROP POLICY IF EXISTS "Owner/Admin/Sales can create shipments" ON shipments;
DROP POLICY IF EXISTS "Owner/Admin/Sales can update shipments" ON shipments;
DROP POLICY IF EXISTS "Owner/Admin can delete shipments" ON shipments;

-- =====================================================================
-- 2. CRÉER POLICIES STRICTES AVEC ISOLATION TENANT
-- =====================================================================

-- 2.1 SELECT - Owner/Admin/Sales peuvent voir shipments de leur org
CREATE POLICY "Owner/Admin/Sales peuvent voir shipments de leur org"
ON shipments
FOR SELECT
TO authenticated
USING (
  sales_order_id IN (
    SELECT id FROM sales_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin', 'sales')
    )
  )
);

-- 2.2 INSERT - Owner/Admin/Sales peuvent créer shipments
CREATE POLICY "Owner/Admin/Sales peuvent créer shipments de leur org"
ON shipments
FOR INSERT
TO authenticated
WITH CHECK (
  sales_order_id IN (
    SELECT id FROM sales_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin', 'sales')
    )
  )
);

-- 2.3 UPDATE - Owner/Admin/Sales peuvent modifier shipments
CREATE POLICY "Owner/Admin/Sales peuvent modifier shipments de leur org"
ON shipments
FOR UPDATE
TO authenticated
USING (
  sales_order_id IN (
    SELECT id FROM sales_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin', 'sales')
    )
  )
)
WITH CHECK (
  sales_order_id IN (
    SELECT id FROM sales_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin', 'sales')
    )
  )
);

-- 2.4 DELETE - Owner/Admin uniquement
CREATE POLICY "Owner/Admin peuvent supprimer shipments de leur org"
ON shipments
FOR DELETE
TO authenticated
USING (
  sales_order_id IN (
    SELECT id FROM sales_orders
    WHERE organisation_id IN (
      SELECT organisation_id
      FROM user_organisation_assignments
      WHERE user_id = auth.uid()
        AND role_name IN ('owner', 'admin')
    )
  )
);

-- =====================================================================
-- 3. VALIDATION MIGRATION
-- =====================================================================

-- 3.1 Vérifier isolation tenant dans policies
DO $$
DECLARE
  isolated_policies INTEGER;
  total_policies INTEGER;
BEGIN
  -- Compter policies avec isolation tenant
  SELECT COUNT(*)
  INTO isolated_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'shipments'
    AND (
      qual LIKE '%sales_orders%organisation_id%'
      OR with_check LIKE '%sales_orders%organisation_id%'
    );

  -- Compter policies totales
  SELECT COUNT(*)
  INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'shipments';

  IF isolated_policies < total_policies THEN
    RAISE WARNING 'Some policies may lack tenant isolation: %/% policies isolated',
      isolated_policies, total_policies;
  ELSE
    RAISE NOTICE 'SUCCESS: All % shipments policies have tenant isolation', total_policies;
  END IF;
END $$;

-- 3.2 Vérifier aucune policy permissive
DO $$
DECLARE
  permissive_policies INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO permissive_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'shipments'
    AND (
      policyname LIKE '%Authenticated users%'  -- Generic auth sans filtre
      OR qual NOT LIKE '%organisation_id%'     -- Pas d'isolation
    );

  IF permissive_policies > 0 THEN
    RAISE WARNING 'Found % permissive policies on shipments (cross-tenant leak risk)', permissive_policies;
  ELSE
    RAISE NOTICE 'SUCCESS: No permissive policies on shipments';
  END IF;
END $$;

-- 3.3 Lister policies finales
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '===== POLICIES TABLE SHIPMENTS (APRÈS MIGRATION) =====';

  FOR policy_record IN
    SELECT
      policyname,
      cmd,
      CASE
        WHEN qual LIKE '%owner%' AND qual LIKE '%admin%' AND qual LIKE '%sales%' THEN 'Owner+Admin+Sales'
        WHEN qual LIKE '%owner%' AND qual LIKE '%admin%' THEN 'Owner+Admin'
        WHEN qual LIKE '%sales%' THEN 'Sales'
        ELSE 'Other'
      END as role_restriction,
      CASE
        WHEN qual LIKE '%organisation_id%' OR with_check LIKE '%organisation_id%' THEN 'YES'
        ELSE 'NO ⚠️'
      END as tenant_isolation
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shipments'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: % | CMD: % | Roles: % | Isolation: %',
      policy_record.policyname,
      policy_record.cmd,
      policy_record.role_restriction,
      policy_record.tenant_isolation;
  END LOOP;

  RAISE NOTICE '========================================================';
END $$;

-- =====================================================================
-- 4. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON POLICY "Owner/Admin/Sales peuvent voir shipments de leur org" ON shipments IS
  'SECURITY FIX 2025-10-20: Isolation tenant via sales_orders.organisation_id. Prévient cross-tenant data leak.';

COMMENT ON POLICY "Owner/Admin peuvent supprimer shipments de leur org" ON shipments IS
  'SECURITY: Delete réservé Owner/Admin (Sales read/write only).';

COMMENT ON TABLE shipments IS
  'Expéditions multi-transporteur (Packlink, Mondial Relay, Chronotruck). RLS policies strictes appliquées 2025-10-20.';

-- =====================================================================
-- 5. INDEX PERFORMANCE (Optionnel mais recommandé)
-- =====================================================================

-- Index pour optimiser RLS query (sales_order_id lookup)
CREATE INDEX IF NOT EXISTS idx_shipments_sales_order_id_rls
ON shipments(sales_order_id);

-- =====================================================================
-- 6. TESTS RECOMMANDÉS
-- =====================================================================

-- Test 1: Owner/Admin/Sales peuvent voir leurs shipments uniquement
-- Test 2: User tenant A ne voit PAS shipments tenant B (isolation)
-- Test 3: Sales ne peuvent PAS supprimer shipments (DELETE bloqué)
-- Test 4: Owner/Admin peuvent DELETE leurs shipments uniquement
-- Test 5: Performance RLS query acceptable (<100ms)

-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
-- Statut: READY FOR PRODUCTION
-- Impact: Breaking change pour code ne filtrant pas par organisation
-- Rollback: Restaurer policies permissives (non recommandé)
-- =====================================================================

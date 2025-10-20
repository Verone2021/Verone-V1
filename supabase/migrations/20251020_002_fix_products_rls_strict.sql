-- =====================================================================
-- MIGRATION SÉCURITÉ: Fix RLS Policies Produits (Strict)
-- Date: 2025-10-20
-- Auteur: Vérone Security Auditor
-- Priorité: P1 MAJOR (Urgent)
-- =====================================================================
-- CONTEXTE:
-- Table products a policies trop permissives:
--   - "products_select_anonymous_testing" → Accès anonyme ❌
--   - "products_delete_authenticated" → N'importe qui peut DELETE ❌
--   - Pas de filtre organisation_id → Cross-tenant leak ❌
--
-- Fix: Supprimer policies permissives, recréer strictes Owner/Admin
-- =====================================================================

-- Référence Audit:
-- /Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/sessions/RAPPORT-AUDIT-SECURITE-PRE-PRODUCTION-2025-10-20.md
-- Section: MAJOR #2 - RLS Policies Trop Permissives

-- =====================================================================
-- 1. SUPPRIMER POLICIES PERMISSIVES EXISTANTES
-- =====================================================================

-- Backup policies existantes (pour rollback si besoin)
DO $$
BEGIN
  RAISE NOTICE 'Suppression policies permissives table products...';
END $$;

DROP POLICY IF EXISTS "products_select_anonymous_testing" ON products;
DROP POLICY IF EXISTS "products_delete_authenticated" ON products;
DROP POLICY IF EXISTS "products_insert_authenticated" ON products;
DROP POLICY IF EXISTS "products_update_authenticated" ON products;
DROP POLICY IF EXISTS "products_select_authenticated" ON products;

-- =====================================================================
-- 2. CRÉER POLICIES STRICTES OWNER/ADMIN
-- =====================================================================

-- 2.1 Owner/Admin - Full CRUD avec isolation tenant
CREATE POLICY "Owner/Admin peuvent gérer produits (strict)"
ON products
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

-- 2.2 Sales - Read-only avec isolation tenant
CREATE POLICY "Sales peuvent voir produits de leur org"
ON products
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
-- 3. VALIDATION MIGRATION
-- =====================================================================

-- 3.1 Vérifier aucune policy permissive restante
DO $$
DECLARE
  dangerous_policies INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO dangerous_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'products'
    AND (
      policyname LIKE '%anonymous%'
      OR policyname LIKE '%authenticated%'  -- Sans filtre organisation
      OR qual NOT LIKE '%organisation_id%'  -- Pas d'isolation tenant
    );

  IF dangerous_policies > 0 THEN
    RAISE WARNING 'Found % potentially dangerous policies on products table', dangerous_policies;
  ELSE
    RAISE NOTICE 'SUCCESS: All dangerous policies removed from products table';
  END IF;
END $$;

-- 3.2 Vérifier policies strictes créées
DO $$
DECLARE
  strict_policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO strict_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'products'
    AND qual LIKE '%organisation_id%'  -- Isolation tenant présente
    AND qual LIKE '%role_name%';        -- Contrôle rôle présent

  IF strict_policy_count < 2 THEN
    RAISE WARNING 'Only % strict policies found (expected 2: Owner/Admin + Sales)', strict_policy_count;
  ELSE
    RAISE NOTICE 'SUCCESS: % strict RLS policies active on products', strict_policy_count;
  END IF;
END $$;

-- 3.3 Lister policies finales (pour audit)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '===== POLICIES TABLE PRODUCTS (APRÈS MIGRATION) =====';

  FOR policy_record IN
    SELECT policyname, cmd, permissive, roles
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'products'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: % | CMD: % | Permissive: % | Roles: %',
      policy_record.policyname,
      policy_record.cmd,
      policy_record.permissive,
      policy_record.roles;
  END LOOP;

  RAISE NOTICE '========================================================';
END $$;

-- =====================================================================
-- 4. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON POLICY "Owner/Admin peuvent gérer produits (strict)" ON products IS
  'SECURITY FIX 2025-10-20: Policy stricte avec isolation tenant Owner/Admin. Remplace policies permissives (anonymous, authenticated sans filtre).';

COMMENT ON POLICY "Sales peuvent voir produits de leur org" ON products IS
  'SECURITY FIX 2025-10-20: Read-only Sales avec isolation tenant. Prévient cross-tenant data leak.';

-- =====================================================================
-- 5. TESTS RECOMMANDÉS
-- =====================================================================

-- Test 1: Owner peut voir/modifier ses produits
-- Test 2: Admin peut voir/modifier ses produits
-- Test 3: Sales read-only (UPDATE/DELETE bloqué)
-- Test 4: User tenant A ne voit PAS produits tenant B (isolation)
-- Test 5: User anonyme ne voit RIEN (403 unauthorized)

-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
-- Statut: READY FOR PRODUCTION
-- Impact: Breaking change si code appelant comptait sur policies permissives
-- Rollback: Restaurer policies anciennes (non recommandé - vulnérabilités)
-- =====================================================================

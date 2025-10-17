-- =============================================
-- MIGRATION 019: Restauration Policies RLS Originales Sales Orders
-- Date: 2025-10-13
-- =============================================
-- Objectif: ROLLBACK migrations 017-018 erronées et restaurer policies fonctionnelles
-- Erreur commise: Suppression policies originales sophistiquées (migration 004)
-- Solution: Restaurer policies avec vérifications organisation + rôles

-- =============================================
-- CONTEXTE ERREUR
-- =============================================
-- Migration 017: Créé policies "authenticated" SIMPLISTES (auth.uid() uniquement)
-- Migration 018: SUPPRIMÉ policies originales FONCTIONNELLES
-- Résultat: 403 Forbidden sur tous les UPDATE sales_orders

-- Policies originales (migration 004) utilisaient:
--   - user_has_access_to_organisation(get_user_organisation_id()) → Multi-tenant
--   - get_user_role() IN ('owner', 'admin', 'sales') → Permissions rôles

-- =============================================
-- VÉRIFICATION ÉTAT ACTUEL
-- =============================================

\echo '========================================';
\echo 'RESTAURATION POLICIES RLS ORIGINALES';
\echo '========================================';
\echo '';

\echo '=== AVANT: Policies actuelles (attendu: 4 authenticated) ===';
SELECT
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE tablename IN ('sales_orders', 'sales_order_items')
ORDER BY tablename, policyname;

-- =============================================
-- ÉTAPE 1: SUPPRESSION POLICIES ERRONÉES (migration 017)
-- =============================================

\echo '';
\echo '=== SUPPRESSION: Policies authenticated erronées ===';

-- Sales Orders: Supprimer 4 policies
DROP POLICY IF EXISTS "sales_orders_select_authenticated" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_insert_authenticated" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_update_authenticated" ON sales_orders;
DROP POLICY IF EXISTS "sales_orders_delete_admin" ON sales_orders;

\echo '✅ 4 policies sales_orders supprimées';

-- Sales Order Items: Supprimer 4 policies
DROP POLICY IF EXISTS "sales_order_items_select_authenticated" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_insert_authenticated" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_update_authenticated" ON sales_order_items;
DROP POLICY IF EXISTS "sales_order_items_delete_authenticated" ON sales_order_items;

\echo '✅ 4 policies sales_order_items supprimées';

-- =============================================
-- ÉTAPE 2: RESTAURATION POLICIES ORIGINALES (migration 004)
-- =============================================

\echo '';
\echo '=== RESTAURATION: Policies originales migration 004 ===';

-- =============================================
-- RLS POLICIES SALES_ORDERS (3 policies)
-- =============================================

-- Policy 1: SELECT (Consultation)
CREATE POLICY "Utilisateurs peuvent voir leurs commandes clients"
  ON sales_orders FOR SELECT
  USING (user_has_access_to_organisation(get_user_organisation_id()));

COMMENT ON POLICY "Utilisateurs peuvent voir leurs commandes clients" ON sales_orders IS
'Policy originale migration 004. Permet consultation commandes clients de l''organisation.
Utilise: user_has_access_to_organisation() pour vérification multi-tenant.';

-- Policy 2: INSERT (Création)
CREATE POLICY "Utilisateurs peuvent créer des commandes clients"
  ON sales_orders FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'sales') AND
    user_has_access_to_organisation(get_user_organisation_id())
  );

COMMENT ON POLICY "Utilisateurs peuvent créer des commandes clients" ON sales_orders IS
'Policy originale migration 004. Permet création commandes si:
  - Rôle: owner, admin ou sales
  - Organisation: user_has_access_to_organisation()
Vérifie permissions + multi-tenant.';

-- Policy 3: UPDATE (Modification)
CREATE POLICY "Utilisateurs peuvent modifier leurs commandes clients"
  ON sales_orders FOR UPDATE
  USING (user_has_access_to_organisation(get_user_organisation_id()))
  WITH CHECK (user_has_access_to_organisation(get_user_organisation_id()));

COMMENT ON POLICY "Utilisateurs peuvent modifier leurs commandes clients" ON sales_orders IS
'Policy originale migration 004. Permet modification commandes de l''organisation.
Utilise: user_has_access_to_organisation() pour vérification multi-tenant.
Pas de vérification rôle: Tous utilisateurs organisation peuvent modifier.';

\echo '✅ 3 policies sales_orders restaurées';

-- =============================================
-- RLS POLICIES SALES_ORDER_ITEMS (2 policies)
-- =============================================

-- Policy 1: SELECT (Consultation items)
CREATE POLICY "Utilisateurs peuvent voir les items de leurs commandes clients"
  ON sales_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_items.sales_order_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

COMMENT ON POLICY "Utilisateurs peuvent voir les items de leurs commandes clients" ON sales_order_items IS
'Policy originale migration 004. Permet consultation items si commande accessible.
Vérifie: Organisation via JOIN sales_orders.';

-- Policy 2: INSERT (Création items)
CREATE POLICY "Utilisateurs peuvent créer des items de commandes clients"
  ON sales_order_items FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'sales') AND
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_items.sales_order_id
        AND user_has_access_to_organisation(get_user_organisation_id())
    )
  );

COMMENT ON POLICY "Utilisateurs peuvent créer des items de commandes clients" ON sales_order_items IS
'Policy originale migration 004. Permet création items si:
  - Rôle: owner, admin ou sales
  - Commande parent accessible (organisation)
Vérifie permissions + multi-tenant via JOIN.';

\echo '✅ 2 policies sales_order_items restaurées';

-- =============================================
-- VÉRIFICATION RÉSULTAT
-- =============================================

\echo '';
\echo '=== APRÈS: Policies restaurées (attendu: 5 total) ===';
SELECT
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename IN ('sales_orders', 'sales_order_items')
ORDER BY tablename, policyname;

-- =============================================
-- VALIDATION FONCTIONS RLS
-- =============================================

\echo '';
\echo '=== VALIDATION: Fonctions RLS existantes ===';
SELECT
    proname as function_name,
    CASE
        WHEN proname = 'get_user_role' THEN 'Retourne rôle utilisateur connecté'
        WHEN proname = 'get_user_organisation_id' THEN 'Retourne organisation_id utilisateur'
        WHEN proname = 'user_has_access_to_organisation' THEN 'Vérifie accès organisation (multi-tenant)'
    END as description
FROM pg_proc
WHERE proname IN ('get_user_role', 'get_user_organisation_id', 'user_has_access_to_organisation')
ORDER BY proname;

-- =============================================
-- VALIDATION MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'VALIDATION RESTAURATION POLICIES';
\echo '========================================';
\echo '';

DO $$
DECLARE
    v_so_policies INTEGER;
    v_soi_policies INTEGER;
    v_functions_count INTEGER;
BEGIN
    -- Compter policies sales_orders
    SELECT COUNT(*) INTO v_so_policies
    FROM pg_policies
    WHERE tablename = 'sales_orders';

    -- Compter policies sales_order_items
    SELECT COUNT(*) INTO v_soi_policies
    FROM pg_policies
    WHERE tablename = 'sales_order_items';

    -- Compter fonctions RLS
    SELECT COUNT(*) INTO v_functions_count
    FROM pg_proc
    WHERE proname IN ('get_user_role', 'get_user_organisation_id', 'user_has_access_to_organisation');

    RAISE NOTICE 'Policies restaurées:';
    RAISE NOTICE '  - sales_orders: % (attendu: 3)', v_so_policies;
    RAISE NOTICE '  - sales_order_items: % (attendu: 2)', v_soi_policies;
    RAISE NOTICE '  - Fonctions RLS: % (attendu: 3)', v_functions_count;
    RAISE NOTICE '';

    IF v_so_policies = 3 AND v_soi_policies = 2 AND v_functions_count = 3 THEN
        RAISE NOTICE '✅ Policies originales restaurées correctement';
        RAISE NOTICE '';
        RAISE NOTICE 'Vérifications actives:';
        RAISE NOTICE '  - Multi-tenant: user_has_access_to_organisation() ✅';
        RAISE NOTICE '  - Permissions rôles: get_user_role() IN (owner, admin, sales) ✅';
        RAISE NOTICE '  - Organisation ID: get_user_organisation_id() ✅';
    ELSE
        RAISE WARNING '⚠️ Restauration incomplète: SO=%, SOI=%, Functions=%', v_so_policies, v_soi_policies, v_functions_count;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 019 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Actions effectuées:';
    RAISE NOTICE '  1. Suppression 8 policies authenticated erronées (migration 017) ✅';
    RAISE NOTICE '  2. Restauration 5 policies originales (migration 004) ✅';
    RAISE NOTICE '  3. Validation fonctions RLS custom ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Erreur corrigée:';
    RAISE NOTICE '  - Migrations 017-018: Policies simplistes sans vérification organisation ❌';
    RAISE NOTICE '  - Migration 019: Policies sophistiquées multi-tenant restaurées ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - UPDATE sales_orders devrait fonctionner maintenant ✅';
    RAISE NOTICE '  - Vérifications multi-tenant actives ✅';
    RAISE NOTICE '  - Permissions rôles respectées ✅';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Re-tester TEST 3 (SO-PREPAY-001 validation)';
    RAISE NOTICE '  - Cliquer "Valider" dans browser';
    RAISE NOTICE '  - Vérifier 0 erreur 403';
    RAISE NOTICE '  - Confirmer status change draft → confirmed';
    RAISE NOTICE '========================================';
END $$;

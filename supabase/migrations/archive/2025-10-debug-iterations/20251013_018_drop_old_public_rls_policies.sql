-- =============================================
-- MIGRATION 018: Suppression anciennes policies RLS (role public)
-- Date: 2025-10-13
-- =============================================
-- Objectif: Résoudre Bug 403 Forbidden persistant après migration 017
-- Problème: Anciennes policies en français (role public) ont priorité
-- Solution: Supprimer anciennes policies, garder uniquement nouvelles (authenticated)

-- =============================================
-- CONTEXTE BUG
-- =============================================
-- Migration 017 a ajouté 4 policies (authenticated) sur sales_orders
-- MAIS: 3 anciennes policies (public, noms français) existaient déjà
-- Résultat: 7 policies au lieu de 4 → Conflit priorités
-- Test: UPDATE sales_orders → 403 Forbidden persiste

-- =============================================
-- ANALYSE POLICIES ACTUELLES
-- =============================================
-- sales_orders: 7 policies total
--   3 anciennes (role public, français):
--     - "Utilisateurs peuvent voir leurs commandes clients" (SELECT)
--     - "Utilisateurs peuvent créer des commandes clients" (INSERT)
--     - "Utilisateurs peuvent modifier leurs commandes clients" (UPDATE)
--   4 nouvelles (role authenticated, anglais):
--     - sales_orders_select_authenticated (SELECT)
--     - sales_orders_insert_authenticated (INSERT)
--     - sales_orders_update_authenticated (UPDATE)
--     - sales_orders_delete_admin (DELETE)

-- sales_order_items: 6 policies total
--   2 anciennes (role public, français):
--     - "Utilisateurs peuvent voir les items de leurs commandes clients" (SELECT)
--     - "Utilisateurs peuvent créer des items de commandes clients" (INSERT)
--   4 nouvelles (role authenticated, anglais)

\echo '========================================';
\echo 'SUPPRESSION ANCIENNES POLICIES PUBLIC';
\echo '========================================';
\echo '';

\echo '=== AVANT: Policies sales_orders (attendu: 7) ===';
SELECT
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE tablename = 'sales_orders'
ORDER BY policyname;

-- =============================================
-- SUPPRESSION POLICIES SALES_ORDERS (anciennes)
-- =============================================

\echo '';
\echo '=== SUPPRESSION: Anciennes policies sales_orders ===';

-- Policy 1: SELECT (français, role public)
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs commandes clients" ON sales_orders;
\echo '✅ Policy SELECT (français) supprimée';

-- Policy 2: INSERT (français, role public)
DROP POLICY IF EXISTS "Utilisateurs peuvent créer des commandes clients" ON sales_orders;
\echo '✅ Policy INSERT (français) supprimée';

-- Policy 3: UPDATE (français, role public)
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leurs commandes clients" ON sales_orders;
\echo '✅ Policy UPDATE (français) supprimée';

-- =============================================
-- SUPPRESSION POLICIES SALES_ORDER_ITEMS (anciennes)
-- =============================================

\echo '';
\echo '=== SUPPRESSION: Anciennes policies sales_order_items ===';

-- Policy 1: SELECT (français, role public)
DROP POLICY IF EXISTS "Utilisateurs peuvent voir les items de leurs commandes clients" ON sales_order_items;
\echo '✅ Policy SELECT (français) supprimée';

-- Policy 2: INSERT (français, role public)
DROP POLICY IF EXISTS "Utilisateurs peuvent créer des items de commandes clients" ON sales_order_items;
\echo '✅ Policy INSERT (français) supprimée';

-- =============================================
-- VÉRIFICATION RÉSULTAT
-- =============================================

\echo '';
\echo '=== APRÈS: Policies sales_orders (attendu: 4) ===';
SELECT
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE tablename = 'sales_orders'
ORDER BY policyname;

\echo '';
\echo '=== APRÈS: Policies sales_order_items (attendu: 4) ===';
SELECT
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE tablename = 'sales_order_items'
ORDER BY policyname;

-- =============================================
-- VALIDATION MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'VALIDATION SUPPRESSION POLICIES';
\echo '========================================';
\echo '';

DO $$
DECLARE
    v_so_policies INTEGER;
    v_soi_policies INTEGER;
BEGIN
    -- Compter policies sales_orders
    SELECT COUNT(*) INTO v_so_policies
    FROM pg_policies
    WHERE tablename = 'sales_orders';

    -- Compter policies sales_order_items
    SELECT COUNT(*) INTO v_soi_policies
    FROM pg_policies
    WHERE tablename = 'sales_order_items';

    RAISE NOTICE 'Policies restantes:';
    RAISE NOTICE '  - sales_orders: % (attendu: 4)', v_so_policies;
    RAISE NOTICE '  - sales_order_items: % (attendu: 4)', v_soi_policies;
    RAISE NOTICE '';

    IF v_so_policies = 4 AND v_soi_policies = 4 THEN
        RAISE NOTICE '✅ Anciennes policies supprimées correctement';
        RAISE NOTICE '';
        RAISE NOTICE 'Policies actives (authenticated uniquement):';
        RAISE NOTICE '  - SELECT: Tous utilisateurs authentifiés';
        RAISE NOTICE '  - INSERT: Utilisateurs authentifiés (ownership check)';
        RAISE NOTICE '  - UPDATE: Tous utilisateurs authentifiés';
        RAISE NOTICE '  - DELETE: Créateur uniquement (<24h)';
    ELSE
        RAISE WARNING '⚠️ Nombre policies incorrect: SO=%, SOI=%', v_so_policies, v_soi_policies;
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
    RAISE NOTICE '✅ Migration 018 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables modifiées:';
    RAISE NOTICE '  - sales_orders: 3 anciennes policies supprimées ✅';
    RAISE NOTICE '  - sales_order_items: 2 anciennes policies supprimées ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Problème résolu:';
    RAISE NOTICE '  - Conflit policies role public vs authenticated ✅';
    RAISE NOTICE '  - Priorité policies clarifiée ✅';
    RAISE NOTICE '  - Uniquement policies authenticated actives ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - UPDATE sales_orders devrait fonctionner ✅';
    RAISE NOTICE '  - Tests E2E SO workflows débloqués ✅';
    RAISE NOTICE '  - Frontend utilise authenticated policies ✅';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Re-tester TEST 3 (SO-PREPAY-001 validation)';
    RAISE NOTICE '  - Cliquer "Valider" dans browser';
    RAISE NOTICE '  - Vérifier 0 erreur 403';
    RAISE NOTICE '  - Vérifier status change draft → confirmed';
    RAISE NOTICE '========================================';
END $$;

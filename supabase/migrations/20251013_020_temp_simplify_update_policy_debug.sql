-- =============================================
-- MIGRATION 020: TEMPORAIRE - Simplification Policy UPDATE pour Debug
-- Date: 2025-10-13
-- =============================================
-- Objectif: Isoler le problème RLS 403 en testant policy ultra-simple
-- Type: TEMPORAIRE - À ROLLBACK une fois bug identifié
-- Bug: Migration 019 restaure policies originales MAIS 403 persiste

-- =============================================
-- DIAGNOSTIC
-- =============================================
-- État actuel:
--   - Policies originales restaurées (migration 019) ✅
--   - user_profiles: Roméo a role='owner' ✅
--   - get_user_role() devrait retourner 'owner' ✅
--   - user_has_access_to_organisation(NULL) devrait retourner TRUE pour owner ✅
--   - MAIS: UPDATE sales_orders → 403 (code 42501) "new row violates RLS" ❌

-- Hypothèse à tester:
--   Le problème vient de user_has_access_to_organisation(get_user_organisation_id())
--   car get_user_organisation_id() retourne NULL pour un owner
--   Et peut-être que PostgreSQL ne gère pas bien NULL dans WITH CHECK

\echo '========================================';
\echo 'DEBUG: Simplification Policy UPDATE';
\echo '========================================';
\echo '';

\echo '=== AVANT: Policy UPDATE actuelle ===';
SELECT policyname, cmd, qual::text as using_clause, with_check::text
FROM pg_policies
WHERE tablename = 'sales_orders' AND cmd = 'UPDATE';

-- =============================================
-- ÉTAPE 1: Supprimer policy UPDATE actuelle
-- =============================================

\echo '';
\echo '=== SUPPRESSION: Policy UPDATE originale ===';

DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leurs commandes clients" ON sales_orders;

\echo '✅ Policy UPDATE supprimée';

-- =============================================
-- ÉTAPE 2: Créer policy UPDATE ultra-simple
-- =============================================

\echo '';
\echo '=== CRÉATION: Policy UPDATE ULTRA-SIMPLE pour debug ===';

-- Version 1: Bypass complet pour owner
CREATE POLICY "DEBUG_sales_orders_update_owner_bypass"
ON sales_orders
FOR UPDATE
USING (get_user_role() = 'owner')
WITH CHECK (get_user_role() = 'owner');

COMMENT ON POLICY "DEBUG_sales_orders_update_owner_bypass" ON sales_orders IS
'TEMPORAIRE DEBUG: Policy ultra-simple qui bypass toute vérification organisation.
Si cette policy fonctionne → Problème vient de user_has_access_to_organisation()
Si cette policy échoue aussi → Problème vient de get_user_role() ou auth.uid()
À ROLLBACK une fois debug terminé.';

\echo '✅ Policy UPDATE temporaire créée (owner bypass)';

-- =============================================
-- VÉRIFICATION
-- =============================================

\echo '';
\echo '=== APRÈS: Policy UPDATE temporaire ===';
SELECT policyname, cmd, qual::text as using_clause, with_check::text
FROM pg_policies
WHERE tablename = 'sales_orders' AND cmd = 'UPDATE';

-- =============================================
-- VALIDATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'VALIDATION DEBUG POLICY';
\echo '========================================';

DO $$
DECLARE
    v_policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'sales_orders'
      AND cmd = 'UPDATE'
      AND policyname = 'DEBUG_sales_orders_update_owner_bypass';

    IF v_policy_count = 1 THEN
        RAISE NOTICE '✅ Policy UPDATE temporaire créée';
        RAISE NOTICE '';
        RAISE NOTICE 'Test à effectuer:';
        RAISE NOTICE '  1. Browser: Cliquer "Valider" SO-PREPAY-001';
        RAISE NOTICE '  2. Si SUCCESS → Problème = user_has_access_to_organisation()';
        RAISE NOTICE '  3. Si ÉCHEC 403 → Problème = get_user_role() ou auth.uid()';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ ROLLBACK nécessaire après diagnostic';
    ELSE
        RAISE WARNING '❌ Policy temporaire non créée';
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- LOG
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 020 appliquée (TEMPORAIRE)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Action effectuée:';
    RAISE NOTICE '  - Policy UPDATE originale remplacée par version debug ✅';
    RAISE NOTICE '  - Bypass complet vérification organisation (owner only) ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Objectif:';
    RAISE NOTICE '  - Isoler si problème = user_has_access_to_organisation()';
    RAISE NOTICE '  - Ou si problème = get_user_role() / auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Re-tester SO-PREPAY-001 validation';
    RAISE NOTICE '========================================';
END $$;

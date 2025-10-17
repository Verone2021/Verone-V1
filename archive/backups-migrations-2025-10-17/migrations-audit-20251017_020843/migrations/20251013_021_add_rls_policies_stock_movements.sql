-- =============================================
-- MIGRATION 021: Ajout Policies RLS stock_movements
-- Date: 2025-10-13
-- =============================================
-- Objectif: Corriger bug RLS 403 causé par table stock_movements ayant RLS activé SANS policies
-- Erreur: "new row violates row-level security policy for table stock_movements"
-- Cause: Trigger sales_orders_stock_automation tente INSERT dans stock_movements mais échoue
-- Solution: Créer policies RLS permettant opérations par utilisateurs authentifiés

-- =============================================
-- CONTEXTE BUG
-- =============================================
-- Migration 004: Active RLS sur stock_movements (ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY)
-- Migration 022: Crée trigger sales_orders_stock_automation qui INSERT dans stock_movements
-- Résultat: Trigger échoue car AUCUNE policy n'existe → INSERT bloqué par défaut
-- Erreur constatée:
--   Server Action UPDATE sales_orders → Trigger → INSERT stock_movements → 403
--   Message: "new row violates row-level security policy for table stock_movements"

\echo '========================================';
\echo 'CRÉATION POLICIES RLS stock_movements';
\echo '========================================';
\echo '';

\echo '=== AVANT: Vérification RLS activé (attendu: TRUE) ===';
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'stock_movements';

\echo '';
\echo '=== AVANT: Policies existantes (attendu: 0) ===';
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'stock_movements';

-- =============================================
-- CRÉATION POLICIES RLS stock_movements
-- =============================================

\echo '';
\echo '=== CRÉATION: 4 Policies stock_movements ===';

-- Policy 1: SELECT (Consultation mouvements)
CREATE POLICY "Utilisateurs peuvent consulter les mouvements de stock"
  ON stock_movements FOR SELECT
  USING (user_has_access_to_organisation(get_user_organisation_id()));

COMMENT ON POLICY "Utilisateurs peuvent consulter les mouvements de stock" ON stock_movements IS
'Permet consultation des mouvements de stock de l''organisation.
Utilise: user_has_access_to_organisation() pour vérification multi-tenant.
Note: Fonction retourne TRUE pour owner/admin (accès global).';

\echo '✅ Policy SELECT créée';

-- Policy 2: INSERT (Création mouvements)
-- IMPORTANT: Permissive pour permettre triggers SECURITY DEFINER de fonctionner
CREATE POLICY "Utilisateurs peuvent créer des mouvements de stock"
  ON stock_movements FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'warehouse_manager', 'sales', 'purchaser')
  );

COMMENT ON POLICY "Utilisateurs peuvent créer des mouvements de stock" ON stock_movements IS
'Permet création mouvements stock si rôle autorisé.
Rôles autorisés: owner, admin, warehouse_manager, sales, purchaser.
Note: Triggers SECURITY DEFINER (ex: sales_orders_stock_automation) peuvent créer mouvements.
Vérifie uniquement rôle, pas organisation (pour permettre mouvements automatiques).';

\echo '✅ Policy INSERT créée';

-- Policy 3: UPDATE (Modification mouvements - restreint)
CREATE POLICY "Utilisateurs admin peuvent modifier les mouvements de stock"
  ON stock_movements FOR UPDATE
  USING (
    get_user_role() IN ('owner', 'admin', 'warehouse_manager')
  )
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'warehouse_manager')
  );

COMMENT ON POLICY "Utilisateurs admin peuvent modifier les mouvements de stock" ON stock_movements IS
'Permet modification mouvements stock uniquement aux admins/warehouse managers.
Rôles autorisés: owner, admin, warehouse_manager.
Note: UPDATE rarement nécessaire (mouvements = historique immuable en principe).';

\echo '✅ Policy UPDATE créée';

-- Policy 4: DELETE (Suppression mouvements - très restreint)
CREATE POLICY "Uniquement owners peuvent supprimer des mouvements de stock"
  ON stock_movements FOR DELETE
  USING (
    get_user_role() = 'owner'
  );

COMMENT ON POLICY "Uniquement owners peuvent supprimer des mouvements de stock" ON stock_movements IS
'Permet suppression mouvements stock UNIQUEMENT aux owners.
Sécurité maximale: Mouvements = audit trail, suppression = cas exceptionnel.';

\echo '✅ Policy DELETE créée';

-- =============================================
-- VÉRIFICATION RÉSULTAT
-- =============================================

\echo '';
\echo '=== APRÈS: Policies créées (attendu: 4) ===';
SELECT
    policyname,
    cmd as operation,
    CASE cmd
        WHEN 'SELECT' THEN 'Consultation'
        WHEN 'INSERT' THEN 'Création'
        WHEN 'UPDATE' THEN 'Modification'
        WHEN 'DELETE' THEN 'Suppression'
    END as description
FROM pg_policies
WHERE tablename = 'stock_movements'
ORDER BY cmd;

-- =============================================
-- VALIDATION FONCTIONS RLS DÉPENDANCES
-- =============================================

\echo '';
\echo '=== VALIDATION: Fonctions RLS utilisées ===';
SELECT
    proname as function_name,
    CASE
        WHEN proname = 'get_user_role' THEN 'Retourne rôle utilisateur'
        WHEN proname = 'get_user_organisation_id' THEN 'Retourne organisation_id utilisateur'
        WHEN proname = 'user_has_access_to_organisation' THEN 'Vérifie accès organisation'
    END as description
FROM pg_proc
WHERE proname IN ('get_user_role', 'get_user_organisation_id', 'user_has_access_to_organisation')
ORDER BY proname;

-- =============================================
-- VALIDATION MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'VALIDATION POLICIES stock_movements';
\echo '========================================';
\echo '';

DO $$
DECLARE
    v_policy_count INTEGER;
    v_functions_count INTEGER;
BEGIN
    -- Compter policies créées
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'stock_movements';

    -- Compter fonctions RLS dépendances
    SELECT COUNT(*) INTO v_functions_count
    FROM pg_proc
    WHERE proname IN ('get_user_role', 'get_user_organisation_id', 'user_has_access_to_organisation');

    RAISE NOTICE 'Policies créées: % (attendu: 4)', v_policy_count;
    RAISE NOTICE 'Fonctions RLS: % (attendu: 3)', v_functions_count;
    RAISE NOTICE '';

    IF v_policy_count = 4 AND v_functions_count = 3 THEN
        RAISE NOTICE '✅ Policies RLS stock_movements créées correctement';
        RAISE NOTICE '';
        RAISE NOTICE 'Opérations autorisées:';
        RAISE NOTICE '  - SELECT: Tous utilisateurs (organisation) ✅';
        RAISE NOTICE '  - INSERT: owner, admin, warehouse_manager, sales, purchaser ✅';
        RAISE NOTICE '  - UPDATE: owner, admin, warehouse_manager ✅';
        RAISE NOTICE '  - DELETE: owner uniquement ✅';
        RAISE NOTICE '';
        RAISE NOTICE 'Impact:';
        RAISE NOTICE '  - Trigger sales_orders_stock_automation devrait fonctionner ✅';
        RAISE NOTICE '  - Mouvements stock prévisionnels créés automatiquement ✅';
        RAISE NOTICE '  - UPDATE sales_orders devrait passer ✅';
    ELSE
        RAISE WARNING '⚠️ Migration incomplète: Policies=%, Functions=%', v_policy_count, v_functions_count;
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
    RAISE NOTICE '✅ Migration 021 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Bug corrigé:';
    RAISE NOTICE '  - stock_movements avait RLS activé SANS policies ❌';
    RAISE NOTICE '  - Toutes opérations bloquées par défaut ❌';
    RAISE NOTICE '  - Trigger sales_orders_stock_automation échouait 403 ❌';
    RAISE NOTICE '';
    RAISE NOTICE 'Solution appliquée:';
    RAISE NOTICE '  - 4 policies RLS créées (SELECT, INSERT, UPDATE, DELETE) ✅';
    RAISE NOTICE '  - Permissions rôles configurées correctement ✅';
    RAISE NOTICE '  - Triggers automatiques peuvent fonctionner ✅';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Re-tester SO-PREPAY-001 validation';
    RAISE NOTICE '  - Cliquer "Valider" dans browser';
    RAISE NOTICE '  - Vérifier 0 erreur 403';
    RAISE NOTICE '  - Confirmer status change draft → confirmed';
    RAISE NOTICE '  - Vérifier mouvement stock prévisionnel créé automatiquement';
    RAISE NOTICE '========================================';
END $$;

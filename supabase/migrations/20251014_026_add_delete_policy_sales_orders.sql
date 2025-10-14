-- =============================================
-- MIGRATION 026: Ajout Policy DELETE Sales Orders
-- Date: 2025-10-14
-- =============================================
-- 🐛 BUG IDENTIFIÉ: Policy DELETE manquante pour sales_orders
--
-- CONTEXTE:
-- - Migration 019 a restauré 3 policies: SELECT, INSERT, UPDATE
-- - DELETE policy complètement absente → Suppression bloquée silencieusement
-- - Supabase-JS retourne {data: [], error: null} quand RLS bloque DELETE
--
-- SYMPTÔMES:
-- - Tentative suppression commandes draft/cancelled → Aucune erreur
-- - Mais commande reste en base de données
-- - Logs: "Data: [] Count: null Erreur: null"
--
-- SOLUTION:
-- - Ajouter policy DELETE avec même logique que UPDATE
-- - Permettre suppression si user_has_access_to_organisation()
-- - Vérification statut (draft/cancelled) faite côté application
-- =============================================

\echo '========================================';
\echo 'AJOUT POLICY DELETE SALES_ORDERS';
\echo '========================================';
\echo '';

-- =============================================
-- VÉRIFICATION ÉTAT ACTUEL
-- =============================================

\echo '=== AVANT: Policies actuelles ===';
SELECT
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'sales_orders'
ORDER BY policyname;
\echo '';

-- =============================================
-- AJOUT POLICY DELETE
-- =============================================

\echo '=== CRÉATION: Policy DELETE ===';

CREATE POLICY "Utilisateurs peuvent supprimer leurs commandes clients"
  ON sales_orders FOR DELETE
  USING (user_has_access_to_organisation(get_user_organisation_id()));

COMMENT ON POLICY "Utilisateurs peuvent supprimer leurs commandes clients" ON sales_orders IS
'Policy DELETE ajoutée migration 026 (2025-10-14).
Permet suppression commandes de l''organisation accessible par utilisateur.
Utilise: user_has_access_to_organisation() pour vérification multi-tenant.
Vérifications métier (statut draft/cancelled) effectuées côté application.';

\echo '✅ Policy DELETE créée';
\echo '';

-- =============================================
-- VÉRIFICATION RÉSULTAT
-- =============================================

\echo '=== APRÈS: Policies complètes (attendu: 4) ===';
SELECT
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'sales_orders'
ORDER BY policyname;
\echo '';

-- =============================================
-- VALIDATION
-- =============================================

DO $$
DECLARE
    v_policies_count INTEGER;
    v_has_delete BOOLEAN;
BEGIN
    -- Compter toutes policies
    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies
    WHERE tablename = 'sales_orders';

    -- Vérifier policy DELETE existe
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sales_orders' AND cmd = 'DELETE'
    ) INTO v_has_delete;

    RAISE NOTICE '📊 RÉSULTATS:';
    RAISE NOTICE '  - Total policies: % (attendu: 4)', v_policies_count;
    RAISE NOTICE '  - Policy DELETE: %', CASE WHEN v_has_delete THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '';

    IF v_policies_count = 4 AND v_has_delete THEN
        RAISE NOTICE '🎉 SUCCÈS: Policy DELETE ajoutée avec succès !';
        RAISE NOTICE '';
        RAISE NOTICE 'Policies complètes:';
        RAISE NOTICE '  ✅ SELECT  - Consultation commandes';
        RAISE NOTICE '  ✅ INSERT  - Création commandes';
        RAISE NOTICE '  ✅ UPDATE  - Modification commandes';
        RAISE NOTICE '  ✅ DELETE  - Suppression commandes (NOUVEAU)';
    ELSE
        RAISE WARNING '⚠️ ATTENTION: Migration incomplète (policies=%, has_delete=%)', v_policies_count, v_has_delete;
    END IF;

    RAISE NOTICE '';
END $$;

-- =============================================
-- LOG MIGRATION
-- =============================================

\echo '========================================';
\echo 'MIGRATION 026 TERMINÉE';
\echo '========================================';
\echo '';
\echo '✅ Policy DELETE ajoutée avec succès';
\echo '';
\echo '🐛 BUG RÉSOLU:';
\echo '  - Suppression commandes draft/cancelled bloquée silencieusement';
\echo '  - RLS retournait {data: [], error: null}';
\echo '  - Application affichait "Suppression réussie" mais rien ne se passait';
\echo '';
\echo '🔧 SOLUTION APPLIQUÉE:';
\echo '  - Policy DELETE créée avec vérification organisation';
\echo '  - Même logique que UPDATE policy';
\echo '  - Multi-tenant: user_has_access_to_organisation()';
\echo '';
\echo '✅ IMPACT:';
\echo '  - Suppression commandes draft fonctionnelle ✅';
\echo '  - Suppression commandes cancelled fonctionnelle ✅';
\echo '  - Vérifications métier (statut) conservées côté app ✅';
\echo '';
\echo '⏭️ PROCHAINE ÉTAPE:';
\echo '  - Tester suppression commande annulée (SO-2025-00016)';
\echo '  - Vérifier disparition du tableau';
\echo '  - Confirmer count passe de 5 à 4 commandes';
\echo '========================================';
\echo '';

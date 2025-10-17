-- =============================================
-- MIGRATION 013: Suppression Trigger Doublon sales_orders_stock_automation
-- Date: 2025-10-13
-- =============================================
-- Problème: 2 triggers créent TOUS LES DEUX des mouvements forecast stock
-- Résultat: Duplication mouvements + triple comptabilisation stock_forecasted_out
-- Solution: DROP trigger sales_orders_stock_automation, garder trigger_sales_order_stock

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Migration 012 a découvert 3 triggers stock sur sales_orders:
--   1. sales_orders_stock_automation → create_sales_order_forecast_movements()
--   2. trigger_sales_order_stock (INSERT) → handle_sales_order_stock()
--   3. trigger_sales_order_stock (UPDATE) → handle_sales_order_stock()

-- Les triggers 1 et 2 créent TOUS LES DEUX des mouvements forecast lors SO Confirmed
-- → Même problème triplication que purchase_orders avant migration 003 !

-- DÉCISION: Garder trigger_sales_order_stock (plus complet, gère 4 cas)
--   - Cas 1: Commande confirmée → Stock prévisionnel OUT
--   - Cas 2: Paiement reçu → Préparer expédition
--   - Cas 3: Sortie entrepôt → Déduction stock réel
--   - Cas 4: Annulation → Restauration stock

-- SUPPRESSION: sales_orders_stock_automation (doublon partiel)
--   - Ne gère que Cas 1 (commande confirmée)
--   - Fonction create_sales_order_forecast_movements() devient inutilisée

-- =============================================
-- ÉTAPE 1: Vérification Triggers Existants
-- =============================================

\echo '========================================';
\echo 'SUPPRESSION TRIGGER DOUBLON';
\echo '========================================';
\echo '';

\echo '=== AVANT: Triggers Stock sur sales_orders ===';
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sales_orders'
AND (
    action_statement LIKE '%stock%'
    OR action_statement LIKE '%forecast%'
    OR trigger_name LIKE '%stock%'
)
ORDER BY trigger_name;

-- =============================================
-- ÉTAPE 2: Suppression Trigger Doublon
-- =============================================

\echo '';
\echo '=== SUPPRESSION: sales_orders_stock_automation ===';

DROP TRIGGER IF EXISTS sales_orders_stock_automation ON sales_orders;

\echo '✅ Trigger sales_orders_stock_automation supprimé';

-- =============================================
-- ÉTAPE 3: Suppression Fonction Wrapper (optionnel)
-- =============================================

\echo '';
\echo '=== SUPPRESSION: Fonction wrapper trg_sales_orders_stock_automation ===';

-- Note: Fonction create_sales_order_forecast_movements() CONSERVÉE
-- Elle pourrait être utilisée manuellement ou par d'autres workflows
-- Seule la fonction wrapper du trigger est supprimée

DROP FUNCTION IF EXISTS trg_sales_orders_stock_automation() CASCADE;

\echo '✅ Fonction wrapper supprimée';

-- =============================================
-- ÉTAPE 4: Vérification Architecture Finale
-- =============================================

\echo '';
\echo '=== APRÈS: Triggers Stock sur sales_orders ===';
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sales_orders'
AND (
    action_statement LIKE '%stock%'
    OR action_statement LIKE '%forecast%'
    OR trigger_name LIKE '%stock%'
)
ORDER BY trigger_name;

-- =============================================
-- ÉTAPE 5: Validation Architecture
-- =============================================

\echo '';
\echo '=== VALIDATION: Comptage Triggers Stock ===';

DO $$
DECLARE
    v_stock_triggers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_stock_triggers_count
    FROM information_schema.triggers
    WHERE event_object_table = 'sales_orders'
    AND (
        action_statement LIKE '%stock%'
        OR action_statement LIKE '%forecast%'
        OR trigger_name LIKE '%stock%'
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDATION ARCHITECTURE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Triggers STOCK sur sales_orders: %', v_stock_triggers_count;
    RAISE NOTICE '';

    IF v_stock_triggers_count = 2 THEN
        -- 2 triggers: INSERT + UPDATE (même fonction handle_sales_order_stock)
        RAISE NOTICE '✅ ARCHITECTURE CORRECTE';
        RAISE NOTICE '   - trigger_sales_order_stock (INSERT)';
        RAISE NOTICE '   - trigger_sales_order_stock (UPDATE)';
        RAISE NOTICE '   - Fonction: handle_sales_order_stock()';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Duplication résolue';
        RAISE NOTICE '   - 1 seule fonction gère tous les cas';
        RAISE NOTICE '   - Pas de doublons mouvements stock';
    ELSIF v_stock_triggers_count > 2 THEN
        RAISE WARNING '⚠️ ATTENTION: % triggers stock (attendu: 2)', v_stock_triggers_count;
        RAISE WARNING '→ Duplication encore présente';
    ELSE
        RAISE WARNING '⚠️ ATTENTION: % trigger stock (attendu: 2)', v_stock_triggers_count;
        RAISE WARNING '→ Vérifier configuration';
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
    RAISE NOTICE '✅ Migration 013 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Modifications:';
    RAISE NOTICE '  - DROP TRIGGER sales_orders_stock_automation ✅';
    RAISE NOTICE '  - DROP FUNCTION trg_sales_orders_stock_automation() ✅';
    RAISE NOTICE '  - CONSERVÉ: trigger_sales_order_stock (INSERT + UPDATE) ✅';
    RAISE NOTICE '  - CONSERVÉ: create_sales_order_forecast_movements() (usage manuel) ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Duplication triggers résolue ✅';
    RAISE NOTICE '  - 1 seule fonction gère mouvements stock SO ✅';
    RAISE NOTICE '  - Fin doublons mouvements forecast ✅';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Migration 014 (supprimer UPDATE direct products)';
    RAISE NOTICE '========================================';
END $$;

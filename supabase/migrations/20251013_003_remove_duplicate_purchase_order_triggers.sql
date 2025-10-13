-- =============================================
-- MIGRATION: Suppression Triggers Redondants Purchase Orders
-- Date: 2025-10-13
-- =============================================
-- Problème: 3 triggers concurrents créent chacun un mouvement stock → Triplication (×3)
-- Solution: Garder uniquement handle_purchase_order_forecast (workflow complet + architecture propre)
-- Supprimer: trg_purchase_orders_stock_automation + handle_purchase_order_stock (redondants)

-- =============================================
-- ANALYSE SITUATION ACTUELLE
-- =============================================

-- 3 triggers AFTER UPDATE sur purchase_orders:
--
-- 1. purchase_order_forecast_trigger → handle_purchase_order_forecast()
--    - Workflow: confirmed, received, cancelled
--    - Action: INSERT stock_movements (affects_forecast=true)
--    - Recalcul: Automatique via trigger recalculate_forecasted
--    - Architecture: PROPRE (séparation responsabilités)
--
-- 2. purchase_orders_stock_automation → trg_purchase_orders_stock_automation()
--    - Workflow: confirmed, cancelled SEULEMENT
--    - Action: Appelle create_purchase_order_forecast_movements()
--    - → INSERT stock_movements + UPDATE products directement
--    - Architecture: REDONDANTE (double UPDATE avec recalculate)
--
-- 3. trigger_purchase_order_stock → handle_purchase_order_stock()
--    - Workflow: confirmed, received, cancelled
--    - Action: INSERT stock_movements + UPDATE products directement
--    - Architecture: REDONDANTE (double UPDATE avec recalculate)

-- PROBLÈME DÉCOUVERT:
-- Lors de status → confirmed, les 3 triggers s'exécutent:
-- - Trigger 1: INSERT mouvement (10)
-- - Trigger 2: INSERT mouvement (10)
-- - Trigger 3: INSERT mouvement (10)
-- → recalculate_forecasted_stock() fait SUM(quantity_change) = 30 ❌
-- → stock_forecasted_in = 30 au lieu de 10

-- SOLUTION:
-- Garder UNIQUEMENT trigger 1 (handle_purchase_order_forecast)
-- Supprimer triggers 2 et 3 (redondants)

-- =============================================
-- SUPPRESSION TRIGGERS REDONDANTS
-- =============================================

-- Supprimer trigger 2 (workflow incomplet)
DROP TRIGGER IF EXISTS purchase_orders_stock_automation ON purchase_orders;

RAISE NOTICE '✅ Trigger purchase_orders_stock_automation supprimé';

-- Supprimer trigger 3 (double UPDATE redondant)
DROP TRIGGER IF EXISTS trigger_purchase_order_stock ON purchase_orders;

RAISE NOTICE '✅ Trigger trigger_purchase_order_stock supprimé';

-- =============================================
-- VÉRIFICATION TRIGGER RESTANT
-- =============================================

-- Trigger 1 (purchase_order_forecast_trigger) reste actif
-- Vérifions qu'il existe bien
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'purchase_order_forecast_trigger'
        AND event_object_table = 'purchase_orders'
    ) THEN
        RAISE NOTICE '✅ Trigger purchase_order_forecast_trigger actif (MASTER)';
        RAISE NOTICE '   → Gère workflow: confirmed, received, cancelled';
        RAISE NOTICE '   → Crée mouvements avec affects_forecast=true';
        RAISE NOTICE '   → Recalcul automatique via trigger recalculate_forecasted';
    ELSE
        RAISE EXCEPTION '❌ ERREUR: Trigger purchase_order_forecast_trigger introuvable!';
    END IF;
END $$;

-- =============================================
-- NETTOYAGE FONCTIONS ORPHELINES (Optionnel)
-- =============================================

-- Les fonctions peuvent être gardées pour référence historique
-- ou supprimées si plus utilisées ailleurs

-- Option A: Garder les fonctions (commenté par défaut)
-- COMMENT ON FUNCTION handle_purchase_order_stock() IS 'DEPRECATED: Remplacé par handle_purchase_order_forecast()';
-- COMMENT ON FUNCTION trg_purchase_orders_stock_automation() IS 'DEPRECATED: Workflow incomplet, trigger supprimé';

-- Option B: Supprimer les fonctions (décommenté si validation OK)
-- DROP FUNCTION IF EXISTS handle_purchase_order_stock() CASCADE;
-- DROP FUNCTION IF EXISTS trg_purchase_orders_stock_automation() CASCADE;
-- DROP FUNCTION IF EXISTS create_purchase_order_forecast_movements(UUID, UUID) CASCADE;

-- RECOMMANDATION: Garder les fonctions en production pour rollback facile
-- Supprimer après validation complète (1-2 semaines)

-- =============================================
-- VALIDATION ARCHITECTURE FINALE
-- =============================================

DO $$
DECLARE
    v_trigger_count INTEGER;
BEGIN
    -- Compter triggers AFTER UPDATE sur purchase_orders
    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers
    WHERE event_object_table = 'purchase_orders'
    AND action_timing = 'AFTER'
    AND event_manipulation = 'UPDATE'
    AND trigger_name LIKE '%stock%';

    IF v_trigger_count = 1 THEN
        RAISE NOTICE '✅ Architecture validée: 1 seul trigger stock sur purchase_orders';
    ELSIF v_trigger_count > 1 THEN
        RAISE WARNING '⚠️ ATTENTION: % triggers stock détectés (attendu: 1)', v_trigger_count;
    ELSE
        RAISE EXCEPTION '❌ ERREUR: Aucun trigger stock actif!';
    END IF;
END $$;

-- =============================================
-- TESTS RECOMMANDÉS POST-MIGRATION
-- =============================================

-- Test 1: Workflow PO Draft → Confirmed
-- UPDATE purchase_orders SET status = 'confirmed', validated_at = NOW(), sent_at = NOW() WHERE po_number = 'PO-TEST';
-- Vérification attendue:
-- - 1 seul mouvement créé dans stock_movements
-- - stock_forecasted_in = quantité commande (×1 pas ×3)

-- Test 2: Workflow PO Confirmed → Received
-- UPDATE purchase_orders SET status = 'received', received_at = NOW() WHERE po_number = 'PO-TEST';
-- Vérification attendue:
-- - 2 mouvements créés (OUT prévisionnel + IN réel)
-- - stock_forecasted_in = 0
-- - stock_real = quantité commande

-- Test 3: Workflow PO Confirmed → Cancelled
-- UPDATE purchase_orders SET status = 'cancelled', cancelled_at = NOW() WHERE po_number = 'PO-TEST';
-- Vérification attendue:
-- - 1 mouvement OUT créé (annulation prévisionnel)
-- - stock_forecasted_in = 0

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_003 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Triggers supprimés:';
    RAISE NOTICE '  - purchase_orders_stock_automation (workflow incomplet)';
    RAISE NOTICE '  - trigger_purchase_order_stock (double UPDATE redondant)';
    RAISE NOTICE '';
    RAISE NOTICE 'Trigger actif (MASTER):';
    RAISE NOTICE '  - purchase_order_forecast_trigger → handle_purchase_order_forecast()';
    RAISE NOTICE '  - Workflow: confirmed, received, cancelled';
    RAISE NOTICE '  - Architecture: Mouvements + Recalcul automatique';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Triplication stocks résolue (×3 → ×1)';
    RAISE NOTICE '  - 1 seul mouvement créé par transition';
    RAISE NOTICE '  - Recalcul automatique via recalculate_forecasted_stock()';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: Workflow PO complet (draft → confirmed → received)';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- CLEANUP: Supprimer Triggers Obsolètes (Doublons)
-- Date: 2025-11-20
-- Priority: P0 - BLOQUANT
-- =====================================================
-- RAISON: 3 triggers AFTER INSERT sur purchase_order_receptions créent conflit
-- SYMPTÔME: Stock réel DOUBLÉ (TEST 7: stock_real=25 au lieu de 15)
-- CAUSE: Triggers handle_purchase_reception() + trg_purchase_receptions_stock_automation()
--        ajoutent CHACUN NEW.quantity_received au stock_real
-- SOLUTION: Garder UNIQUEMENT trigger_reception_update_stock (migration 163000)
-- =====================================================

-- =============================================================================
-- ÉTAPE 1: Supprimer triggers obsolètes sur purchase_order_receptions
-- =============================================================================

DROP TRIGGER IF EXISTS purchase_receptions_stock_automation ON purchase_order_receptions CASCADE;
DROP TRIGGER IF EXISTS trigger_purchase_reception ON purchase_order_receptions CASCADE;

-- Note: On garde trigger_reception_update_stock (migration 163000)

-- =============================================================================
-- ÉTAPE 2: Supprimer fonctions associées aux triggers obsolètes
-- =============================================================================

DROP FUNCTION IF EXISTS trg_purchase_receptions_stock_automation() CASCADE;
DROP FUNCTION IF EXISTS handle_purchase_reception() CASCADE;

-- Note: On garde update_stock_on_reception() (migration 163000)

-- =============================================================================
-- ÉTAPE 3: VÉRIFICATION - Il doit rester EXACTEMENT 1 trigger
-- =============================================================================

DO $$
DECLARE
    v_trigger_count INTEGER;
    v_trigger_name TEXT;
    v_function_name TEXT;
BEGIN
    -- Compter triggers restants sur purchase_order_receptions
    SELECT COUNT(*), string_agg(t.tgname, ', ')
    INTO v_trigger_count, v_trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'purchase_order_receptions'
      AND NOT t.tgisinternal;

    -- Vérifier qu'il reste exactement 1 trigger
    IF v_trigger_count != 1 THEN
        RAISE EXCEPTION 'ERREUR: % triggers trouvés sur purchase_order_receptions (1 attendu). Triggers: %',
            v_trigger_count, COALESCE(v_trigger_name, 'aucun');
    END IF;

    -- Vérifier que c'est le bon trigger
    SELECT t.tgname INTO v_trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'purchase_order_receptions'
      AND NOT t.tgisinternal;

    IF v_trigger_name != 'trigger_reception_update_stock' THEN
        RAISE EXCEPTION 'ERREUR: Trigger restant = "%" (attendu "trigger_reception_update_stock")',
            v_trigger_name;
    END IF;

    -- Vérifier la fonction associée
    SELECT p.proname INTO v_function_name
    FROM pg_proc p
    JOIN pg_trigger t ON t.tgfoid = p.oid
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'purchase_order_receptions'
      AND NOT t.tgisinternal;

    IF v_function_name != 'update_stock_on_reception' THEN
        RAISE EXCEPTION 'ERREUR: Fonction trigger = "%" (attendu "update_stock_on_reception")',
            v_function_name;
    END IF;

    -- Rapport succès
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ CLEANUP TRIGGERS RÉUSSI';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'Triggers supprimés: 2';
    RAISE NOTICE '  ❌ purchase_receptions_stock_automation';
    RAISE NOTICE '  ❌ trigger_purchase_reception';
    RAISE NOTICE '';
    RAISE NOTICE 'Fonctions supprimées: 2';
    RAISE NOTICE '  ❌ trg_purchase_receptions_stock_automation()';
    RAISE NOTICE '  ❌ handle_purchase_reception()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trigger actif: %', v_trigger_name;
    RAISE NOTICE '   Fonction: %', v_function_name;
    RAISE NOTICE '   Table: purchase_order_receptions';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- ÉTAPE 4: Cleanup similaire pour sales_order_shipments (prévention)
-- =============================================================================

-- Supprimer triggers obsolètes s'ils existent (même pattern que réceptions)
DROP TRIGGER IF EXISTS sales_shipments_stock_automation ON sales_order_shipments CASCADE;
DROP TRIGGER IF EXISTS trigger_sales_shipment ON sales_order_shipments CASCADE;

DROP FUNCTION IF EXISTS trg_sales_shipments_stock_automation() CASCADE;
DROP FUNCTION IF EXISTS handle_sales_shipment() CASCADE;

-- Note: On garde trigger_shipment_update_stock si existant (migration 163000)

-- Vérification finale
DO $$
DECLARE
    v_shipment_trigger_count INTEGER;
    v_shipment_triggers TEXT;
BEGIN
    SELECT COUNT(*), string_agg(t.tgname, ', ')
    INTO v_shipment_trigger_count, v_shipment_triggers
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'sales_order_shipments'
      AND NOT t.tgisinternal;

    IF v_shipment_trigger_count > 1 THEN
        RAISE WARNING 'ATTENTION: % triggers sur sales_order_shipments (vérifier manuellement): %',
            v_shipment_trigger_count, v_shipment_triggers;
    ELSIF v_shipment_trigger_count = 0 THEN
        RAISE NOTICE '⚠️  Aucun trigger sur sales_order_shipments (peut être normal si pas encore créé)';
    ELSE
        RAISE NOTICE '✅ 1 seul trigger sur sales_order_shipments: %', v_shipment_triggers;
    END IF;
END $$;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION update_stock_on_reception() IS
'✅ FONCTION OFFICIELLE - Gère réception fournisseur (stock_real +, forecasted_in -)
Créée par: 20251120163000_restore_purchase_order_stock_triggers.sql
Trigger: trigger_reception_update_stock AFTER INSERT ON purchase_order_receptions
Responsabilités:
  1. Incrémente products.stock_real (+quantity_received)
  2. Décrémente products.stock_forecasted_in (-quantity_received)
  3. Met à jour purchase_order_items.quantity_received
  4. Change statut PO (partially_received → received si complet)
  5. Déclenche notifications alertes stock';

-- =====================================================
-- MIGRATION CRITIQUE : Restaurer Triggers INSERT Stock
-- Date: 2025-11-24
-- Priority: P0 - BLOQUANT
-- =====================================================
-- RAISON : Triggers INSERT supprimés par rollback 20251120162000
--          Les fonctions existent (migration 005) mais pas les triggers associés
-- IMPACT : Aucun stock ne se met à jour lors des réceptions/expéditions
-- =====================================================

-- =============================================================================
-- TRIGGER INSERT : Réceptions (purchase_order_receptions)
-- =============================================================================
-- Ce trigger déclenche update_stock_on_reception() APRÈS chaque INSERT
-- pour mettre à jour stock_real et créer un mouvement de stock

DROP TRIGGER IF EXISTS trigger_reception_update_stock ON purchase_order_receptions;

CREATE TRIGGER trigger_reception_update_stock
    AFTER INSERT ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_reception();

COMMENT ON TRIGGER trigger_reception_update_stock ON purchase_order_receptions IS
'Déclenché APRÈS INSERT sur une réception pour:
- Augmenter stock_real du produit
- Diminuer stock_forecasted_in
- Créer mouvement stock (reference_type=reception)
- Mettre à jour statut PO si complète';

-- =============================================================================
-- TRIGGER INSERT : Expéditions (sales_order_shipments)
-- =============================================================================
-- Ce trigger déclenche update_stock_on_shipment() APRÈS chaque INSERT
-- pour mettre à jour stock_real et créer un mouvement de stock

DROP TRIGGER IF EXISTS trigger_shipment_update_stock ON sales_order_shipments;

CREATE TRIGGER trigger_shipment_update_stock
    AFTER INSERT ON sales_order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_shipment();

COMMENT ON TRIGGER trigger_shipment_update_stock ON sales_order_shipments IS
'Déclenché APRÈS INSERT sur une expédition pour:
- Diminuer stock_real du produit
- Diminuer stock_forecasted_out
- Créer mouvement stock (reference_type=shipment)
- Mettre à jour statut SO si complète';

-- =============================================================================
-- VALIDATION
-- =============================================================================

DO $$
DECLARE
    v_reception_trigger_exists BOOLEAN;
    v_shipment_trigger_exists BOOLEAN;
    v_reception_function_exists BOOLEAN;
    v_shipment_function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 011: TRIGGERS INSERT RESTAURÉS';
    RAISE NOTICE '═══════════════════════════════════════════════════════';

    -- Vérifier fonctions
    SELECT EXISTS(
        SELECT 1 FROM pg_proc WHERE proname = 'update_stock_on_reception'
    ) INTO v_reception_function_exists;

    SELECT EXISTS(
        SELECT 1 FROM pg_proc WHERE proname = 'update_stock_on_shipment'
    ) INTO v_shipment_function_exists;

    -- Vérifier triggers
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE c.relname = 'purchase_order_receptions'
        AND t.tgname = 'trigger_reception_update_stock'
    ) INTO v_reception_trigger_exists;

    SELECT EXISTS(
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE c.relname = 'sales_order_shipments'
        AND t.tgname = 'trigger_shipment_update_stock'
    ) INTO v_shipment_trigger_exists;

    -- Rapport
    IF v_reception_function_exists THEN
        RAISE NOTICE '✅ Fonction update_stock_on_reception() existe';
    ELSE
        RAISE EXCEPTION '❌ Fonction update_stock_on_reception() MANQUANTE - Appliquer migration 005 d''abord';
    END IF;

    IF v_shipment_function_exists THEN
        RAISE NOTICE '✅ Fonction update_stock_on_shipment() existe';
    ELSE
        RAISE EXCEPTION '❌ Fonction update_stock_on_shipment() MANQUANTE - Appliquer migration 005 d''abord';
    END IF;

    IF v_reception_trigger_exists THEN
        RAISE NOTICE '✅ Trigger trigger_reception_update_stock créé sur purchase_order_receptions';
    ELSE
        RAISE EXCEPTION '❌ Trigger trigger_reception_update_stock ÉCHEC';
    END IF;

    IF v_shipment_trigger_exists THEN
        RAISE NOTICE '✅ Trigger trigger_shipment_update_stock créé sur sales_order_shipments';
    ELSE
        RAISE EXCEPTION '❌ Trigger trigger_shipment_update_stock ÉCHEC';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🎯 Architecture Stock maintenant complète:';
    RAISE NOTICE '   - Triggers INSERT ✅ (cette migration)';
    RAISE NOTICE '   - Triggers DELETE ✅ (migrations 001-002)';
    RAISE NOTICE '   - Triggers UPDATE ✅ (migrations 003-004)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Flux Stock:';
    RAISE NOTICE '   INSERT réception → update_stock_on_reception() → stock_real++';
    RAISE NOTICE '   INSERT expédition → update_stock_on_shipment() → stock_real--';
    RAISE NOTICE '';
END $$;

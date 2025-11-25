-- =====================================================
-- MIGRATION : Reset & Validation Architecture Stock
-- Date: 2025-11-24
-- Priority: P0 - STABILISATION
-- =====================================================
-- CONTEXTE : Données de test supprimées, production avec données factices
-- OBJECTIF : Nettoyer et valider l'architecture stock complète
-- =====================================================

-- =============================================================================
-- ÉTAPE 1 : Reset stock à 0 (données factices, production propre)
-- =============================================================================

DO $$
DECLARE
    v_products_reset INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🔄 RESET STOCK POUR PRODUCTION PROPRE';
    RAISE NOTICE '═══════════════════════════════════════════════════════';

    -- Reset tous les compteurs stock
    UPDATE products
    SET
        stock_real = 0,
        stock_forecasted_in = 0,
        stock_forecasted_out = 0,
        updated_at = NOW()
    WHERE stock_real != 0
       OR stock_forecasted_in != 0
       OR stock_forecasted_out != 0;

    GET DIAGNOSTICS v_products_reset = ROW_COUNT;
    RAISE NOTICE '✅ % produits remis à stock=0', v_products_reset;
END $$;

-- =============================================================================
-- ÉTAPE 2 : Nettoyer mouvements de stock orphelins
-- =============================================================================

DO $$
DECLARE
    v_movements_deleted INTEGER;
BEGIN
    -- Supprimer mouvements avec ancien format reference_type
    DELETE FROM stock_movements
    WHERE reference_type NOT IN ('reception', 'shipment')
       OR reference_type IS NULL;

    GET DIAGNOSTICS v_movements_deleted = ROW_COUNT;
    RAISE NOTICE '✅ % mouvements orphelins/invalides supprimés', v_movements_deleted;
END $$;

-- =============================================================================
-- ÉTAPE 3 : Validation Architecture Complète
-- =============================================================================

DO $$
DECLARE
    v_trigger_count INTEGER;
    v_reception_insert BOOLEAN := FALSE;
    v_reception_delete BOOLEAN := FALSE;
    v_reception_update BOOLEAN := FALSE;
    v_shipment_insert BOOLEAN := FALSE;
    v_shipment_delete BOOLEAN := FALSE;
    v_shipment_update BOOLEAN := FALSE;
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🔍 VALIDATION ARCHITECTURE STOCK';
    RAISE NOTICE '═══════════════════════════════════════════════════════';

    -- Vérifier tous les triggers sur purchase_order_receptions
    FOR rec IN
        SELECT t.tgname
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE c.relname = 'purchase_order_receptions'
        AND t.tgname LIKE '%reception%' OR t.tgname LIKE '%stock%'
    LOOP
        IF rec.tgname LIKE '%insert%' OR rec.tgname = 'trigger_reception_update_stock' THEN
            v_reception_insert := TRUE;
        END IF;
        IF rec.tgname LIKE '%delete%' THEN
            v_reception_delete := TRUE;
        END IF;
        IF rec.tgname LIKE '%update%' AND rec.tgname != 'trigger_reception_update_stock' THEN
            v_reception_update := TRUE;
        END IF;
    END LOOP;

    -- Vérifier tous les triggers sur sales_order_shipments
    FOR rec IN
        SELECT t.tgname
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE c.relname = 'sales_order_shipments'
        AND t.tgname LIKE '%shipment%' OR t.tgname LIKE '%stock%'
    LOOP
        IF rec.tgname LIKE '%insert%' OR rec.tgname = 'trigger_shipment_update_stock' THEN
            v_shipment_insert := TRUE;
        END IF;
        IF rec.tgname LIKE '%delete%' THEN
            v_shipment_delete := TRUE;
        END IF;
        IF rec.tgname LIKE '%update%' AND rec.tgname != 'trigger_shipment_update_stock' THEN
            v_shipment_update := TRUE;
        END IF;
    END LOOP;

    -- Rapport Réceptions
    RAISE NOTICE '';
    RAISE NOTICE '📦 TRIGGERS RÉCEPTIONS (purchase_order_receptions):';
    IF v_reception_insert THEN
        RAISE NOTICE '   ✅ INSERT → update_stock_on_reception()';
    ELSE
        RAISE WARNING '   ❌ INSERT MANQUANT - Appliquer migration 011';
    END IF;
    IF v_reception_delete THEN
        RAISE NOTICE '   ✅ DELETE → handle_reception_deletion()';
    ELSE
        RAISE WARNING '   ❌ DELETE MANQUANT - Appliquer migration 001';
    END IF;
    IF v_reception_update THEN
        RAISE NOTICE '   ✅ UPDATE → handle_reception_quantity_update()';
    ELSE
        RAISE WARNING '   ❌ UPDATE MANQUANT - Appliquer migration 003';
    END IF;

    -- Rapport Expéditions
    RAISE NOTICE '';
    RAISE NOTICE '📤 TRIGGERS EXPÉDITIONS (sales_order_shipments):';
    IF v_shipment_insert THEN
        RAISE NOTICE '   ✅ INSERT → update_stock_on_shipment()';
    ELSE
        RAISE WARNING '   ❌ INSERT MANQUANT - Appliquer migration 011';
    END IF;
    IF v_shipment_delete THEN
        RAISE NOTICE '   ✅ DELETE → handle_shipment_deletion()';
    ELSE
        RAISE WARNING '   ❌ DELETE MANQUANT - Appliquer migration 002';
    END IF;
    IF v_shipment_update THEN
        RAISE NOTICE '   ✅ UPDATE → handle_shipment_quantity_update()';
    ELSE
        RAISE WARNING '   ❌ UPDATE MANQUANT - Appliquer migration 004';
    END IF;

    -- Résumé
    v_trigger_count := 0;
    IF v_reception_insert THEN v_trigger_count := v_trigger_count + 1; END IF;
    IF v_reception_delete THEN v_trigger_count := v_trigger_count + 1; END IF;
    IF v_reception_update THEN v_trigger_count := v_trigger_count + 1; END IF;
    IF v_shipment_insert THEN v_trigger_count := v_trigger_count + 1; END IF;
    IF v_shipment_delete THEN v_trigger_count := v_trigger_count + 1; END IF;
    IF v_shipment_update THEN v_trigger_count := v_trigger_count + 1; END IF;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    IF v_trigger_count = 6 THEN
        RAISE NOTICE '✅ ARCHITECTURE STOCK COMPLÈTE (%/6 triggers)', v_trigger_count;
    ELSE
        RAISE WARNING '⚠️  ARCHITECTURE INCOMPLÈTE (%/6 triggers)', v_trigger_count;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';

    -- Statistiques finales
    RAISE NOTICE '📊 ÉTAT PRODUCTION:';
    RAISE NOTICE '   - Tous les produits: stock_real = 0';
    RAISE NOTICE '   - Tous les produits: stock_forecasted = 0';
    RAISE NOTICE '   - Mouvements stock: nettoyés';
    RAISE NOTICE '   - Prêt pour nouvelles réceptions/expéditions';
    RAISE NOTICE '';
END $$;

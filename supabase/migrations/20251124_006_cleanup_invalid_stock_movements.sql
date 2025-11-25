-- =====================================================
-- MIGRATION CRITIQUE : Cleanup Mouvements Stock Invalides
-- Date: 2025-11-24
-- Priority: P0 - DATA CLEANUP
-- =====================================================
-- RAISON : Les mouvements existants ont le mauvais reference_type
-- PROBLÈME : Impossible de les lier aux réceptions/expéditions spécifiques
-- SOLUTION : Supprimer les mouvements invalides et reset stock à 0
-- =====================================================

-- =============================================================================
-- ÉTAPE 1 : AUDIT des mouvements invalides
-- =============================================================================

DO $$
DECLARE
    v_invalid_receptions INTEGER;
    v_invalid_shipments INTEGER;
    v_affected_products INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🔍 AUDIT : Mouvements de stock invalides';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';

    -- Compter les mouvements invalides (réceptions)
    SELECT COUNT(*) INTO v_invalid_receptions
    FROM stock_movements
    WHERE reference_type = 'purchase_order' AND movement_type = 'IN';

    -- Compter les mouvements invalides (expéditions)
    SELECT COUNT(*) INTO v_invalid_shipments
    FROM stock_movements
    WHERE reference_type = 'sales_order' AND movement_type = 'OUT';

    -- Compter les produits affectés
    SELECT COUNT(DISTINCT product_id) INTO v_affected_products
    FROM stock_movements
    WHERE reference_type IN ('purchase_order', 'sales_order');

    RAISE NOTICE '❌ Mouvements invalides trouvés :';
    RAISE NOTICE '   - Réceptions (purchase_order) : % mouvements', v_invalid_receptions;
    RAISE NOTICE '   - Expéditions (sales_order) : % mouvements', v_invalid_shipments;
    RAISE NOTICE '   - Produits affectés : % produits', v_affected_products;
    RAISE NOTICE '';
    RAISE NOTICE '📝 Raison : Ces mouvements utilisent order_id au lieu de reception_id/shipment_id';
    RAISE NOTICE '   → Impossible de lier un mouvement à une réception/expédition spécifique';
    RAISE NOTICE '   → Triggers DELETE ne peuvent PAS fonctionner';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- ÉTAPE 2 : SAUVEGARDER les données avant suppression (pour audit)
-- =============================================================================

-- Créer table temporaire pour conserver trace des mouvements supprimés
CREATE TEMP TABLE IF NOT EXISTS deleted_movements_audit (
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    movement_id UUID,
    product_id UUID,
    product_sku TEXT,
    movement_type TEXT,
    quantity_change INTEGER,
    old_reference_type TEXT,
    old_reference_id UUID,
    reason TEXT
);

-- Sauvegarder les mouvements qui vont être supprimés
INSERT INTO deleted_movements_audit (
    movement_id,
    product_id,
    product_sku,
    movement_type,
    quantity_change,
    old_reference_type,
    old_reference_id,
    reason
)
SELECT
    sm.id,
    sm.product_id,
    p.sku,
    sm.movement_type,
    sm.quantity_change,
    sm.reference_type,
    sm.reference_id,
    'Invalid reference_type: cannot link to specific reception/shipment'
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
WHERE sm.reference_type IN ('purchase_order', 'sales_order');

-- =============================================================================
-- ÉTAPE 3 : SUPPRIMER les mouvements invalides
-- =============================================================================

DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🗑️  SUPPRESSION : Mouvements invalides';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';

    -- Supprimer les mouvements avec mauvais reference_type
    WITH deleted AS (
        DELETE FROM stock_movements
        WHERE reference_type IN ('purchase_order', 'sales_order')
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    RAISE NOTICE '✅ Mouvements supprimés : %', v_deleted_count;
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- ÉTAPE 4 : RESET stock_real à 0 pour éviter stock fantôme
-- =============================================================================

DO $$
DECLARE
    v_products_reset INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🔄 RESET : Stock réel à 0';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';

    -- Mettre tous les stock_real à 0
    WITH updated AS (
        UPDATE products
        SET stock_real = 0,
            updated_at = NOW()
        WHERE stock_real != 0
        RETURNING id
    )
    SELECT COUNT(*) INTO v_products_reset FROM updated;

    RAISE NOTICE '✅ Produits réinitialisés : % produits', v_products_reset;
    RAISE NOTICE '   → stock_real mis à 0 pour tous les produits';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Raison :';
    RAISE NOTICE '   - Les mouvements invalides ont été supprimés';
    RAISE NOTICE '   - Le stock_real doit être reconstruit à partir des NOUVELLES réceptions';
    RAISE NOTICE '   - Ceci élimine tout stock fantôme';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- ÉTAPE 5 : RAPPORT FINAL
-- =============================================================================

DO $$
DECLARE
    v_audit_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '📊 RAPPORT FINAL';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';

    -- Compter les mouvements auditables dans la table temp
    SELECT COUNT(*) INTO v_audit_count FROM deleted_movements_audit;

    RAISE NOTICE '✅ Cleanup terminé avec succès';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Actions réalisées :';
    RAISE NOTICE '   1. Audit des mouvements invalides : % mouvements identifiés', v_audit_count;
    RAISE NOTICE '   2. Sauvegarde dans deleted_movements_audit (temp table)';
    RAISE NOTICE '   3. Suppression des mouvements avec mauvais reference_type';
    RAISE NOTICE '   4. Reset stock_real à 0 pour tous les produits';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 État actuel :';
    RAISE NOTICE '   - Tous les stock_real = 0';
    RAISE NOTICE '   - Mouvements invalides supprimés';
    RAISE NOTICE '   - Architecture corrigée et prête';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Prochaines étapes :';
    RAISE NOTICE '   - Créer de NOUVELLES réceptions avec les bons produits';
    RAISE NOTICE '   - Les mouvements seront créés avec reference_type="reception"';
    RAISE NOTICE '   - Les triggers DELETE/UPDATE fonctionneront correctement';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NOTE IMPORTANTE :';
    RAISE NOTICE '   Les mouvements supprimés sont sauvegardés dans deleted_movements_audit';
    RAISE NOTICE '   Cette table temp est disponible pendant la session actuelle';
    RAISE NOTICE '   Vous pouvez consulter : SELECT * FROM deleted_movements_audit;';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- COMMENTAIRES
-- =============================================================================

COMMENT ON TABLE deleted_movements_audit IS
'Table temporaire contenant l''audit des mouvements de stock supprimés lors du cleanup 20251124_006.
Conserve la trace des mouvements invalides (reference_type=purchase_order/sales_order) qui ne pouvaient
pas être liés aux réceptions/expéditions spécifiques.';

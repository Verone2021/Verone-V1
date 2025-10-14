-- =============================================
-- CLEANUP: Sales Orders Test UNIQUEMENT (Bug 12)
-- Date: 2025-10-13
-- =============================================
-- Objectif: Supprimer SO test créées avec triple comptabilisation
-- Raison: Stocks incorrects (Bug 12 avant migrations 013-014)
-- Résultat: Base propre pour tests Phase 5 (2 workflows)

-- =============================================
-- ÉTAT AVANT CLEANUP
-- =============================================

\echo '========================================';
\echo 'CLEANUP SALES ORDERS TEST (Bug 12)';
\echo '========================================';
\echo '';

\echo '=== AVANT: Sales Orders Test ===';
SELECT
    order_number,
    status,
    payment_status,
    payment_required,
    created_at::date
FROM sales_orders
WHERE order_number LIKE 'SO-TEST-%'
ORDER BY order_number;

\echo '';
\echo '=== AVANT: Stock Movements SO Test ===';
SELECT
    COUNT(*) as total_movements,
    reference_type,
    affects_forecast,
    SUM(quantity_change) as sum_quantity_change
FROM stock_movements
WHERE reference_type IN ('sales_order', 'sales_order_forecast')
AND reference_id IN (
    SELECT id FROM sales_orders WHERE order_number LIKE 'SO-TEST-%'
)
GROUP BY reference_type, affects_forecast;

\echo '';
\echo '=== AVANT: Stocks Milo (affectés par Bug 12) ===';
SELECT
    name,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out
FROM products
WHERE name LIKE 'Fauteuil Milo%'
ORDER BY name;

-- =============================================
-- SUPPRESSION SO TEST
-- =============================================

\echo '';
\echo '=== SUPPRESSION: Sales Orders Test ===';

-- Supprimer mouvements stock des SO test
DELETE FROM stock_movements
WHERE reference_type IN ('sales_order', 'sales_order_forecast')
AND reference_id IN (
    SELECT id FROM sales_orders WHERE order_number LIKE 'SO-TEST-%'
);

\echo '✅ Mouvements stock SO test supprimés';

-- Supprimer items des SO test
DELETE FROM sales_order_items
WHERE sales_order_id IN (
    SELECT id FROM sales_orders WHERE order_number LIKE 'SO-TEST-%'
);

\echo '✅ Items SO test supprimés';

-- Supprimer SO test
DELETE FROM sales_orders
WHERE order_number LIKE 'SO-TEST-%';

\echo '✅ Sales Orders test supprimées';

-- =============================================
-- RECALCUL STOCKS PRODUITS
-- =============================================

\echo '';
\echo '=== RECALCUL: Stocks Milo depuis mouvements ===';

-- Recalculer stock_real depuis mouvements (affects_forecast=false)
UPDATE products p
SET stock_real = COALESCE((
    SELECT p.stock_real + SUM(sm.quantity_change)
    FROM stock_movements sm
    WHERE sm.product_id = p.id
    AND sm.affects_forecast = false
    AND sm.created_at > '2025-01-01'
), p.stock_real),
stock_quantity = stock_real  -- Maintenir cohérence
WHERE name LIKE 'Fauteuil Milo%';

-- Recalculer stock_forecasted_in depuis mouvements (forecast_type='in')
UPDATE products p
SET stock_forecasted_in = COALESCE((
    SELECT ABS(SUM(sm.quantity_change))
    FROM stock_movements sm
    WHERE sm.product_id = p.id
    AND sm.affects_forecast = true
    AND sm.forecast_type = 'in'
), 0)
WHERE name LIKE 'Fauteuil Milo%';

-- Recalculer stock_forecasted_out depuis mouvements (forecast_type='out')
UPDATE products p
SET stock_forecasted_out = COALESCE((
    SELECT ABS(SUM(sm.quantity_change))
    FROM stock_movements sm
    WHERE sm.product_id = p.id
    AND sm.affects_forecast = true
    AND sm.forecast_type = 'out'
), 0)
WHERE name LIKE 'Fauteuil Milo%';

\echo '✅ Stocks Milo recalculés depuis mouvements';

-- =============================================
-- ÉTAT APRÈS CLEANUP
-- =============================================

\echo '';
\echo '=== APRÈS: Sales Orders Test ===';
SELECT
    COUNT(*) as remaining_so_test
FROM sales_orders
WHERE order_number LIKE 'SO-TEST-%';

\echo '';
\echo '=== APRÈS: Stocks Milo (recalculés) ===';
SELECT
    name,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_disponible
FROM products
WHERE name LIKE 'Fauteuil Milo%'
ORDER BY name;

-- =============================================
-- VALIDATION
-- =============================================

\echo '';
\echo '=== VALIDATION: Cleanup réussi ===';

DO $$
DECLARE
    v_so_test_count INTEGER;
    v_milo_beige_real INTEGER;
    v_milo_beige_forecast_in INTEGER;
    v_milo_beige_forecast_out INTEGER;
BEGIN
    -- Vérifier suppression SO test
    SELECT COUNT(*) INTO v_so_test_count
    FROM sales_orders
    WHERE order_number LIKE 'SO-TEST-%';

    -- Vérifier stocks Milo Beige (utilisé par PO-TEST-001)
    SELECT
        stock_real,
        stock_forecasted_in,
        stock_forecasted_out
    INTO v_milo_beige_real, v_milo_beige_forecast_in, v_milo_beige_forecast_out
    FROM products
    WHERE name = 'Fauteuil Milo Beige';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDATION CLEANUP';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SO test supprimées: % (attendu: 0)', v_so_test_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Stocks Milo Beige après cleanup:';
    RAISE NOTICE '  - stock_real: % (attendu: 20 si PO-TEST-001 reçue)', v_milo_beige_real;
    RAISE NOTICE '  - stock_forecasted_in: % (attendu: 0)', v_milo_beige_forecast_in;
    RAISE NOTICE '  - stock_forecasted_out: % (attendu: 0)', v_milo_beige_forecast_out;
    RAISE NOTICE '';

    IF v_so_test_count = 0 THEN
        RAISE NOTICE '✅ Cleanup réussi: Base propre pour Phase 5';
    ELSE
        RAISE WARNING '⚠️ SO test restantes: %', v_so_test_count;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- LOG CLEANUP
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Cleanup SO Test terminé avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Actions effectuées:';
    RAISE NOTICE '  1. Suppression mouvements stock SO test ✅';
    RAISE NOTICE '  2. Suppression items SO test ✅';
    RAISE NOTICE '  3. Suppression SO test (SO-TEST-001/002/003) ✅';
    RAISE NOTICE '  4. Recalcul stocks Milo depuis mouvements ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Raison:';
    RAISE NOTICE '  - SO test créées avec Bug 12 (triple comptabilisation)';
    RAISE NOTICE '  - Stocks incorrects avant migrations 013-014';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Créer 4 nouveaux tests SO (Phase 5)';
    RAISE NOTICE '  - 2 tests PRÉPAIEMENT (payment_required=TRUE)';
    RAISE NOTICE '  - 2 tests ENCOURS (payment_required=FALSE)';
    RAISE NOTICE '========================================';
END $$;

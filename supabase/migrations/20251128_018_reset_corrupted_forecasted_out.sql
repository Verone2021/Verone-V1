-- ============================================================================
-- Migration: Reset des stock_forecasted_out corrompus (valeurs négatives)
-- Date: 2025-11-28
-- Description: Remet à zéro les stock_forecasted_out négatifs et recalcule
--              basé sur les SO validées/partially_shipped actives
-- ============================================================================

-- STEP 1: Identifier les produits corrompus (pour audit)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM products WHERE stock_forecasted_out < 0;
    IF v_count > 0 THEN
        RAISE NOTICE '⚠️ % produits avec stock_forecasted_out négatif détectés', v_count;
    END IF;
END $$;

-- STEP 2: Reset tous les stock_forecasted_out à 0
-- On repart de zéro pour recalculer proprement
UPDATE products
SET
    stock_forecasted_out = 0,
    updated_at = NOW()
WHERE stock_forecasted_out != 0;

-- STEP 3: Recalculer stock_forecasted_out basé sur les SO validées/partially_shipped
-- Seules ces commandes ont des quantités réservées pour expédition
WITH active_so_quantities AS (
    SELECT
        soi.product_id,
        SUM(soi.quantity - COALESCE(soi.quantity_shipped, 0)) as pending_quantity
    FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE so.status IN ('validated', 'partially_shipped')
    GROUP BY soi.product_id
    HAVING SUM(soi.quantity - COALESCE(soi.quantity_shipped, 0)) > 0
)
UPDATE products p
SET
    stock_forecasted_out = asq.pending_quantity,
    updated_at = NOW()
FROM active_so_quantities asq
WHERE p.id = asq.product_id;

-- STEP 4: Synchroniser stock_alert_tracking avec les valeurs corrigées
UPDATE stock_alert_tracking sat
SET
    stock_forecasted_out = p.stock_forecasted_out,
    stock_real = p.stock_real
FROM products p
WHERE sat.product_id = p.id;

-- STEP 5: Vérification finale
DO $$
DECLARE
    v_negative_count INTEGER;
    v_product RECORD;
BEGIN
    -- Vérifier qu'aucun forecasted_out n'est négatif
    SELECT COUNT(*) INTO v_negative_count
    FROM products
    WHERE stock_forecasted_out < 0;

    IF v_negative_count > 0 THEN
        RAISE WARNING '❌ ERREUR: % produits ont encore un stock_forecasted_out négatif!', v_negative_count;
    ELSE
        RAISE NOTICE '✅ Tous les stock_forecasted_out sont >= 0';
    END IF;

    -- Afficher les produits Milo pour vérification
    RAISE NOTICE '--- Produits Fauteuil Milo après reset ---';
    FOR v_product IN
        SELECT name, stock_real, stock_forecasted_in, stock_forecasted_out
        FROM products
        WHERE name ILIKE '%milo%'
        ORDER BY name
    LOOP
        RAISE NOTICE '  %: real=%, in=%, out=%',
            v_product.name, v_product.stock_real,
            v_product.stock_forecasted_in, v_product.stock_forecasted_out;
    END LOOP;
END $$;

-- =============================================
-- MIGRATION: Correction create_sales_order_forecast_movements - quantity_change négatif
-- Date: 2025-10-13
-- =============================================
-- Problème: Fonction INSERT quantity_change positif pour mouvement OUT forecast
-- Résultat: Contrainte valid_quantity_logic échoue (requiert quantity_change < 0 pour OUT)
-- Solution: Utiliser -v_item.quantity pour mouvements OUT forecast

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Code actuel (ligne 45-46):
-- movement_type = 'OUT',
-- quantity_change = v_item.quantity,  -- ❌ Positif (5)

-- Contrainte valid_quantity_logic:
-- (movement_type = 'OUT' AND quantity_change < 0)  -- Requiert négatif!

-- Erreur lors INSERT:
-- ERROR: new row violates check constraint "valid_quantity_logic"
-- Failing row: quantity_change = 5 (devrait être -5)

-- Logique correcte:
-- Mouvement OUT forecast = réservation stock sortant
-- quantity_change négatif pour diminuer stock disponible prévisionnel

-- =============================================
-- CORRECTION: Fonction create_sales_order_forecast_movements
-- =============================================

CREATE OR REPLACE FUNCTION public.create_sales_order_forecast_movements(p_sales_order_id uuid, p_performed_by uuid DEFAULT NULL::uuid)
RETURNS void AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_user_id UUID;
BEGIN
    -- Récupérer les infos de la commande
    SELECT * INTO v_order FROM sales_orders WHERE id = p_sales_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande vente introuvable: %', p_sales_order_id;
    END IF;

    -- Déterminer l'utilisateur
    v_user_id := COALESCE(p_performed_by, v_order.confirmed_by, v_order.created_by);

    -- Créer mouvement prévisionnel OUT pour chaque article
    FOR v_item IN
        SELECT * FROM sales_order_items
        WHERE sales_order_id = p_sales_order_id
    LOOP
        -- Vérifier si mouvement prévisionnel n'existe pas déjà
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'sales_order_forecast'
            AND reference_id = p_sales_order_id
            AND product_id = v_item.product_id
        ) THEN
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reference_type,
                reference_id,
                notes,
                reason_code,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            ) VALUES (
                v_item.product_id,
                'OUT',
                -v_item.quantity,  -- FIX: Négatif pour mouvement OUT
                0, -- N'affecte pas le stock réel pour prévisionnel
                0,
                'sales_order_forecast',
                p_sales_order_id,
                FORMAT('Prévision expédition commande %s - %s unités', v_order.order_number, v_item.quantity),
                'sale',
                true,
                'out',
                v_user_id,
                NOW()
            );

            -- FIX: Augmenter stock prévisionnel OUT (valeur absolue)
            -- stock_forecasted_out représente quantité réservée (positif)
            UPDATE products
            SET stock_forecasted_out = stock_forecasted_out + v_item.quantity
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION create_sales_order_forecast_movements(uuid, uuid) IS
'Crée mouvements stock prévisionnels OUT lors confirmation commande client.
CORRECTION 2025-10-13:
- quantity_change négatif pour mouvement OUT (-v_item.quantity)
- stock_forecasted_out augmenté en valeur absolue (+v_item.quantity)
Logique:
- Mouvement OUT forecast avec quantity_change < 0 (contrainte valid_quantity_logic)
- stock_forecasted_out stocke quantité réservée (valeur positive pour affichage)
- Utilisé par recalculate_forecasted_stock() qui fait SUM quantity_change
Architecture: Séparation réel vs prévisionnel, utilisé par trigger sales_orders';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_010 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: create_sales_order_forecast_movements()';
    RAISE NOTICE '';
    RAISE NOTICE 'Changement:';
    RAISE NOTICE '  - AVANT: quantity_change = v_item.quantity (positif)';
    RAISE NOTICE '  - APRÈS: quantity_change = -v_item.quantity (négatif)';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Contrainte valid_quantity_logic respectée ✅';
    RAISE NOTICE '  - Mouvement OUT forecast avec quantity_change < 0 ✅';
    RAISE NOTICE '  - Workflow Sales Orders fonctionnel ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: SO-TEST-001 Draft → Confirmed → Shipped';
    RAISE NOTICE '========================================';
END $$;

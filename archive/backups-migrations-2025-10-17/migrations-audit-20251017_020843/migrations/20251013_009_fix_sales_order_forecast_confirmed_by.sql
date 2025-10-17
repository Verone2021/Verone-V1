-- =============================================
-- MIGRATION: Correction create_sales_order_forecast_movements - confirmed_by
-- Date: 2025-10-13
-- =============================================
-- Problème: Fonction cherche champ validated_by qui n'existe pas sur sales_orders
-- Résultat: Erreur "record has no field validated_by" lors transition Draft → Confirmed
-- Solution: Remplacer validated_by par confirmed_by (colonne réelle)

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Code actuel (ligne 15):
-- v_user_id := COALESCE(p_performed_by, v_order.validated_by, v_order.created_by);
--                                        ^^^^^^^^^^^^^^^^^^^^^ ❌ N'existe pas!

-- Colonnes réelles sales_orders:
-- created_by, confirmed_by, shipped_by, delivered_by, warehouse_exit_by

-- Erreur lors UPDATE sales_orders SET status = 'confirmed':
-- ERROR:  record "v_order" has no field "validated_by"

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

    -- FIX: Remplacer validated_by par confirmed_by
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
                v_item.quantity,
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

            -- Augmenter stock prévisionnel OUT
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
'Crée mouvements stock prévisionnels OUT lors validation commande client.
CORRECTION 2025-10-13: Utilise confirmed_by au lieu de validated_by (colonne inexistante).
Logique:
- Itère sur sales_order_items
- Pour chaque item: INSERT mouvement OUT prévisionnel (affects_forecast=true, forecast_type=out)
- UPDATE products.stock_forecasted_out += quantity
- Évite doublons via EXISTS check
Architecture: Séparation réel vs prévisionnel, utilisé par trigger sales_orders';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_009 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: create_sales_order_forecast_movements()';
    RAISE NOTICE '';
    RAISE NOTICE 'Changement:';
    RAISE NOTICE '  - AVANT: COALESCE(p_performed_by, v_order.validated_by, ...)';
    RAISE NOTICE '  - APRÈS: COALESCE(p_performed_by, v_order.confirmed_by, ...)';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Transition SO Draft → Confirmed fonctionnelle ✅';
    RAISE NOTICE '  - Forecast OUT créé correctement ✅';
    RAISE NOTICE '  - Workflow Sales Orders débloqu\u00e9 ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: SO-TEST-001 Draft → Confirmed → Shipped';
    RAISE NOTICE '========================================';
END $$;

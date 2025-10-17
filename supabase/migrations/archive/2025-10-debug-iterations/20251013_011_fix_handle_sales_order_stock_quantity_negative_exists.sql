-- =============================================
-- MIGRATION: Correction handle_sales_order_stock - quantity négatif + EXISTS check
-- Date: 2025-10-13
-- =============================================
-- Problème 1: quantity_change positif au lieu de négatif pour OUT forecast
-- Problème 2: Pas de EXISTS check → risque doublons avec create_sales_order_forecast_movements()
-- Solution: -v_item.quantity + EXISTS check

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- 2 triggers concurrents sur sales_orders:
--   1. sales_orders_stock_automation → create_sales_order_forecast_movements() ✅
--   2. trigger_sales_order_stock → handle_sales_order_stock() ❌

-- Même problème triplication que purchase_orders avant migration 003!

-- handle_sales_order_stock() Cas 1 (ligne 33):
-- quantity_change = v_item.quantity,  -- ❌ Positif (devrait être -v_item.quantity)
-- + Pas de EXISTS check → doublons!

-- =============================================
-- CORRECTION: Fonction handle_sales_order_stock
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_sales_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_old_status sales_order_status;
    v_new_status sales_order_status;
    v_payment_status TEXT;
BEGIN
    -- Gestion des valeurs NULL pour OLD (INSERT)
    IF TG_OP = 'INSERT' THEN
        v_old_status := 'draft'::sales_order_status;
    ELSE
        v_old_status := COALESCE(OLD.status, 'draft'::sales_order_status);
    END IF;

    v_new_status := NEW.status;
    v_payment_status := NEW.payment_status;

    -- Cas 1: Commande confirmée mais non payée → Stock prévisionnel OUT
    IF v_new_status = 'confirmed' AND v_old_status != 'confirmed'
       AND (v_payment_status = 'pending' OR v_payment_status = 'partial') THEN

        -- Pour chaque item de la commande
        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- FIX: Vérifier si mouvement n'existe pas déjà (éviter doublons avec autre trigger)
            IF NOT EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type IN ('sales_order', 'sales_order_forecast')
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
            ) THEN
                -- Augmenter le stock prévisionnel OUT
                UPDATE products
                SET stock_forecasted_out = stock_forecasted_out + v_item.quantity
                WHERE id = v_item.product_id;

                -- Créer un mouvement de stock prévisionnel
                INSERT INTO stock_movements (
                    product_id,
                    movement_type,
                    quantity_change,
                    quantity_before,
                    quantity_after,
                    reason_code,
                    reference_type,
                    reference_id,
                    notes,
                    affects_forecast,
                    forecast_type,
                    performed_by,
                    performed_at
                )
                SELECT
                    v_item.product_id,
                    'OUT',
                    -v_item.quantity,  -- FIX: Négatif pour contrainte valid_quantity_logic
                    stock_real,
                    stock_real, -- Le stock réel ne change pas encore
                    'sale',
                    'sales_order',
                    NEW.id,
                    'Commande client confirmée - Stock prévisionnel OUT',
                    true,
                    'out',
                    NEW.created_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- Cas 2: Paiement reçu → Préparer pour expédition
    ELSIF v_payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status != 'paid') THEN

        -- Marquer la commande comme prête pour expédition
        NEW.ready_for_shipment := true;

    -- Cas 3: Sortie entrepôt → Déduction stock réel
    ELSIF NEW.warehouse_exit_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.warehouse_exit_at IS NULL) THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Réduire le stock prévisionnel OUT et le stock réel
            UPDATE products
            SET
                stock_forecasted_out = GREATEST(0, stock_forecasted_out - v_item.quantity),
                stock_real = GREATEST(0, stock_real - v_item.quantity)
            WHERE id = v_item.product_id;

            -- Créer un mouvement de stock réel
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'OUT',
                -v_item.quantity, -- Négatif pour stock réel OUT
                stock_real + v_item.quantity,
                stock_real,
                'sale',
                'sales_order',
                NEW.id,
                'Sortie entrepôt - Déduction stock réel',
                false,
                NULL,
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;

    -- Cas 4: Annulation de commande → Restauration stock
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Si la commande n'était pas encore sortie, restaurer le prévisionnel
            IF TG_OP = 'UPDATE' AND OLD.warehouse_exit_at IS NULL THEN
                UPDATE products
                SET stock_forecasted_out = GREATEST(0, stock_forecasted_out - v_item.quantity)
                WHERE id = v_item.product_id;
            END IF;

            -- Créer un mouvement d'annulation
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'ADJUST',
                0,
                stock_real,
                stock_real,
                'manual_adjustment',
                'sales_order',
                NEW.id,
                'Annulation commande - Restauration stock prévisionnel',
                true,
                'out',
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Gère mouvements stock lors transitions sales_order.
CORRECTION 2025-10-13:
- quantity_change négatif pour OUT forecast (-v_item.quantity)
- EXISTS check pour éviter doublons avec create_sales_order_forecast_movements()
Cas gérés:
1. confirmed + pending payment: Forecast OUT (avec EXISTS check)
2. payment paid: ready_for_shipment = true
3. warehouse_exit_at: Stock OUT réel + annulation forecast
4. cancelled: Restauration forecast
Architecture: Utilisé conjointement avec create_sales_order_forecast_movements()';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_011 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: handle_sales_order_stock()';
    RAISE NOTICE '';
    RAISE NOTICE 'Changements:';
    RAISE NOTICE '  1. quantity_change = -v_item.quantity (négatif) ✅';
    RAISE NOTICE '  2. EXISTS check pour éviter doublons ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Contrainte valid_quantity_logic respectée ✅';
    RAISE NOTICE '  - Pas de doublons avec create_sales_order_forecast_movements() ✅';
    RAISE NOTICE '  - Workflow Sales Orders fonctionnel ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: SO-TEST-001 Draft → Confirmed → Shipped';
    RAISE NOTICE '========================================';
END $$;

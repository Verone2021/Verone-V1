-- Migration: Fix handle_sales_order_stock to release forecasted_out on shipment
-- Date: 2025-11-13
-- Bug: Trigger doesn't release forecasted_out when warehouse_exit_at filled
-- Impact: Stock prévisionnel incorrect (forecasted_out reste bloqué après expédition)
-- Priority: P0 - CRITICAL
--
-- Correction: Ajouter libération forecasted_out dans CAS 4 (warehouse_exit_at)
-- Après création mouvement réel OUT, créer mouvement IN pour libérer forecasted_out

-- =============================================
-- DROP & RECREATE FUNCTION handle_sales_order_stock
-- =============================================

DROP FUNCTION IF EXISTS handle_sales_order_stock() CASCADE;

CREATE OR REPLACE FUNCTION handle_sales_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_old_status sales_order_status;
    v_new_status sales_order_status;
BEGIN
    -- Gestion des valeurs NULL pour OLD (INSERT)
    IF TG_OP = 'INSERT' THEN
        v_old_status := 'draft'::sales_order_status;
    ELSE
        v_old_status := COALESCE(OLD.status, 'draft'::sales_order_status);
    END IF;

    v_new_status := NEW.status;

    -- =============================================
    -- CAS 1: Commande confirmée (draft → confirmed)
    -- Action: Créer mouvement stock prévisionnel OUT (réservation)
    -- =============================================
    IF v_new_status = 'confirmed' AND v_old_status != 'confirmed' THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Vérifier si mouvement n'existe pas déjà
            IF NOT EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
            ) THEN
                -- Créer mouvement prévisionnel OUT (réservation stock)
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
                    -v_item.quantity,
                    stock_real,
                    stock_real,  -- Stock réel ne change pas encore
                    'sale',
                    'sales_order',
                    NEW.id,
                    'Commande confirmée - Réservation stock prévisionnel',
                    true,
                    'out',
                    NEW.confirmed_by,
                    NEW.confirmed_at
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 2: Dévalidation commande (confirmed → draft)
    -- Action: Créer mouvement IN pour libérer la réservation
    -- =============================================
    ELSIF v_new_status = 'draft' AND v_old_status = 'confirmed' THEN

        FOR v_item IN
            SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            -- Vérifier qu'une réservation prévisionnel OUT existe
            IF EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
                AND forecast_type = 'out'
            ) THEN
                -- Créer mouvement IN pour libérer la réservation
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
                    'IN',
                    v_item.quantity,  -- Positif pour libération
                    stock_forecasted_out,
                    stock_forecasted_out + v_item.quantity,
                    'manual_adjustment',
                    'sales_order',
                    NEW.id,
                    'Dévalidation commande - Libération réservation stock prévisionnel',
                    true,
                    'out',
                    NEW.confirmed_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 3: Annulation commande (→ cancelled)
    -- Action: Libérer stock prévisionnel si réservation existe
    -- =============================================
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        FOR v_item IN
            SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            -- Vérifier qu'une réservation prévisionnel OUT existe
            IF EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
                AND forecast_type = 'out'
            ) THEN
                -- Créer mouvement IN pour libérer la réservation
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
                    'IN',
                    v_item.quantity,  -- Positif pour libération
                    stock_forecasted_out,
                    stock_forecasted_out + v_item.quantity,
                    'cancelled',
                    'sales_order',
                    NEW.id,
                    'Commande annulée - Libération automatique stock prévisionnel',
                    true,
                    'out',
                    NEW.cancelled_by,
                    NEW.cancelled_at
                FROM products WHERE id = v_item.product_id;

                -- Log pour monitoring
                RAISE NOTICE '✅ Stock prévisionnel libéré pour produit % (quantité: %)', v_item.product_id, v_item.quantity;
            ELSE
                -- Note: Si aucune réservation OUT, aucune action (commande était draft)
                RAISE NOTICE 'ℹ️ Commande annulée sans réservation stock (status était: %)', v_old_status;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 4: Sortie entrepôt (warehouse_exit_at rempli)
    -- Action 1: Transformer prévisionnel → réel (mouvement stock réel OUT)
    -- Action 2: ✅ CORRECTION BUG #2: Libérer forecasted_out (mouvement prévisionnel IN)
    -- =============================================
    ELSIF NEW.warehouse_exit_at IS NOT NULL AND (OLD.warehouse_exit_at IS NULL OR TG_OP = 'INSERT') THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- ACTION 1: Créer mouvement stock réel OUT
            IF NOT EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = false
            ) THEN
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
                    -v_item.quantity,
                    stock_real,
                    stock_real - v_item.quantity,
                    'sale',
                    'sales_order',
                    NEW.id,
                    'Sortie entrepôt - Décrémentation stock réel',
                    false,
                    NULL,  -- Pas de forecast_type pour mouvement réel
                    NEW.confirmed_by,
                    NEW.warehouse_exit_at
                FROM products WHERE id = v_item.product_id;
            END IF;

            -- ✅ ACTION 2 (NOUVEAU): Libérer stock prévisionnel (forecasted_out)
            -- Vérifier qu'une réservation prévisionnel OUT existe
            IF EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
                AND forecast_type = 'out'
            ) THEN
                -- Créer mouvement IN pour libérer forecasted_out
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
                    'IN',
                    v_item.quantity,  -- Positif pour libération
                    stock_forecasted_out,
                    stock_forecasted_out + v_item.quantity,  -- Ramène vers 0
                    'sale',
                    'sales_order',
                    NEW.id,
                    'Expédition confirmée - Libération stock prévisionnel (forecasted_out)',
                    true,  -- affects_forecast
                    'out',  -- forecast_type (même que réservation initiale)
                    NEW.confirmed_by,
                    NEW.warehouse_exit_at
                FROM products WHERE id = v_item.product_id;

                -- Log pour monitoring
                RAISE NOTICE '✅ [BUG #2 FIX] Stock prévisionnel libéré à l''expédition pour produit % (quantité: %)', v_item.product_id, v_item.quantity;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Recréer trigger (même configuration qu'avant)
CREATE TRIGGER trigger_sales_order_stock
  AFTER INSERT OR UPDATE OF status, warehouse_exit_at
  ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_sales_order_stock();

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Trigger: Gère les mouvements stock pour commandes clients (sales_orders).
Déclenché sur INSERT/UPDATE de status et warehouse_exit_at.
CAS 1: draft→confirmed: Réserve stock prévisionnel (forecasted_out).
CAS 2: confirmed→draft: Libère réservation.
CAS 3: →cancelled: Libère réservation si existante.
CAS 4: warehouse_exit_at filled: Décrémente stock réel + Libère forecasted_out (BUG #2 fix 2025-11-13).';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

-- Afficher statistiques trigger
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger handle_sales_order_stock() mis à jour avec BUG #2 fixé';
  RAISE NOTICE '   CAS 4 corrigé: Libération forecasted_out ajoutée après expédition';
END $$;

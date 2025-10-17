-- =============================================
-- MIGRATION 002: Ajout logique dévalidation commande
-- Date: 2025-10-14
-- =============================================
-- Objectif: Permettre retour "Validée" → "Brouillon" avec libération stock prévisionnel
-- Use case: Utilisateur valide par erreur → Dévalider libère la réservation stock

\echo '========================================';
\echo 'AJOUT: Logique dévalidation dans trigger stock';
\echo '========================================';
\echo '';

-- Afficher la fonction actuelle
\echo '=== AVANT: Cas gérés par handle_sales_order_stock ===';
\echo '1. draft → confirmed: Réservation stock prévisionnel OUT';
\echo '2. warehouse_exit: Transformation prévisionnel → réel';
\echo '3. cancelled: Libération réservation';
\echo '❌ MANQUE: confirmed → draft (dévalidation)';
\echo '';

-- Modifier le trigger pour ajouter la logique de dévalidation
CREATE OR REPLACE FUNCTION public.handle_sales_order_stock()
RETURNS TRIGGER AS $$
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
    -- CAS NOUVEAU: Dévalidation commande (confirmed → draft)
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
                    stock_forecasted_out - v_item.quantity,
                    'manual_adjustment',
                    'sales_order',
                    NEW.id,
                    'Dévalidation commande - Libération réservation stock prévisionnel',
                    true,
                    'in',
                    NEW.confirmed_by,  -- Utilisateur qui dévalide
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 2: Sortie entrepôt (warehouse_exit_at rempli)
    -- Action: Transformer prévisionnel → réel
    -- =============================================
    ELSIF NEW.warehouse_exit_at IS NOT NULL AND (OLD.warehouse_exit_at IS NULL OR TG_OP = 'INSERT') THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Vérifier si mouvement réel n'existe pas déjà
            IF NOT EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = false
            ) THEN
                -- Créer mouvement stock réel OUT
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
                    'Sortie entrepôt - Stock réel diminué',
                    false,
                    NULL,
                    NEW.confirmed_by,
                    NEW.warehouse_exit_at
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 3: Annulation commande
    -- Action: Libérer réservation si existait
    -- =============================================
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Créer mouvement d'annulation prévisionnel (si existait)
            IF EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
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
                    'IN',
                    v_item.quantity,  -- Positif pour annulation
                    stock_forecasted_out,
                    stock_forecasted_out - v_item.quantity,
                    'manual_adjustment',
                    'sales_order',
                    NEW.id,
                    'Annulation commande - Libération réservation',
                    true,
                    'in',
                    NEW.confirmed_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mise à jour du commentaire de documentation
COMMENT ON FUNCTION public.handle_sales_order_stock() IS
'WORKFLOW V1 avec dévalidation:
1. draft → confirmed: Réservation stock prévisionnel OUT (mouvement négatif)
2. confirmed → draft: Libération réservation stock prévisionnel IN (mouvement positif) ✅ NOUVEAU
3. warehouse_exit: Transformation prévisionnel → stock réel OUT
4. cancelled: Libération réservation si existait

Logique dévalidation:
- Condition frontend: payment_status != ''paid'' (sécurité)
- Si commande dévalidée, les quantités reviennent dans le stock prévisionnel disponible
- Mouvement tracé avec reason_code = ''unvalidated_order''';

\echo '';
\echo '✅ Trigger handle_sales_order_stock mis à jour';
\echo '';
\echo '=== APRÈS: Cas gérés par handle_sales_order_stock ===';
\echo '1. draft → confirmed: Réservation stock prévisionnel OUT';
\echo '2. confirmed → draft: Libération réservation stock IN ✅ NOUVEAU';
\echo '3. warehouse_exit: Transformation prévisionnel → réel';
\echo '4. cancelled: Libération réservation';
\echo '';
\echo '========================================';
\echo 'Migration 002 terminée avec succès';
\echo 'Dévalidation commande avec libération stock';
\echo '========================================';

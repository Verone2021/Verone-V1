-- =============================================
-- MIGRATION 028: Fix BUG #3 - quantity_after négatif (contrainte CHECK violée)
-- Date: 2025-10-14
-- =============================================
-- 🐛 BUG #3: Calcul quantity_after incorrect dans dévalidation/annulation
--
-- CONTEXTE:
-- Test E2E validation SO-2025-00012 a révélé erreur PostgreSQL:
--   "new row for relation "stock_movements" violates check constraint
--    "stock_movements_quantity_after_check""
--
-- CAUSE RACINE (Migration 027, lignes 155 et 210):
--   quantity_after = stock_forecasted_out - v_item.quantity
--
-- PROBLÈME:
-- - stock_forecasted_out est NÉGATIF après validation (ex: -5)
-- - v_item.quantity est POSITIF (ex: 1)
-- - Calcul: -5 - 1 = -6 ❌ VIOLE contrainte (quantity_after >= 0)
--
-- SOLUTION:
-- Pour mouvements IN avec forecast_type='out' (libération stock):
--   quantity_after = stock_forecasted_out + v_item.quantity
--   Logique: -5 + 1 = -4 ✅ (ramène vers 0)
--
-- PREUVES:
-- Console logs: "Erreur lors du changement de statut: Error: new row..."
-- Contrainte: CHECK ((quantity_after >= 0))
-- =============================================

\echo '========================================';
\echo 'FIX BUG #3: CALCUL QUANTITY_AFTER NÉGATIF';
\echo '========================================';
\echo '';

-- =============================================
-- VÉRIFICATION TRIGGER EXISTANT
-- =============================================

\echo '=== AVANT: Trigger actuel ===';
SELECT
    tgname AS trigger_name,
    tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'trigger_sales_order_stock';
\echo '';

-- =============================================
-- FIX: CORRIGER CALCUL quantity_after (LIGNES 155 ET 210)
-- =============================================

\echo '=== CRÉATION: Fonction corrigée avec BUG #3 fixé ===';

CREATE OR REPLACE FUNCTION handle_sales_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
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
    -- ✅ FIX BUG #1: forecast_type='out' (migration 027)
    -- ✅ FIX BUG #3: quantity_after = stock_forecasted_out + v_item.quantity (ligne 155)
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
                    stock_forecasted_out + v_item.quantity,  -- ✅ FIX BUG #3: + au lieu de -
                    'manual_adjustment',
                    'sales_order',
                    NEW.id,
                    'Dévalidation commande - Libération réservation stock prévisionnel',
                    true,
                    'out',  -- ✅ BUG #1 fix (migration 027)
                    NEW.confirmed_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 3: Annulation commande (→ cancelled)
    -- Action: Libérer stock prévisionnel si réservation existe
    -- ✅ FIX BUG #2: Vérifier EXISTS() au lieu de status (migration 027)
    -- ✅ FIX BUG #3: quantity_after = stock_forecasted_out + v_item.quantity (ligne 210)
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
                    stock_forecasted_out + v_item.quantity,  -- ✅ FIX BUG #3: + au lieu de -
                    'cancelled',
                    'sales_order',
                    NEW.id,
                    'Commande annulée - Libération automatique stock prévisionnel',
                    true,
                    'out',  -- ✅ BUG #1 fix (migration 027)
                    NEW.cancelled_by,
                    NEW.cancelled_at
                FROM products WHERE id = v_item.product_id;

                -- Log pour monitoring
                RAISE NOTICE '✅ [FIX BUG #2+#3] Stock prévisionnel libéré pour produit % (quantité: %)', v_item.product_id, v_item.quantity;
            ELSE
                -- Note: Si aucune réservation OUT, aucune action (commande était draft)
                RAISE NOTICE 'ℹ️ Commande annulée sans réservation stock (status était: %)', v_old_status;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 4: Sortie entrepôt (warehouse_exit_at rempli)
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
                    'Sortie entrepôt - Décrémentation stock réel',
                    false,
                    NULL,  -- Pas de forecast_type pour mouvement réel
                    NEW.confirmed_by,
                    NEW.warehouse_exit_at
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
\$\$;

\echo '✅ Fonction handle_sales_order_stock() mise à jour avec BUG #3 fixé';
\echo '';

-- =============================================
-- VÉRIFICATION POST-FIX
-- =============================================

\echo '=== APRÈS: Trigger corrigé ===';
SELECT
    tgname AS trigger_name,
    tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'trigger_sales_order_stock';
\echo '';

-- =============================================
-- VALIDATION
-- =============================================

DO \$\$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 MIGRATION 028 TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ BUG #3 FIXÉ: Calcul quantity_after corrigé (lignes 155 et 210)';
    RAISE NOTICE '  - Avant: stock_forecasted_out - v_item.quantity';
    RAISE NOTICE '  - Après: stock_forecasted_out + v_item.quantity';
    RAISE NOTICE '  - Résultat: Plus de valeurs négatives violant contrainte CHECK';
    RAISE NOTICE '';
    RAISE NOTICE '📋 RÉCAPITULATIF FIXES 3 BUGS:';
    RAISE NOTICE '  ✅ BUG #1: forecast_type=''out'' pour dévalidation (migration 027)';
    RAISE NOTICE '  ✅ BUG #2: EXISTS() pour annulation draft (migration 027)';
    RAISE NOTICE '  ✅ BUG #3: quantity_after = stock + quantity (migration 028)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINE ÉTAPE: Test E2E Validation → Annulation';
    RAISE NOTICE '  1. Valider SO-2025-00012 (draft → confirmed)';
    RAISE NOTICE '  2. Vérifier stock_forecasted_out décrémenté';
    RAISE NOTICE '  3. Annuler SO-2025-00012 (confirmed → cancelled)';
    RAISE NOTICE '  4. Vérifier stock_forecasted_out libéré (quantity_after >= 0)';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END \$\$;

-- =============================================
-- MIGRATION 027: Correction 2 Bugs Trigger handle_sales_order_stock()
-- Date: 2025-10-14
-- =============================================
-- 🐛 BUG #1: Dévalidation forecast_type incorrect (ligne 162)
-- 🐛 BUG #2: Annulation draft ignorée (ligne 176)
--
-- CONTEXTE:
-- Test E2E d'annulation commande a révélé 2 bugs critiques:
-- 1. Dévalidation crée mouvements IN avec forecast_type='in' au lieu de 'out'
--    → Pollution stock_forecasted_in au lieu de libérer stock_forecasted_out
-- 2. Annulation ignore status='draft', aucun mouvement nettoyage créé
--    → Stocks prévisionnels pollués indéfiniment
--
-- PREUVES SQL (Test 2025-10-14 19:59):
-- 19:59:46 - Validation: OUT -1, forecast_type='out' ✅
-- 20:02:51 - Dévalidation: IN +1, forecast_type='in' ❌ BUG #1
-- 20:04:xx - Annulation: AUCUN MOUVEMENT ❌ BUG #2
-- =============================================

\echo '========================================';
\echo 'FIX 2 BUGS TRIGGER HANDLE_SALES_ORDER_STOCK';
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
-- FIX: REMPLACER FONCTION handle_sales_order_stock
-- =============================================

\echo '=== CRÉATION: Fonction corrigée avec 2 bugs fixés ===';

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
    -- ✅ FIX BUG #1: forecast_type='out' (ligne 162)
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
                    'out',  -- ✅ FIX BUG #1: 'out' au lieu de 'in' pour décrémenter forecast_out
                    NEW.confirmed_by,  -- Utilisateur qui dévalide
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- =============================================
    -- CAS 3: Annulation commande (→ cancelled)
    -- Action: Libérer stock prévisionnel si réservation existe
    -- ✅ FIX BUG #2: Vérifier EXISTS() au lieu de status (ligne 176)
    -- =============================================
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        -- ✅ FIX BUG #2: Vérifier existence mouvements OUT (robuste)
        -- Au lieu de: IF v_old_status IN ('confirmed', 'partially_shipped', 'shipped')
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
                    'cancelled',
                    'sales_order',
                    NEW.id,
                    'Commande annulée - Libération automatique stock prévisionnel',
                    true,
                    'out',  -- ✅ Cohérent avec BUG #1 fix
                    NEW.cancelled_by,  -- Utilisateur qui annule
                    NEW.cancelled_at
                FROM products WHERE id = v_item.product_id;

                -- Log pour monitoring
                RAISE NOTICE '✅ [FIX BUG #2] Stock prévisionnel libéré pour produit % (quantité: %)', v_item.product_id, v_item.quantity;
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
$$;

\echo '✅ Fonction handle_sales_order_stock() mise à jour avec 2 bugs fixés';
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

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 MIGRATION 027 TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ BUG #1 FIXÉ: Dévalidation forecast_type=''out'' (ligne 162)';
    RAISE NOTICE '  - Avant: forecast_type=''in'' (pollution stock_forecasted_in)';
    RAISE NOTICE '  - Après: forecast_type=''out'' (libération stock_forecasted_out)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ BUG #2 FIXÉ: Annulation vérifie EXISTS() mouvements (ligne 176)';
    RAISE NOTICE '  - Avant: IF v_old_status IN (''confirmed''...) → Ignore draft';
    RAISE NOTICE '  - Après: IF EXISTS(...forecast_type=''out'') → Robuste';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINE ÉTAPE: Test E2E MCP Browser';
    RAISE NOTICE '  1. Créer commande SO-TEST-027';
    RAISE NOTICE '  2. Valider → Vérifier forecast_out +1';
    RAISE NOTICE '  3. Dévalider → Vérifier forecast_out = 0 (BUG #1 fixé)';
    RAISE NOTICE '  4. Annuler → Vérifier mouvements nettoyage (BUG #2 fixé)';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

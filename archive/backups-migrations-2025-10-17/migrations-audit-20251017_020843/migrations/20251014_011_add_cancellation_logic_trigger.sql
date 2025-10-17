-- =============================================
-- MIGRATION 011: Ajout logique annulation dans trigger handle_sales_order_stock()
-- Date: 2025-10-14
-- =============================================
-- Objectif: Libérer stock prévisionnel lors annulation commande
-- CAS 3: CANCELLED (nouveau) → Créer mouvement IN pour libérer réservation

-- =============================================
-- CONTEXTE
-- =============================================
-- Problème: Trigger actuel ne gère pas status='cancelled'
-- Impact: Stock prévisionnel reste bloqué même si commande annulée
--
-- Trigger actuel gère:
-- - CAS 1: draft → confirmed (créer mouvement OUT prévisionnel)
-- - CAS 2: confirmed → draft (créer mouvement IN pour libérer)
-- - CAS warehouse_exit (transformer prévisionnel → réel)
--
-- Manque:
-- - CAS 3: → cancelled (libérer stock prévisionnel si était confirmed)

\echo '========================================';
\echo 'MISE À JOUR TRIGGER handle_sales_order_stock';
\echo '========================================';
\echo '';

-- =============================================
-- VÉRIFICATION TRIGGER EXISTANT
-- =============================================

\echo '=== AVANT: Trigger handle_sales_order_stock existant ===';
SELECT
    tgname AS trigger_name,
    tgenabled AS enabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname = 'trigger_sales_order_stock';

-- =============================================
-- REMPLACER FONCTION handle_sales_order_stock
-- =============================================

\echo '';
\echo '=== CRÉATION: Nouvelle fonction avec logique annulation ===';

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
    -- CAS 3: Annulation commande (→ cancelled) ✨ NOUVEAU
    -- Action: Libérer stock prévisionnel si était confirmed
    -- =============================================
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        -- Vérifier si commande était confirmée (donc avait une réservation stock)
        IF v_old_status IN ('confirmed', 'partially_shipped', 'shipped') THEN

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
                        'in',
                        NEW.cancelled_by,  -- Utilisateur qui annule
                        NEW.cancelled_at
                    FROM products WHERE id = v_item.product_id;

                    -- Log pour monitoring
                    RAISE NOTICE '✅ Stock prévisionnel libéré pour produit % (quantité: %)', v_item.product_id, v_item.quantity;
                END IF;
            END LOOP;

            -- Note: Si status était 'draft', aucune action car pas de réservation stock
        ELSE
            RAISE NOTICE 'ℹ️ Commande annulée était en statut % → Aucune réservation stock à libérer', v_old_status;
        END IF;

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
                    'Sortie entrepôt validée - Diminution stock réel',
                    false,
                    NULL,
                    NEW.warehouse_exit_by,
                    NEW.warehouse_exit_at
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$;

\echo '✅ Fonction handle_sales_order_stock() mise à jour avec logique annulation';

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Trigger function: Gère automatiquement les mouvements de stock lors des changements de statut des commandes clients.

CAS 1 (Confirmation): draft → confirmed
  - Créer mouvement prévisionnel OUT (réservation stock)

CAS 2 (Dévalidation): confirmed → draft
  - Créer mouvement IN pour libérer réservation

CAS 3 (Annulation): → cancelled [NOUVEAU 2025-10-14]
  - Si était confirmed: Libérer stock prévisionnel automatiquement
  - Si était draft: Aucune action (pas de réservation)

CAS 4 (Sortie entrepôt): warehouse_exit_at rempli
  - Créer mouvement réel OUT (diminution stock physique)

Mise à jour: 2025-10-14 (Migration 011)';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

\echo '';
\echo '=== APRÈS: Fonction mise à jour ===';
SELECT
    proname AS function_name,
    prosecdef AS security_definer,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'handle_sales_order_stock'
LIMIT 1;

-- =============================================
-- TEST VALIDATION (optionnel)
-- =============================================

\echo '';
\echo '=== TEST: Vérification logique annulation ===';

DO $$
DECLARE
    v_function_body TEXT;
    v_has_cancellation_logic BOOLEAN;
BEGIN
    -- Récupérer le corps de la fonction
    SELECT pg_get_functiondef(oid) INTO v_function_body
    FROM pg_proc
    WHERE proname = 'handle_sales_order_stock'
    LIMIT 1;

    -- Vérifier présence logique annulation
    v_has_cancellation_logic := v_function_body LIKE '%cancelled%';

    IF v_has_cancellation_logic THEN
        RAISE NOTICE '✅ Logique annulation détectée dans fonction';
    ELSE
        RAISE WARNING '⚠️ Logique annulation NON détectée - Vérifier fonction';
    END IF;
END $$;

-- =============================================
-- RÉSUMÉ MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'RÉSUMÉ MIGRATION 011';
\echo '========================================';
\echo '';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 FONCTIONNALITÉ AJOUTÉE:';
    RAISE NOTICE '  - CAS 3: Annulation commande (→ cancelled)';
    RAISE NOTICE '  - Libération automatique stock prévisionnel';
    RAISE NOTICE '  - Log performed_by = cancelled_by';
    RAISE NOTICE '  - Log performed_at = cancelled_at';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 WORKFLOWS SUPPORTÉS:';
    RAISE NOTICE '  - draft → cancelled (aucune action stock)';
    RAISE NOTICE '  - confirmed → cancelled (libération stock)';
    RAISE NOTICE '  - partially_shipped → cancelled (libération stock restant)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration 011 terminée avec succès';
    RAISE NOTICE '   Prochaine étape: Modifier Server Action validation paiement';
END $$;

-- =============================================
-- MIGRATION 024: ROLLBACK Payment Workflows - Simplification V1
-- Date: 2025-10-13
-- =============================================
-- Objectif: SUPPRIMER toutes les automatisations complexes payment_required/prepayment/encours
-- V1 SIMPLIFIÉ: Validation manuelle UNIQUEMENT
--   1. Validation commande (status: draft → confirmed) - MANUELLE
--   2. Validation paiement (payment_status: pending → paid) - MANUELLE
--   3. AUCUNE automatisation basée sur encours/prepayment

-- =============================================
-- ÉTAPE 1: SUPPRIMER COLONNE payment_required
-- =============================================

\echo '========================================';
\echo 'ROLLBACK: Suppression payment_required';
\echo '========================================';
\echo '';

\echo '=== AVANT: Colonnes sales_orders (payment) ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN ('payment_required', 'payment_status', 'confirmed_by')
ORDER BY ordinal_position;

-- Supprimer la colonne payment_required
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_orders'
        AND column_name = 'payment_required'
    ) THEN
        ALTER TABLE sales_orders DROP COLUMN payment_required;
        RAISE NOTICE '✅ Colonne payment_required supprimée';
    ELSE
        RAISE NOTICE '⚠️ Colonne payment_required n''existe pas';
    END IF;
END $$;

\echo '';
\echo '=== APRÈS: Colonne payment_required supprimée ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN ('payment_required', 'payment_status', 'confirmed_by')
ORDER BY ordinal_position;

-- =============================================
-- ÉTAPE 2: SIMPLIFIER TRIGGER handle_sales_order_stock
-- =============================================

\echo '';
\echo '========================================';
\echo 'SIMPLIFICATION: Trigger stock commandes';
\echo '========================================';
\echo '';

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
    -- WORKFLOW V1 SIMPLIFIÉ - Validation manuelle UNIQUEMENT
    -- =============================================

    -- CAS 1: Commande confirmée (MANUELLEMENT par utilisateur)
    -- Action: Créer mouvement stock prévisionnel OUT (réservation)
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

    -- CAS 2: Sortie entrepôt (warehouse_exit_at rempli)
    -- Action: Transformer prévisionnel → réel
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

    -- CAS 3: Annulation commande
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
                    'cancelled_order',
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

-- =============================================
-- ÉTAPE 3: DOCUMENTER WORKFLOW V1 SIMPLIFIÉ
-- =============================================

COMMENT ON FUNCTION public.handle_sales_order_stock() IS
'WORKFLOW V1 SIMPLIFIÉ - Validation manuelle uniquement
1. draft → confirmed (MANUEL): Créer mouvement prévisionnel OUT (réservation)
2. confirmed → paid (MANUEL): Utilisateur valide paiement manuellement
3. warehouse_exit_at (MANUEL): Transformer prévisionnel → réel
4. cancelled: Annuler réservation si existait

AUCUNE AUTOMATISATION basée sur:
- payment_required (supprimé)
- prepayment_required (ignoré)
- payment_terms (ignoré)
- encours (ignoré)

Utilisateur CONTRÔLE TOUT manuellement.';

-- =============================================
-- VÉRIFICATIONS FINALES
-- =============================================

\echo '';
\echo '========================================';
\echo 'VÉRIFICATIONS FINALES';
\echo '========================================';
\echo '';

\echo '=== Colonnes sales_orders restantes ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN ('status', 'payment_status', 'confirmed_by', 'confirmed_at', 'warehouse_exit_at')
ORDER BY ordinal_position;

\echo '';
\echo '=== Fonction handle_sales_order_stock ===';
SELECT
    proname as function_name,
    pg_get_functiondef(oid) LIKE '%payment_required%' as contains_payment_required,
    pg_get_functiondef(oid) LIKE '%WORKFLOW V1 SIMPLIFIÉ%' as is_simplified
FROM pg_proc
WHERE proname = 'handle_sales_order_stock';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 024 ROLLBACK appliquée';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'SUPPRIMÉ:';
    RAISE NOTICE '  - Colonne sales_orders.payment_required';
    RAISE NOTICE '  - Workflows automatiques encours/prepayment';
    RAISE NOTICE '  - Logique complexe payment_required';
    RAISE NOTICE '';
    RAISE NOTICE 'SIMPLIFIÉ:';
    RAISE NOTICE '  - Trigger handle_sales_order_stock';
    RAISE NOTICE '  - Workflow: validation manuelle UNIQUEMENT';
    RAISE NOTICE '';
    RAISE NOTICE 'WORKFLOW V1 FINAL:';
    RAISE NOTICE '  1. draft → confirmed (MANUEL)';
    RAISE NOTICE '     → Mouvement prévisionnel OUT (réservation)';
    RAISE NOTICE '  2. payment_status: pending → paid (MANUEL)';
    RAISE NOTICE '     → Utilisateur valide paiement';
    RAISE NOTICE '  3. warehouse_exit_at (MANUEL)';
    RAISE NOTICE '     → Mouvement réel OUT (stock diminué)';
    RAISE NOTICE '';
    RAISE NOTICE 'Utilisateur garde CONTRÔLE TOTAL.';
    RAISE NOTICE '========================================';
END $$;

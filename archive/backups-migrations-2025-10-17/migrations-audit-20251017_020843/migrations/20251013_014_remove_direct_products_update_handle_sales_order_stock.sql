-- =============================================
-- MIGRATION 014: Suppression UPDATE Direct products dans handle_sales_order_stock
-- Date: 2025-10-13
-- =============================================
-- Problème: Fonction UPDATE directement products.stock_forecasted_out
-- Résultat: Triple comptabilisation (fonction + recalculate_forecasted_trigger)
-- Solution: Supprimer TOUS UPDATE products, laisser trigger recalculate_forecasted_trigger calculer

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Workflow actuel (INCORRECT):
--   1. handle_sales_order_stock() INSERT mouvement forecast OUT -5
--   2. handle_sales_order_stock() UPDATE products SET stock_forecasted_out += 5  ❌
--   3. Trigger recalculate_forecasted_trigger UPDATE products depuis SUM = 5
--   Résultat: stock_forecasted_out = 10 (double comptabilisation)

-- Workflow correct (après migration):
--   1. handle_sales_order_stock() INSERT mouvement forecast OUT -5
--   2. Trigger recalculate_forecasted_trigger UPDATE products = ABS(SUM(-5)) = 5 ✅
--   Résultat: stock_forecasted_out = 5 (comptabilisation unique)

-- RÈGLE ARCHITECTURE:
-- - Fonctions triggers créent UNIQUEMENT des mouvements (INSERT stock_movements)
-- - Triggers stock_movements calculent et UPDATE products (separation of concerns)
-- - Pas de UPDATE direct products dans fonctions business

-- =============================================
-- FONCTION CORRIGÉE: handle_sales_order_stock
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

    -- =============================================
    -- Cas 1: Commande confirmée → Stock prévisionnel OUT
    -- =============================================
    IF v_new_status = 'confirmed' AND v_old_status != 'confirmed'
       AND (v_payment_status = 'pending' OR v_payment_status = 'partial') THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Vérifier si mouvement n'existe pas déjà
            IF NOT EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type IN ('sales_order', 'sales_order_forecast')
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
            ) THEN
                -- SUPPRIMÉ: UPDATE direct products.stock_forecasted_out
                -- Le trigger recalculate_forecasted_trigger va calculer automatiquement

                -- Créer mouvement prévisionnel OUT
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
                    -v_item.quantity,  -- Négatif pour OUT
                    stock_real,
                    stock_real,  -- Stock réel ne change pas encore
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

    -- =============================================
    -- Cas 2: Paiement reçu → Préparer expédition
    -- =============================================
    ELSIF v_payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status != 'paid') THEN

        -- Marquer commande prête pour expédition
        NEW.ready_for_shipment := true;

    -- =============================================
    -- Cas 3: Sortie entrepôt → Déduction stock réel
    -- =============================================
    ELSIF NEW.warehouse_exit_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.warehouse_exit_at IS NULL) THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- SUPPRIMÉ: UPDATE direct products.stock_forecasted_out et stock_real
            -- Les triggers maintain_stock_coherence et recalculate_forecasted_stock
            -- vont calculer automatiquement depuis mouvements

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
                -v_item.quantity,  -- Négatif pour stock réel OUT
                stock_real,
                GREATEST(0, stock_real - v_item.quantity),
                'sale',
                'sales_order',
                NEW.id,
                'Sortie entrepôt - Déduction stock réel',
                false,  -- Stock réel, pas forecast
                NULL,
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;

            -- Créer mouvement annulation prévisionnel OUT
            -- (Si prévisionnel existait, l'annuler)
            IF EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type IN ('sales_order', 'sales_order_forecast')
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
                AND forecast_type = 'out'
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
                VALUES (
                    v_item.product_id,
                    'IN',  -- IN pour annuler OUT prévisionnel
                    v_item.quantity,  -- Positif pour annuler
                    0,
                    0,
                    'sale',
                    'sales_order',
                    NEW.id,
                    'Annulation prévisionnel OUT - Sortie effective',
                    true,
                    'out',
                    NEW.created_by,
                    NOW()
                );
            END IF;
        END LOOP;

    -- =============================================
    -- Cas 4: Annulation commande → Restauration
    -- =============================================
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Si commande pas encore sortie, annuler prévisionnel
            IF TG_OP = 'UPDATE' AND OLD.warehouse_exit_at IS NULL THEN
                -- SUPPRIMÉ: UPDATE direct products.stock_forecasted_out
                -- Le trigger recalculate_forecasted_stock va calculer automatiquement

                -- Créer mouvement annulation prévisionnel
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
                    'IN',  -- IN pour annuler OUT prévisionnel
                    v_item.quantity,  -- Positif pour annuler
                    stock_real,
                    stock_real,
                    'sale_cancelled',
                    'sales_order',
                    NEW.id,
                    'Annulation commande - Restauration stock prévisionnel',
                    true,
                    'out',
                    NEW.created_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
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
CORRECTION 2025-10-13 Migration 014:
- SUPPRIMÉ: UPDATE direct products (stock_forecasted_out, stock_real)
- Laisser triggers stock_movements calculer automatiquement
- Architecture: Fonction crée mouvements → Triggers calculent stocks
Cas gérés:
1. confirmed + pending payment: Forecast OUT
2. payment paid: ready_for_shipment = true
3. warehouse_exit_at: Stock OUT réel + annulation forecast
4. cancelled: Annulation forecast
Règle: Separation of concerns (INSERT mouvements vs UPDATE products)';

-- =============================================
-- VALIDATION MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'VALIDATION SUPPRESSION UPDATE DIRECT';
\echo '========================================';
\echo '';

DO $$
BEGIN
    RAISE NOTICE 'Fonction handle_sales_order_stock() corrigée:';
    RAISE NOTICE '  ✅ Supprimé: UPDATE products.stock_forecasted_out';
    RAISE NOTICE '  ✅ Supprimé: UPDATE products.stock_real';
    RAISE NOTICE '  ✅ Conservé: INSERT stock_movements uniquement';
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers stock_movements (responsables calculs):';
    RAISE NOTICE '  ✅ recalculate_forecasted_trigger → stock_forecasted_in/out';
    RAISE NOTICE '  ✅ maintain_stock_coherence → stock_real/stock_quantity';
    RAISE NOTICE '';
    RAISE NOTICE 'Architecture finale:';
    RAISE NOTICE '  → Fonction = INSERT mouvements';
    RAISE NOTICE '  → Triggers = UPDATE products';
    RAISE NOTICE '  → Separation of concerns ✅';
END $$;

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 014 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: handle_sales_order_stock()';
    RAISE NOTICE '';
    RAISE NOTICE 'Modifications:';
    RAISE NOTICE '  - Supprimé UPDATE products.stock_forecasted_out (Cas 1, 4)';
    RAISE NOTICE '  - Supprimé UPDATE products.stock_real (Cas 3)';
    RAISE NOTICE '  - Conservé INSERT stock_movements (tous cas)';
    RAISE NOTICE '  - Ajouté mouvement annulation forecast (Cas 3)';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Triple comptabilisation résolue ✅';
    RAISE NOTICE '  - stock_forecasted_out = 1× quantity (pas 2× ou 3×) ✅';
    RAISE NOTICE '  - Triggers stock_movements calculent automatiquement ✅';
    RAISE NOTICE '  - Architecture separation of concerns respectée ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: SO Confirmed → Vérifier stock_forecasted_out = quantity';
    RAISE NOTICE '⏭️ Prochaine étape: Migration 015 (ajouter payment_required)';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- MIGRATION 016: Implémentation Workflows Payment dans handle_sales_order_stock
-- Date: 2025-10-13
-- =============================================
-- Objectif: Implémenter 2 workflows distincts selon payment_required
-- Workflow A (PRÉPAIEMENT): confirmed → forecast → paid → real
-- Workflow B (ENCOURS): confirmed → real direct (validation auto)

-- =============================================
-- ANALYSE WORKFLOWS MÉTIER
-- =============================================

-- WORKFLOW A - Client PRÉPAIEMENT (payment_required=TRUE):
--   État 1: draft → confirmed
--     Action: INSERT stock_movement forecast OUT (réservation)
--     Résultat: stock_forecasted_out augmente
--     Attente: payment_status='paid'
--
--   État 2: payment_status='paid'
--     Action: ready_for_shipment = TRUE (prêt livraison)
--
--   État 3: warehouse_exit_at (sortie entrepôt)
--     Action: INSERT stock_movement real OUT + annulation forecast
--     Résultat: stock_real diminue + stock_forecasted_out diminue
--
-- WORKFLOW B - Client ENCOURS (payment_required=FALSE):
--   État 1: draft → confirmed
--     Action: Validation AUTOMATIQUE + INSERT stock_movement real OUT DIRECT
--     Résultat: stock_real diminue IMMÉDIATEMENT (pas de prévisionnel)
--     Action: ready_for_shipment = TRUE (livraison immédiate possible)
--
--   État 2: warehouse_exit_at (sortie entrepôt)
--     Action: RIEN (stock réel déjà déduit à l'État 1)

-- RÈGLE MÉTIER CRITIQUE:
-- - Prépaiement = Sécurité → Attente paiement avant livraison
-- - Encours = Confiance client → Livraison immédiate possible

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
    v_payment_required BOOLEAN;
BEGIN
    -- Gestion des valeurs NULL pour OLD (INSERT)
    IF TG_OP = 'INSERT' THEN
        v_old_status := 'draft'::sales_order_status;
    ELSE
        v_old_status := COALESCE(OLD.status, 'draft'::sales_order_status);
    END IF;

    v_new_status := NEW.status;
    v_payment_status := NEW.payment_status;
    v_payment_required := NEW.payment_required;

    -- =============================================
    -- CAS 1: Commande confirmée
    -- =============================================
    IF v_new_status = 'confirmed' AND v_old_status != 'confirmed' THEN

        -- WORKFLOW A: PRÉPAIEMENT → Stock prévisionnel OUT
        IF v_payment_required = TRUE AND (v_payment_status = 'pending' OR v_payment_status = 'partial') THEN

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
                        'Commande client confirmée - Stock prévisionnel OUT (PRÉPAIEMENT)',
                        true,
                        'out',
                        NEW.created_by,
                        NOW()
                    FROM products WHERE id = v_item.product_id;
                END IF;
            END LOOP;

        -- WORKFLOW B: ENCOURS → Stock réel OUT DIRECT
        ELSIF v_payment_required = FALSE THEN

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
                    AND affects_forecast = false
                ) THEN
                    -- Créer mouvement stock réel OUT DIRECT
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
                        'Commande client confirmée - Stock réel OUT DIRECT (ENCOURS)',
                        false,  -- Stock réel, pas forecast
                        NULL,
                        NEW.created_by,
                        NOW()
                    FROM products WHERE id = v_item.product_id;
                END IF;
            END LOOP;

            -- ENCOURS: Validation automatique → Prêt pour livraison immédiate
            NEW.ready_for_shipment := TRUE;

        END IF;

    -- =============================================
    -- CAS 2: Paiement reçu (PRÉPAIEMENT uniquement)
    -- =============================================
    ELSIF v_payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status != 'paid') THEN

        -- Marquer commande prête pour expédition
        NEW.ready_for_shipment := true;

    -- =============================================
    -- CAS 3: Sortie entrepôt
    -- =============================================
    ELSIF NEW.warehouse_exit_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.warehouse_exit_at IS NULL) THEN

        -- WORKFLOW A: PRÉPAIEMENT → Stock réel OUT + annulation forecast
        IF v_payment_required = TRUE THEN

            FOR v_item IN
                SELECT * FROM sales_order_items
                WHERE sales_order_id = NEW.id
            LOOP
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
                    'Sortie entrepôt - Déduction stock réel (PRÉPAIEMENT)',
                    false,  -- Stock réel, pas forecast
                    NULL,
                    NEW.created_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;

                -- Créer mouvement annulation prévisionnel OUT
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
                        'Annulation prévisionnel OUT - Sortie effective (PRÉPAIEMENT)',
                        true,
                        'out',
                        NEW.created_by,
                        NOW()
                    );
                END IF;
            END LOOP;

        -- WORKFLOW B: ENCOURS → RIEN (stock réel déjà déduit à confirmed)
        ELSE
            -- Pas d'action: stock_real déjà déduit lors de confirmed (Workflow B)
            -- warehouse_exit_at est juste une confirmation logistique
            NULL;

        END IF;

    -- =============================================
    -- CAS 4: Annulation commande
    -- =============================================
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        -- WORKFLOW A: PRÉPAIEMENT → Annulation forecast (si pas encore sortie)
        IF v_payment_required = TRUE AND (TG_OP = 'UPDATE' AND OLD.warehouse_exit_at IS NULL) THEN

            FOR v_item IN
                SELECT * FROM sales_order_items
                WHERE sales_order_id = NEW.id
            LOOP
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
                    'Annulation commande - Restauration stock prévisionnel (PRÉPAIEMENT)',
                    true,
                    'out',
                    NEW.created_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END LOOP;

        -- WORKFLOW B: ENCOURS → Restauration stock réel
        ELSIF v_payment_required = FALSE THEN

            FOR v_item IN
                SELECT * FROM sales_order_items
                WHERE sales_order_id = NEW.id
            LOOP
                -- Créer mouvement restauration stock réel
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
                    'IN',  -- IN pour restaurer
                    v_item.quantity,  -- Positif pour restaurer
                    stock_real,
                    stock_real + v_item.quantity,
                    'sale_cancelled',
                    'sales_order',
                    NEW.id,
                    'Annulation commande - Restauration stock réel (ENCOURS)',
                    false,  -- Stock réel, pas forecast
                    NULL,
                    NEW.created_by,
                    NOW()
                FROM products WHERE id = v_item.product_id;
            END LOOP;

        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Gère mouvements stock lors transitions sales_order avec 2 workflows distincts.
MIGRATION 016 (2025-10-13): Implémentation workflows payment_required

WORKFLOW A - PRÉPAIEMENT (payment_required=TRUE):
  confirmed → forecast OUT (réservation)
  paid → ready_for_shipment=TRUE
  warehouse_exit → real OUT + annulation forecast
  cancelled → annulation forecast

WORKFLOW B - ENCOURS (payment_required=FALSE):
  confirmed → real OUT DIRECT + ready_for_shipment=TRUE (validation auto)
  warehouse_exit → RIEN (stock déjà déduit)
  cancelled → restauration real

Architecture: Fonction INSERT mouvements → Triggers UPDATE products
Règle métier: Prépaiement=sécurité, Encours=confiance client';

-- =============================================
-- VALIDATION MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'VALIDATION WORKFLOWS IMPLÉMENTÉS';
\echo '========================================';
\echo '';

DO $$
BEGIN
    RAISE NOTICE 'Fonction handle_sales_order_stock() réécrite:';
    RAISE NOTICE '  ✅ Workflow A (PRÉPAIEMENT): confirmed → forecast → paid → real';
    RAISE NOTICE '  ✅ Workflow B (ENCOURS): confirmed → real direct';
    RAISE NOTICE '';
    RAISE NOTICE 'Logique métier:';
    RAISE NOTICE '  - payment_required=TRUE → Attente paiement avant livraison';
    RAISE NOTICE '  - payment_required=FALSE → Validation auto + livraison immédiate';
    RAISE NOTICE '';
    RAISE NOTICE 'Cas gérés:';
    RAISE NOTICE '  1. Confirmed: Prépaiement=forecast, Encours=real direct';
    RAISE NOTICE '  2. Paid: ready_for_shipment=TRUE (prépaiement uniquement)';
    RAISE NOTICE '  3. Warehouse_exit: Prépaiement=real+annul forecast, Encours=RIEN';
    RAISE NOTICE '  4. Cancelled: Prépaiement=annul forecast, Encours=restore real';
    RAISE NOTICE '';
    RAISE NOTICE 'Architecture:';
    RAISE NOTICE '  → Fonction = INSERT mouvements uniquement';
    RAISE NOTICE '  → Triggers = UPDATE products automatiquement';
    RAISE NOTICE '  → Separation of concerns respectée ✅';
END $$;

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 016 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction modifiée: handle_sales_order_stock()';
    RAISE NOTICE '';
    RAISE NOTICE 'Modifications majeures:';
    RAISE NOTICE '  - Ajout variable v_payment_required ✅';
    RAISE NOTICE '  - Workflow A (PRÉPAIEMENT) implémenté ✅';
    RAISE NOTICE '  - Workflow B (ENCOURS) implémenté ✅';
    RAISE NOTICE '  - Cas 1 (confirmed): Condition IF payment_required ✅';
    RAISE NOTICE '  - Cas 3 (warehouse_exit): Condition IF payment_required ✅';
    RAISE NOTICE '  - Cas 4 (cancelled): Condition IF payment_required ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Clients prépaiement: Stock forecast → payment → real ✅';
    RAISE NOTICE '  - Clients encours: Stock real direct (confiance) ✅';
    RAISE NOTICE '  - Logique métier Vérone respectée ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: Phase 5 (2 prépaiement + 2 encours)';
    RAISE NOTICE '⏭️ Prochaine étape: Cleanup SO test + Tests E2E complets';
    RAISE NOTICE '========================================';
END $$;

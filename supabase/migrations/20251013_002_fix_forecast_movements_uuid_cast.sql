-- =============================================
-- MIGRATION: Correction Bug UUID Cast dans Forecast Movements
-- Date: 2025-10-13
-- =============================================
-- Problème identifié: create_purchase_order_forecast_movements() utilise p_purchase_order_id::text
-- mais reference_id dans stock_movements est de type UUID
-- Erreur: "operator does not exist: uuid = text"
-- Solution: Supprimer le cast ::text et utiliser UUID directement

-- =============================================
-- CORRECTION: Fonction create_purchase_order_forecast_movements()
-- =============================================

CREATE OR REPLACE FUNCTION create_purchase_order_forecast_movements(
    p_purchase_order_id UUID,
    p_performed_by UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_user_id UUID;
BEGIN
    -- Récupérer les infos de la commande
    SELECT * INTO v_order FROM purchase_orders WHERE id = p_purchase_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande achat introuvable: %', p_purchase_order_id;
    END IF;

    -- Déterminer l'utilisateur
    v_user_id := COALESCE(p_performed_by, v_order.validated_by, v_order.created_by);

    -- Créer mouvement prévisionnel IN pour chaque article
    FOR v_item IN
        SELECT * FROM purchase_order_items
        WHERE purchase_order_id = p_purchase_order_id
    LOOP
        -- Vérifier si mouvement prévisionnel n'existe pas déjà
        -- FIX: Supprimer ::text car reference_id est UUID
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'purchase_order_forecast'
            AND reference_id = p_purchase_order_id  -- FIX: Pas de cast ::text
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
                'IN',
                v_item.quantity,
                0, -- N'affecte pas le stock réel pour prévisionnel
                0,
                'purchase_order_forecast',
                p_purchase_order_id,  -- FIX: UUID direct sans cast
                FORMAT('Prévision réception commande %s - %s unités', v_order.po_number, v_item.quantity),
                'purchase_reception',  -- FIX: Utiliser enum valide
                true,
                'in',
                v_user_id,
                NOW()
            );

            -- Augmenter stock prévisionnel IN
            UPDATE products
            SET stock_forecasted_in = stock_forecasted_in + v_item.quantity
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CORRECTION: Fonction similaire pour Sales Orders (par cohérence)
-- =============================================

CREATE OR REPLACE FUNCTION create_sales_order_forecast_movements(
    p_sales_order_id UUID,
    p_performed_by UUID DEFAULT NULL
) RETURNS VOID AS $$
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

    -- Déterminer l'utilisateur
    v_user_id := COALESCE(p_performed_by, v_order.validated_by, v_order.created_by);

    -- Créer mouvement prévisionnel OUT pour chaque article
    FOR v_item IN
        SELECT * FROM sales_order_items
        WHERE sales_order_id = p_sales_order_id
    LOOP
        -- Vérifier si mouvement prévisionnel n'existe pas déjà
        -- FIX: Supprimer ::text car reference_id est UUID
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'sales_order_forecast'
            AND reference_id = p_sales_order_id  -- FIX: Pas de cast ::text
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
                p_sales_order_id,  -- FIX: UUID direct sans cast
                FORMAT('Prévision expédition commande %s - %s unités', v_order.order_number, v_item.quantity),
                'sale',  -- FIX: Utiliser enum valide
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
-- VÉRIFICATION: Commentaires sur les fonctions
-- =============================================

COMMENT ON FUNCTION create_purchase_order_forecast_movements(UUID, UUID) IS
'Crée les mouvements prévisionnels IN lors de la confirmation d''une commande fournisseur.
CORRECTION 2025-10-13: Suppression cast ::text incompatible avec type UUID de reference_id.
Augmente stock_forecasted_in pour chaque produit de la commande.';

COMMENT ON FUNCTION create_sales_order_forecast_movements(UUID, UUID) IS
'Crée les mouvements prévisionnels OUT lors de la validation d''une commande client.
CORRECTION 2025-10-13: Suppression cast ::text incompatible avec type UUID de reference_id.
Augmente stock_forecasted_out pour chaque produit de la commande.';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20251013_002 appliquée avec succès';
    RAISE NOTICE '✅ Fonction create_purchase_order_forecast_movements() corrigée (UUID direct)';
    RAISE NOTICE '✅ Fonction create_sales_order_forecast_movements() corrigée (UUID direct)';
    RAISE NOTICE '✅ Bug "operator does not exist: uuid = text" résolu';
    RAISE NOTICE '📊 Tests workflow PO/SO maintenant possibles sans erreur UUID cast';
END $$;

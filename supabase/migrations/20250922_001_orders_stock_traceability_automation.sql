-- =====================================================
-- MIGRATION: Automatisation Traçabilité Commandes ↔ Stock
-- Date: 2025-09-22
-- Objectif: Créer triggers automatiques pour lier commandes et mouvements stock
-- =====================================================

-- =====================================================
-- 1. FONCTIONS UTILITAIRES TRAÇABILITÉ
-- =====================================================

-- Fonction pour créer les mouvements prévisionnels des commandes clients
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
    v_user_id := COALESCE(p_performed_by, v_order.confirmed_by, v_order.created_by);

    -- Créer mouvement prévisionnel OUT pour chaque article
    FOR v_item IN
        SELECT * FROM sales_order_items
        WHERE sales_order_id = p_sales_order_id
    LOOP
        -- Vérifier si mouvement prévisionnel n'existe pas déjà
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'sales_order_forecast'
            AND reference_id = p_sales_order_id::text
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
                0, -- N'affecte pas le stock réel pour prévisionnel
                'sales_order_forecast',
                p_sales_order_id::text,
                'Commande client confirmée - Stock prévisionnel OUT',
                'sale',
                true,
                'out',
                v_user_id,
                v_order.confirmed_at
            );
        END IF;
    END LOOP;

    RAISE LOG 'Mouvements prévisionnels créés pour commande %', v_order.order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les mouvements réels de sortie entrepôt
CREATE OR REPLACE FUNCTION create_sales_order_shipment_movements(
    p_sales_order_id UUID,
    p_performed_by UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_user_id UUID;
    v_current_stock INTEGER;
BEGIN
    -- Récupérer les infos de la commande
    SELECT * INTO v_order FROM sales_orders WHERE id = p_sales_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande vente introuvable: %', p_sales_order_id;
    END IF;

    -- Déterminer l'utilisateur
    v_user_id := COALESCE(p_performed_by, v_order.warehouse_exit_by, v_order.shipped_by, v_order.confirmed_by);

    -- Créer mouvement réel OUT pour chaque article
    FOR v_item IN
        SELECT * FROM sales_order_items
        WHERE sales_order_id = p_sales_order_id
    LOOP
        -- Récupérer stock actuel
        SELECT stock_real INTO v_current_stock
        FROM products
        WHERE id = v_item.product_id;

        -- Vérifier si mouvement réel n'existe pas déjà
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'sales_order_shipped'
            AND reference_id = p_sales_order_id::text
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
                performed_by,
                performed_at
            ) VALUES (
                v_item.product_id,
                'OUT',
                v_item.quantity,
                v_current_stock,
                v_current_stock - v_item.quantity,
                'sales_order_shipped',
                p_sales_order_id::text,
                'Sortie entrepôt - Déduction stock réel',
                'sale',
                false, -- Mouvement réel, pas prévisionnel
                v_user_id,
                v_order.warehouse_exit_at
            );
        END IF;
    END LOOP;

    RAISE LOG 'Mouvements réels sortie créés pour commande %', v_order.order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les mouvements prévisionnels des commandes fournisseurs
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
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'purchase_order_forecast'
            AND reference_id = p_purchase_order_id::text
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
                0, -- N'affecte pas le stock réel pour prévisionnel
                'purchase_order_forecast',
                p_purchase_order_id::text,
                'Commande fournisseur confirmée - Stock prévisionnel IN',
                'purchase_reception',
                true,
                'in',
                v_user_id,
                v_order.validated_at
            );
        END IF;
    END LOOP;

    RAISE LOG 'Mouvements prévisionnels créés pour commande achat %', v_order.po_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer les mouvements prévisionnels lors d'annulation
CREATE OR REPLACE FUNCTION cancel_order_forecast_movements(
    p_order_id UUID,
    p_reference_type TEXT,
    p_performed_by UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_movement RECORD;
BEGIN
    -- Marquer les mouvements prévisionnels comme annulés
    FOR v_movement IN
        SELECT * FROM stock_movements
        WHERE reference_type = p_reference_type
        AND reference_id = p_order_id::text
        AND affects_forecast = true
    LOOP
        -- Créer un mouvement d'annulation inverse
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
            performed_by
        ) VALUES (
            v_movement.product_id,
            CASE WHEN v_movement.movement_type = 'IN' THEN 'OUT' ELSE 'IN' END,
            v_movement.quantity_change,
            0,
            0,
            p_reference_type || '_cancelled',
            p_order_id::text,
            'Annulation commande - Correction stock prévisionnel',
            'order_cancellation',
            true,
            CASE WHEN v_movement.forecast_type = 'in' THEN 'out' ELSE 'in' END,
            p_performed_by
        );
    END LOOP;

    RAISE LOG 'Mouvements prévisionnels annulés pour commande %', p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. TRIGGERS SALES_ORDERS (COMMANDES CLIENTS)
-- =====================================================

-- Fonction trigger pour sales_orders
CREATE OR REPLACE FUNCTION trg_sales_orders_stock_automation()
RETURNS TRIGGER AS $$
BEGIN
    -- Commande confirmée → Créer mouvements prévisionnels OUT
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
        PERFORM create_sales_order_forecast_movements(NEW.id, NEW.confirmed_by);
    END IF;

    -- Sortie entrepôt → Créer mouvements réels OUT
    IF OLD.warehouse_exit_at IS NULL AND NEW.warehouse_exit_at IS NOT NULL THEN
        PERFORM create_sales_order_shipment_movements(NEW.id, NEW.warehouse_exit_by);
    END IF;

    -- Commande annulée → Supprimer mouvements prévisionnels
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        PERFORM cancel_order_forecast_movements(NEW.id, 'sales_order_forecast', NEW.confirmed_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS sales_orders_stock_automation ON sales_orders;
CREATE TRIGGER sales_orders_stock_automation
    AFTER UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_sales_orders_stock_automation();

-- =====================================================
-- 3. TRIGGERS PURCHASE_ORDERS (COMMANDES FOURNISSEURS)
-- =====================================================

-- Fonction trigger pour purchase_orders
CREATE OR REPLACE FUNCTION trg_purchase_orders_stock_automation()
RETURNS TRIGGER AS $$
BEGIN
    -- Commande confirmée → Créer mouvements prévisionnels IN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
        PERFORM create_purchase_order_forecast_movements(NEW.id, NEW.validated_by);
    END IF;

    -- Commande annulée → Supprimer mouvements prévisionnels
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        PERFORM cancel_order_forecast_movements(NEW.id, 'purchase_order_forecast', NEW.validated_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS purchase_orders_stock_automation ON purchase_orders;
CREATE TRIGGER purchase_orders_stock_automation
    AFTER UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_purchase_orders_stock_automation();

-- =====================================================
-- 4. TRIGGERS PURCHASE_ORDER_RECEPTIONS (RÉCEPTIONS)
-- =====================================================

-- Fonction pour créer mouvements réels de réception
CREATE OR REPLACE FUNCTION create_purchase_reception_movement(
    p_reception_id UUID
) RETURNS VOID AS $$
DECLARE
    v_reception RECORD;
    v_order RECORD;
    v_current_stock INTEGER;
BEGIN
    -- Récupérer les infos de la réception
    SELECT por.*, po.po_number
    INTO v_reception
    FROM purchase_order_receptions por
    JOIN purchase_orders po ON por.purchase_order_id = po.id
    WHERE por.id = p_reception_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Réception introuvable: %', p_reception_id;
    END IF;

    -- Récupérer stock actuel
    SELECT stock_real INTO v_current_stock
    FROM products
    WHERE id = v_reception.product_id;

    -- Créer mouvement réel IN
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        unit_cost,
        reference_type,
        reference_id,
        notes,
        reason_code,
        affects_forecast,
        performed_by,
        performed_at
    ) VALUES (
        v_reception.product_id,
        'IN',
        v_reception.quantity_received,
        v_current_stock,
        v_current_stock + v_reception.quantity_received,
        NULL, -- Coût unitaire peut être ajouté plus tard
        'purchase_order_reception',
        v_reception.purchase_order_id::text,
        format('Réception fournisseur - Commande %s - Lot: %s',
               v_reception.po_number,
               COALESCE(v_reception.batch_number, 'N/A')),
        'purchase_reception',
        false, -- Mouvement réel, pas prévisionnel
        v_reception.received_by,
        v_reception.received_at
    );

    RAISE LOG 'Mouvement réel IN créé pour réception % (% unités)', v_reception.po_number, v_reception.quantity_received;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction trigger pour purchase_order_receptions
CREATE OR REPLACE FUNCTION trg_purchase_receptions_stock_automation()
RETURNS TRIGGER AS $$
BEGIN
    -- Nouvelle réception → Créer mouvement réel IN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_purchase_reception_movement(NEW.id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS purchase_receptions_stock_automation ON purchase_order_receptions;
CREATE TRIGGER purchase_receptions_stock_automation
    AFTER INSERT ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION trg_purchase_receptions_stock_automation();

-- =====================================================
-- 5. FONCTION DE DIAGNOSTIC ET MAINTENANCE
-- =====================================================

-- Fonction pour diagnostiquer la cohérence commandes/stock
CREATE OR REPLACE FUNCTION check_orders_stock_consistency()
RETURNS TABLE (
    order_type TEXT,
    order_id UUID,
    order_number TEXT,
    product_id UUID,
    product_name TEXT,
    expected_movements INTEGER,
    actual_movements INTEGER,
    status TEXT
) AS $$
BEGIN
    -- Vérifier cohérence commandes clients confirmées
    RETURN QUERY
    WITH sales_expected AS (
        SELECT
            so.id as order_id,
            so.order_number,
            soi.product_id,
            p.name as product_name,
            COUNT(soi.*) as expected_forecast_movements
        FROM sales_orders so
        JOIN sales_order_items soi ON so.id = soi.sales_order_id
        JOIN products p ON soi.product_id = p.id
        WHERE so.status IN ('confirmed', 'partially_shipped', 'shipped', 'delivered')
        GROUP BY so.id, so.order_number, soi.product_id, p.name
    ),
    sales_actual AS (
        SELECT
            sm.reference_id::uuid as order_id,
            sm.product_id,
            COUNT(*) as actual_movements
        FROM stock_movements sm
        WHERE sm.reference_type = 'sales_order_forecast'
        AND sm.affects_forecast = true
        GROUP BY sm.reference_id::uuid, sm.product_id
    )
    SELECT
        'sales_order'::TEXT,
        se.order_id,
        se.order_number,
        se.product_id,
        se.product_name,
        se.expected_forecast_movements::INTEGER,
        COALESCE(sa.actual_movements, 0)::INTEGER,
        CASE
            WHEN COALESCE(sa.actual_movements, 0) = se.expected_forecast_movements THEN 'OK'
            ELSE 'INCONSISTENT'
        END::TEXT
    FROM sales_expected se
    LEFT JOIN sales_actual sa ON se.order_id = sa.order_id AND se.product_id = sa.product_id;

    -- Ajouter vérifications pour commandes fournisseurs si nécessaire
    -- TODO: Ajouter logique similaire pour purchase_orders
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTAIRES SYSTÈME
-- =====================================================

COMMENT ON FUNCTION create_sales_order_forecast_movements(UUID, UUID) IS
'Crée automatiquement les mouvements de stock prévisionnels lors de la confirmation d''une commande client';

COMMENT ON FUNCTION create_sales_order_shipment_movements(UUID, UUID) IS
'Crée automatiquement les mouvements de stock réels lors de la sortie entrepôt d''une commande client';

COMMENT ON FUNCTION create_purchase_order_forecast_movements(UUID, UUID) IS
'Crée automatiquement les mouvements de stock prévisionnels lors de la confirmation d''une commande fournisseur';

COMMENT ON FUNCTION cancel_order_forecast_movements(UUID, TEXT, UUID) IS
'Annule les mouvements prévisionnels lors de l''annulation d''une commande';

COMMENT ON FUNCTION check_orders_stock_consistency() IS
'Fonction de diagnostic pour vérifier la cohérence entre les commandes et les mouvements de stock automatiques';

-- =====================================================
-- 7. PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Accorder permissions aux rôles autorisés
GRANT EXECUTE ON FUNCTION create_sales_order_forecast_movements(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_sales_order_shipment_movements(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_purchase_order_forecast_movements(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_order_forecast_movements(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_purchase_reception_movement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_orders_stock_consistency() TO authenticated;

-- =====================================================
-- 8. LOGS ET VALIDATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration traçabilité commandes terminée';
    RAISE NOTICE '📋 Fonctions créées:';
    RAISE NOTICE '   - create_sales_order_forecast_movements()';
    RAISE NOTICE '   - create_sales_order_shipment_movements()';
    RAISE NOTICE '   - create_purchase_order_forecast_movements()';
    RAISE NOTICE '   - cancel_order_forecast_movements()';
    RAISE NOTICE '   - create_purchase_reception_movement()';
    RAISE NOTICE '🔄 Triggers automatiques activés:';
    RAISE NOTICE '   - sales_orders → mouvements stock automatiques';
    RAISE NOTICE '   - purchase_orders → mouvements stock automatiques';
    RAISE NOTICE '   - purchase_order_receptions → mouvements stock automatiques';
    RAISE NOTICE '🔍 Fonction diagnostic: check_orders_stock_consistency()';
END $$;
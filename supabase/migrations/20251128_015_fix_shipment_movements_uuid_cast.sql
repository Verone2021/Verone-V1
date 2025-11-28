-- ============================================================================
-- Migration: Fix UUID Cast Bug in create_sales_order_shipment_movements
-- Date: 2025-11-28
-- Description: Corriger le bug de cast uuid::text dans la comparaison
--   BUG: reference_id = p_sales_order_id::text (uuid = text erreur)
--   FIX: reference_id = p_sales_order_id (uuid = uuid)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_sales_order_shipment_movements(p_sales_order_id uuid, p_performed_by uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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

        -- ✅ FIX: Comparer UUID avec UUID (sans ::text)
        IF NOT EXISTS (
            SELECT 1 FROM stock_movements
            WHERE reference_type = 'sales_order_shipped'
            AND reference_id = p_sales_order_id  -- ✅ UUID = UUID
            AND product_id = v_item.product_id
        ) THEN
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reference_type,
                reference_id,  -- ✅ UUID column
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
                p_sales_order_id,  -- ✅ UUID value (pas de ::text)
                'Sortie entrepôt - Déduction stock réel',
                'sale',
                false, -- Mouvement réel, pas prévisionnel
                v_user_id,
                COALESCE(v_order.warehouse_exit_at, NOW())
            );
        END IF;
    END LOOP;

    RAISE LOG 'Mouvements réels sortie créés pour commande %', v_order.order_number;
END;
$function$;

-- Commentaire de documentation
COMMENT ON FUNCTION create_sales_order_shipment_movements(uuid, uuid) IS
'Crée les mouvements de stock OUT pour une commande client expédiée.
FIX 2025-11-28: Corrigé bug uuid::text cast.
Migration: 20251128_015';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251128_015 terminée';
    RAISE NOTICE '   Fonction create_sales_order_shipment_movements corrigée';
    RAISE NOTICE '   Bug fix: reference_id UUID comparaison';
    RAISE NOTICE '========================================';
END $$;

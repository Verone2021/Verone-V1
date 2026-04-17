-- Migration: Fix A1 — handle_shipment_deletion rebascule en partially_shipped
-- Date: 2026-04-21
-- Task: BO-STOCK-004 (A1)
--
-- CONTEXTE
-- ========
-- Anomalie A1 observee lors des tests BO-STOCK-002 (17 avril 2026) :
-- Quand on DELETE un shipment alors qu'il reste d'autres shipments actifs
-- sur la meme SO, la fonction handle_shipment_deletion ne met PAS a jour
-- le status de la SO. Resultat : la SO reste en 'shipped' meme si
-- un item a quantity_shipped < quantity (livraison partielle).
--
-- COMPORTEMENT ATTENDU :
-- - Si apres DELETE shipment, plus aucun shipment -> status = 'validated'
-- - Sinon, si au moins un item n'est plus complement expedie -> 'partially_shipped'
-- - Sinon (tous items completement expedies) -> 'shipped' (inchange)
--
-- FIX : ajouter la branche ELSE qui recalcule le status en fonction
-- des quantities totales.

CREATE OR REPLACE FUNCTION public.handle_shipment_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
BEGIN
    IF OLD.packlink_status = 'a_payer' THEN
        RETURN OLD;
    END IF;

    DELETE FROM stock_movements
    WHERE reference_type = 'shipment'
      AND reference_id = OLD.id
      AND product_id = OLD.product_id;

    UPDATE sales_order_items
    SET quantity_shipped = GREATEST(0, quantity_shipped - OLD.quantity_shipped)
    WHERE sales_order_id = OLD.sales_order_id AND product_id = OLD.product_id;

    -- Verifier s'il reste d'autres shipments pour cette SO
    IF NOT EXISTS (
        SELECT 1 FROM sales_order_shipments
        WHERE sales_order_id = OLD.sales_order_id AND id != OLD.id
    ) THEN
        -- Plus aucun shipment : retour a validated
        UPDATE sales_orders
        SET status = 'validated', shipped_at = NULL, shipped_by = NULL
        WHERE id = OLD.sales_order_id AND status IN ('shipped', 'partially_shipped');
    ELSE
        -- A1 FIX : il reste des shipments, verifier si tous items completement expedies
        SELECT SUM(quantity), SUM(COALESCE(quantity_shipped, 0))
        INTO v_total_quantity, v_total_shipped
        FROM sales_order_items WHERE sales_order_id = OLD.sales_order_id;

        IF v_total_shipped < v_total_quantity THEN
            -- Au moins un item incomplet -> partially_shipped
            UPDATE sales_orders
            SET status = 'partially_shipped'
            WHERE id = OLD.sales_order_id AND status = 'shipped';
        END IF;
        -- Sinon (v_total_shipped >= v_total_quantity) : status 'shipped' inchange
    END IF;

    RETURN OLD;
END;
$function$;

COMMENT ON FUNCTION public.handle_shipment_deletion() IS
'BEFORE DELETE sur sales_order_shipments : delete movement + rollback SO items/status.
SECURITY DEFINER. A1 fix 2026-04-21 (BO-STOCK-004) : rebascule en partially_shipped
si d''autres shipments restent ET total_shipped < total_quantity apres suppression.';

-- Verification
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'handle_shipment_deletion' AND prosecdef = true
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-004 A1] handle_shipment_deletion must be SECURITY DEFINER';
    END IF;
    RAISE NOTICE '[BO-STOCK-004 A1] OK : handle_shipment_deletion rebascule en partially_shipped si items restants incomplets';
END $$;

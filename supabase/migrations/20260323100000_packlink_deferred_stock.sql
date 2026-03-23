-- Migration: Packlink deferred stock decrement
-- Date: 2026-03-23
--
-- CONTEXTE:
-- Quand Verone crée une expédition Packlink, le transport n'est pas encore payé.
-- Le stock ne doit être décrémenté que quand Verone a payé le transport à Packlink
-- (webhook shipment.carrier.success).
--
-- DISTINCTION IMPORTANTE:
-- - payment_status (sur sales_orders) = le CLIENT paie Verone (rentrée d'argent)
-- - packlink_status (sur sales_order_shipments) = Verone paie le TRANSPORT à Packlink (charge)
-- Ce sont deux flux financiers DIFFERENTS, ne pas confondre.

-- 1. Ajouter packlink_status à sales_order_shipments
-- Valeurs possibles:
--   NULL        = expédition non-Packlink (manuelle, retrait, main propre)
--   'a_payer'   = expédition créée sur Packlink, transport pas encore payé par Verone
--   'paye'      = transport payé par Verone à Packlink, colis en préparation
--   'in_transit' = colis en transit
--   'delivered'  = colis livré au destinataire
--   'incident'   = problème signalé par le transporteur
ALTER TABLE sales_order_shipments
ADD COLUMN IF NOT EXISTS packlink_status TEXT DEFAULT NULL;

COMMENT ON COLUMN sales_order_shipments.packlink_status IS
'Statut expédition Packlink (paiement TRANSPORT par Verone, PAS le paiement client).
NULL = expédition non-Packlink. a_payer/paye/in_transit/delivered/incident.';

-- 2. Modifier le trigger INSERT: skip décrémentation stock si packlink_status = 'a_payer'
CREATE OR REPLACE FUNCTION update_stock_on_shipment()
RETURNS TRIGGER AS $$
DECLARE
    v_order_number TEXT;
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    -- PACKLINK: Si packlink_status = 'a_payer', le transport n'est pas encore
    -- payé par Verone à Packlink. On NE décrémente PAS le stock maintenant.
    -- Le stock sera décrémenté quand Packlink confirme l'enlèvement (trigger UPDATE).
    IF NEW.packlink_status = 'a_payer' THEN
        SELECT order_number INTO v_order_number
        FROM sales_orders WHERE id = NEW.sales_order_id;

        RAISE NOTICE 'SO % — expedition Packlink créée, transport a payer par Verone. Stock non décrémenté.', v_order_number;
        RETURN NEW;
    END IF;

    -- === FLUX NORMAL (expéditions manuelles, retrait, main propre) ===

    SELECT stock_real INTO v_stock_before
    FROM products WHERE id = NEW.product_id;

    UPDATE products
    SET
        stock_real = stock_real - NEW.quantity_shipped,
        stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
    WHERE id = NEW.product_id
    RETURNING stock_real INTO v_stock_after;

    INSERT INTO stock_movements (
        product_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, notes, reason_code, performed_by
    ) VALUES (
        NEW.product_id, 'OUT', -NEW.quantity_shipped, v_stock_before, v_stock_after,
        'shipment', NEW.id,
        'Expédition commande client SO #' || (SELECT order_number FROM sales_orders WHERE id = NEW.sales_order_id),
        'sale', NEW.shipped_by
    );

    UPDATE sales_order_items
    SET quantity_shipped = quantity_shipped + NEW.quantity_shipped
    WHERE sales_order_id = NEW.sales_order_id AND product_id = NEW.product_id;

    SELECT order_number INTO v_order_number
    FROM sales_orders WHERE id = NEW.sales_order_id;

    SELECT SUM(quantity), SUM(quantity_shipped)
    INTO v_total_quantity, v_total_shipped
    FROM sales_order_items WHERE sales_order_id = NEW.sales_order_id;

    IF v_total_shipped >= v_total_quantity THEN
        UPDATE sales_orders
        SET status = 'shipped', shipped_at = NOW(), shipped_by = NEW.shipped_by
        WHERE id = NEW.sales_order_id AND status != 'shipped';
        RAISE NOTICE 'SO % fully shipped', v_order_number;
    ELSIF v_total_shipped > 0 THEN
        UPDATE sales_orders
        SET status = 'partially_shipped'
        WHERE id = NEW.sales_order_id AND status NOT IN ('shipped', 'partially_shipped', 'delivered');
        RAISE NOTICE 'SO % partially shipped', v_order_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Nouveau trigger AFTER UPDATE: quand Verone paie le transport,
-- décrémente le stock et met à jour le statut commande
CREATE OR REPLACE FUNCTION confirm_packlink_shipment_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_order_number TEXT;
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    -- Se déclenche UNIQUEMENT quand packlink_status passe de 'a_payer' à 'paye'
    -- = Verone a payé le transport à Packlink, le transporteur va enlever le colis
    IF OLD.packlink_status = 'a_payer' AND NEW.packlink_status = 'paye' THEN

        SELECT stock_real INTO v_stock_before
        FROM products WHERE id = NEW.product_id;

        UPDATE products
        SET
            stock_real = stock_real - NEW.quantity_shipped,
            stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
        WHERE id = NEW.product_id
        RETURNING stock_real INTO v_stock_after;

        INSERT INTO stock_movements (
            product_id, movement_type, quantity_change, quantity_before, quantity_after,
            reference_type, reference_id, notes, reason_code, performed_by
        ) VALUES (
            NEW.product_id, 'OUT', -NEW.quantity_shipped, v_stock_before, v_stock_after,
            'shipment', NEW.id,
            'Transport payé par Verone — Expédition Packlink SO #' || (SELECT order_number FROM sales_orders WHERE id = NEW.sales_order_id),
            'sale', NEW.shipped_by
        );

        UPDATE sales_order_items
        SET quantity_shipped = quantity_shipped + NEW.quantity_shipped
        WHERE sales_order_id = NEW.sales_order_id AND product_id = NEW.product_id;

        SELECT order_number INTO v_order_number
        FROM sales_orders WHERE id = NEW.sales_order_id;

        SELECT SUM(quantity), SUM(quantity_shipped)
        INTO v_total_quantity, v_total_shipped
        FROM sales_order_items WHERE sales_order_id = NEW.sales_order_id;

        IF v_total_shipped >= v_total_quantity THEN
            UPDATE sales_orders
            SET status = 'shipped', shipped_at = NOW(), shipped_by = NEW.shipped_by
            WHERE id = NEW.sales_order_id AND status != 'shipped';
            RAISE NOTICE 'SO % fully shipped (transport Packlink payé par Verone)', v_order_number;
        ELSIF v_total_shipped > 0 THEN
            UPDATE sales_orders
            SET status = 'partially_shipped'
            WHERE id = NEW.sales_order_id AND status NOT IN ('shipped', 'partially_shipped', 'delivered');
            RAISE NOTICE 'SO % partially shipped (transport Packlink payé par Verone)', v_order_number;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_packlink_confirm_stock ON sales_order_shipments;
CREATE TRIGGER trigger_packlink_confirm_stock
AFTER UPDATE ON sales_order_shipments
FOR EACH ROW
EXECUTE FUNCTION confirm_packlink_shipment_stock();

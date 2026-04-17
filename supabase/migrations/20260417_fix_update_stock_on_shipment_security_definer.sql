-- Migration: Fix trigger shipment RLS silent failure + restore DELETE trigger
-- Date: 2026-04-17
-- Task: BO-STOCK-001
--
-- CONTEXTE DU BUG
-- ================
-- Depuis la migration 20260323100000_packlink_deferred_stock.sql (23 mars 2026),
-- la fonction update_stock_on_shipment() est definie SANS SECURITY DEFINER.
-- Elle s'execute en SECURITY INVOKER avec les droits du role appelant (staff).
--
-- Or sales_order_items n'a AUCUNE policy RLS UPDATE pour staff back-office
-- (uniquement `linkme_users_update_own_order_items` pour affilies LinkMe draft).
-- Resultat : quand le trigger tente l'UPDATE de quantity_shipped via l'INSERT
-- de staff, la policy le filtre silencieusement -> 0 rows affected, pas d'erreur.
--
-- CONSEQUENCES CONSTATEES (incident SO-2026-00124 le 16 avril 2026) :
-- - stock_movements + products.stock_real bien mis a jour (tables avec policy staff)
-- - sales_order_items.quantity_shipped reste a 0
-- - sales_orders.status reste 'validated' (au lieu de 'shipped')
-- - UI voit la commande comme "a expedier" alors que le stock est sorti
--
-- FIX : SECURITY DEFINER + SET search_path = public sur les triggers concernes.
-- Pattern standard ERP/Odoo pour les triggers metier transactionnels.
--
-- ETAPE 3 : restauration de trigger_before_delete_shipment (migration
-- 20251124_002_trigger_delete_shipment_reverse_stock.sql) qui a disparu de la DB
-- sans trace. Permet de rollback proprement une expedition supprimee.

-- ============================================================================
-- STEP 1: update_stock_on_shipment() - ajout SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_stock_on_shipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_order_number TEXT;
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    -- Packlink a_payer : pas de decrement stock (attente paiement transport)
    IF NEW.packlink_status = 'a_payer' THEN
        SELECT order_number INTO v_order_number
        FROM sales_orders WHERE id = NEW.sales_order_id;
        RAISE NOTICE 'SO % — expedition Packlink creee, transport a payer. Stock non decremente.', v_order_number;
        RETURN NEW;
    END IF;

    -- Flux normal : manuel / retrait / main propre / Packlink paye
    SELECT stock_real INTO v_stock_before
    FROM products WHERE id = NEW.product_id;

    UPDATE products
    SET stock_real = stock_real - NEW.quantity_shipped,
        stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
    WHERE id = NEW.product_id
    RETURNING stock_real INTO v_stock_after;

    INSERT INTO stock_movements (
        product_id, movement_type, quantity_change, quantity_before, quantity_after,
        reference_type, reference_id, notes, reason_code, performed_by
    ) VALUES (
        NEW.product_id, 'OUT', -NEW.quantity_shipped, v_stock_before, v_stock_after,
        'shipment', NEW.id,
        'Expedition commande client SO #' || (SELECT order_number FROM sales_orders WHERE id = NEW.sales_order_id),
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
$function$;

COMMENT ON FUNCTION public.update_stock_on_shipment() IS
'AFTER INSERT sur sales_order_shipments : decrement stock, insert movement, update SO items + status.
SECURITY DEFINER pour bypass RLS (staff n''a pas de policy UPDATE sur sales_order_items).
Fix 2026-04-17 (BO-STOCK-001) : cassait quantity_shipped + status depuis 2026-03-23.';

-- ============================================================================
-- STEP 2: confirm_packlink_shipment_stock() - ajout SECURITY DEFINER
-- ============================================================================
-- Meme bug RLS sur ce trigger (Packlink a_payer -> paye via webhook).

CREATE OR REPLACE FUNCTION public.confirm_packlink_shipment_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_order_number TEXT;
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    IF OLD.packlink_status = 'a_payer' AND NEW.packlink_status = 'paye' THEN
        SELECT stock_real INTO v_stock_before
        FROM products WHERE id = NEW.product_id;

        UPDATE products
        SET stock_real = stock_real - NEW.quantity_shipped,
            stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
        WHERE id = NEW.product_id
        RETURNING stock_real INTO v_stock_after;

        INSERT INTO stock_movements (
            product_id, movement_type, quantity_change, quantity_before, quantity_after,
            reference_type, reference_id, notes, reason_code, performed_by
        ) VALUES (
            NEW.product_id, 'OUT', -NEW.quantity_shipped, v_stock_before, v_stock_after,
            'shipment', NEW.id,
            'Transport paye par Verone — Expedition Packlink SO #' || (SELECT order_number FROM sales_orders WHERE id = NEW.sales_order_id),
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
            RAISE NOTICE 'SO % fully shipped (Packlink paye)', v_order_number;
        ELSIF v_total_shipped > 0 THEN
            UPDATE sales_orders
            SET status = 'partially_shipped'
            WHERE id = NEW.sales_order_id AND status NOT IN ('shipped', 'partially_shipped', 'delivered');
            RAISE NOTICE 'SO % partially shipped (Packlink paye)', v_order_number;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.confirm_packlink_shipment_stock() IS
'AFTER UPDATE sur sales_order_shipments : confirme stock OUT quand Packlink passe a_payer -> paye.
SECURITY DEFINER pour bypass RLS. Fix 2026-04-17 (BO-STOCK-001) meme bug que update_stock_on_shipment.';

-- ============================================================================
-- STEP 3: Restaurer trigger_before_delete_shipment + handle_shipment_deletion
-- ============================================================================
-- Ce trigger a disparu de la DB sans trace dans les migrations.
-- Strategie : deleguer au trigger trg_reverse_stock_on_movement_delete (qui
-- restaure stock_real automatiquement lorsqu'on DELETE un stock_movement).
-- On ne fait PAS UPDATE products ici pour eviter une double restauration
-- (incident observe lors du cleanup manuel du 2026-04-17).

CREATE OR REPLACE FUNCTION public.handle_shipment_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Packlink 'a_payer' : aucun stock_movement cree -> rien a defaire
    IF OLD.packlink_status = 'a_payer' THEN
        RETURN OLD;
    END IF;

    -- DELETE le stock_movement associe.
    -- Le trigger trg_reverse_stock_on_movement_delete (BEFORE DELETE sur
    -- stock_movements) va restaurer stock_real automatiquement.
    DELETE FROM stock_movements
    WHERE reference_type = 'shipment'
      AND reference_id = OLD.id
      AND product_id = OLD.product_id;

    -- Rollback quantity_shipped sur sales_order_items
    UPDATE sales_order_items
    SET quantity_shipped = GREATEST(0, quantity_shipped - OLD.quantity_shipped)
    WHERE sales_order_id = OLD.sales_order_id AND product_id = OLD.product_id;

    -- Rollback status si plus aucune expedition restante pour cette SO
    IF NOT EXISTS (
        SELECT 1 FROM sales_order_shipments
        WHERE sales_order_id = OLD.sales_order_id AND id != OLD.id
    ) THEN
        UPDATE sales_orders
        SET status = 'validated', shipped_at = NULL, shipped_by = NULL
        WHERE id = OLD.sales_order_id AND status IN ('shipped', 'partially_shipped');
    END IF;

    RETURN OLD;
END;
$function$;

COMMENT ON FUNCTION public.handle_shipment_deletion() IS
'BEFORE DELETE sur sales_order_shipments : delete movement (reverse via trigger) + rollback SO items/status.
SECURITY DEFINER. Restaure l''ancien trigger disparu (migration 20251124_002).';

DROP TRIGGER IF EXISTS trigger_before_delete_shipment ON sales_order_shipments;

CREATE TRIGGER trigger_before_delete_shipment
    BEFORE DELETE ON sales_order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION handle_shipment_deletion();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    v_update_stock_secdef BOOLEAN;
    v_confirm_packlink_secdef BOOLEAN;
    v_deletion_secdef BOOLEAN;
    v_delete_trigger_exists BOOLEAN;
BEGIN
    SELECT prosecdef INTO v_update_stock_secdef FROM pg_proc WHERE proname = 'update_stock_on_shipment';
    SELECT prosecdef INTO v_confirm_packlink_secdef FROM pg_proc WHERE proname = 'confirm_packlink_shipment_stock';
    SELECT prosecdef INTO v_deletion_secdef FROM pg_proc WHERE proname = 'handle_shipment_deletion';
    SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_before_delete_shipment')
    INTO v_delete_trigger_exists;

    IF NOT v_update_stock_secdef THEN
        RAISE EXCEPTION 'update_stock_on_shipment should be SECURITY DEFINER';
    END IF;
    IF NOT v_confirm_packlink_secdef THEN
        RAISE EXCEPTION 'confirm_packlink_shipment_stock should be SECURITY DEFINER';
    END IF;
    IF NOT v_deletion_secdef THEN
        RAISE EXCEPTION 'handle_shipment_deletion should be SECURITY DEFINER';
    END IF;
    IF NOT v_delete_trigger_exists THEN
        RAISE EXCEPTION 'trigger_before_delete_shipment should exist';
    END IF;

    RAISE NOTICE '[BO-STOCK-001] Fix applique: 3 fonctions SECURITY DEFINER + trigger DELETE restaure';
END $$;

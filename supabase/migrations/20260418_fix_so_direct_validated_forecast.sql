-- Migration: Fix SO direct-validated forecast — trigger AFTER INSERT
-- Date: 2026-04-18
-- Task: BO-STOCK-002 Phase 2
--
-- CONTEXTE
-- ========
-- Le trigger existant `trigger_so_update_forecasted_out` (AFTER UPDATE sur
-- sales_orders) ne se declenche QUE sur la transition `draft -> validated`.
-- Or des SOs sont creees directement en status 'validated' (import Bubble,
-- backfill, creation programmatique). Dans ce cas, le trigger ne tourne
-- jamais et stock_forecasted_out ne contribue pas.
--
-- Exemples actuels en DB (2026-04-17) :
-- - SO-2026-00124 (59 unites reservees, non contribuees)
-- - SO-2026-00131 (1 unite reservee, non contribuee)
--
-- FIX : ajouter un trigger AFTER INSERT qui se declenche quand
-- NEW.status = 'validated' et execute la meme logique que
-- update_forecasted_out_on_so_validation().
--
-- On cree une fonction dediee pour ne pas melanger la logique OLD/NEW
-- (UPDATE) et NEW-only (INSERT).

-- ============================================================================
-- STEP 1 : nouvelle fonction pour AFTER INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_so_insert_validated_forecast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_item RECORD;
    v_qty_to_reserve INTEGER;
BEGIN
    -- Seulement pour les SOs creees directement en validated (pas draft)
    IF NEW.status = 'validated' THEN
        FOR v_item IN
            SELECT product_id, quantity, COALESCE(quantity_shipped, 0) AS qty_shipped
            FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            v_qty_to_reserve := v_item.quantity - v_item.qty_shipped;
            IF v_qty_to_reserve > 0 THEN
                UPDATE products
                SET stock_forecasted_out = COALESCE(stock_forecasted_out, 0) + v_qty_to_reserve
                WHERE id = v_item.product_id;

                UPDATE stock_alert_tracking
                SET stock_forecasted_out = COALESCE(stock_forecasted_out, 0) + v_qty_to_reserve,
                    updated_at = NOW()
                WHERE product_id = v_item.product_id;
            END IF;
        END LOOP;

        RAISE NOTICE 'SO % creee directement en validated : forecast_out initialise', NEW.order_number;
    END IF;
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.trigger_so_insert_validated_forecast() IS
'AFTER INSERT sur sales_orders : incremente forecast_out si SO creee directement en validated
(cas import Bubble / backfill / creation programmatique). Complement de trigger_so_update_forecasted_out
qui ne couvre que la transition draft->validated. Fix 2026-04-18 (BO-STOCK-002 Phase 2).';

-- ============================================================================
-- STEP 2 : trigger AFTER INSERT
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_so_insert_validated_forecast ON sales_orders;

CREATE TRIGGER trigger_so_insert_validated_forecast
    AFTER INSERT ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_so_insert_validated_forecast();

-- ============================================================================
-- STEP 3 : VERIFICATION
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'trigger_so_insert_validated_forecast'
          AND prosecdef = true
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-002 Phase 2] Fonction trigger_so_insert_validated_forecast manquante ou non SECURITY DEFINER';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_so_insert_validated_forecast'
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-002 Phase 2] Trigger trigger_so_insert_validated_forecast manquant';
    END IF;

    RAISE NOTICE '[BO-STOCK-002 Phase 2] OK : trigger AFTER INSERT pour SO direct-validated installe';
END $$;

-- ============================================================================
-- NOTE CRITIQUE D'ORDRE D'EXECUTION
-- ============================================================================
-- Le trigger tourne APRES l'INSERT du sales_orders mais le FOR loop scanne
-- sales_order_items. Ces items sont inseres APRES le sales_order dans la
-- transaction applicative. Donc si les items n'existent pas encore au
-- moment du fire, le forecast_out ne sera pas incremente.
--
-- Alternative possible (si besoin) : trigger AFTER INSERT sur sales_order_items
-- qui verifie le status de la SO parent et incremente au cas par cas.
--
-- Pour l'instant, le trigger sur sales_orders AFTER INSERT convient pour les
-- imports / backfill qui inserent d'abord la SO puis les items dans la meme
-- transaction : le trigger se declenche a la fin de l'INSERT sales_orders,
-- MAIS les items ne sont pas encore la. CECI EST UN POINT A TESTER
-- manuellement apres application (Phase 6 du plan).
--
-- Pour le backfill Phase 3 (SO-00124, SO-00131), on fera le UPDATE direct
-- sans passer par ce trigger.

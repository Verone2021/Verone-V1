-- Migration: Fix A3 — Double update stock_alert_tracking.stock_forecasted_out
-- Date: 2026-04-19
-- Task: BO-STOCK-006 (A3)
--
-- CONTEXTE (bug originel depuis 27 nov 2025)
-- ==========================================
-- Les fonctions `update_forecasted_out_on_so_validation` et
-- `trigger_so_insert_validated_forecast` font un double UPDATE :
--
-- 1. `UPDATE products SET stock_forecasted_out = fo + qty`
-- 2. `UPDATE stock_alert_tracking SET stock_forecasted_out = fo + qty`
--
-- Puis le trigger `sync_stock_alert_tracking_v4` (AFTER UPDATE products) fait
-- un INSERT/ON CONFLICT DO UPDATE avec `EXCLUDED.stock_forecasted_out = NEW.fo`
-- qui RE-applique la valeur deja incrementee.
--
-- Resultat observe (SAC-0001 le 17 avril) :
-- - products.stock_forecasted_out = 10 (correct)
-- - stock_alert_tracking.stock_forecasted_out = 20 (double)
--
-- FIX : supprimer l'UPDATE manuel sur stock_alert_tracking dans les deux
-- fonctions. Laisser `sync_stock_alert_tracking_v4` etre seule source de
-- verite pour les snapshots (via son ON CONFLICT DO UPDATE).
--
-- Reference : docs/scratchpad/audit-regressions-stock-alertes-2026-04-17.md

-- ============================================================================
-- FIX 1 : update_forecasted_out_on_so_validation (UPDATE SO draft->validated)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_forecasted_out_on_so_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_item RECORD;
  v_qty_to_reserve INTEGER;
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    FOR v_item IN
      SELECT product_id, quantity, COALESCE(quantity_shipped, 0) as qty_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
      v_qty_to_reserve := v_item.quantity - v_item.qty_shipped;
      IF v_qty_to_reserve > 0 THEN
        -- Incrementer stock_forecasted_out sur products UNIQUEMENT.
        -- Le trigger sync_stock_alert_tracking_v4 (AFTER UPDATE products)
        -- synchronisera automatiquement stock_alert_tracking.stock_forecasted_out.
        UPDATE products
        SET stock_forecasted_out = COALESCE(stock_forecasted_out, 0) + v_qty_to_reserve
        WHERE id = v_item.product_id;

        -- FIX A3 : PLUS d'UPDATE manuel sur stock_alert_tracking ici
        -- (evitait la double incrementation observee)
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_forecasted_out_on_so_validation() IS
'AFTER UPDATE sur sales_orders : SO draft -> validated, incremente forecasted_out
sur products. Les snapshots stock_alert_tracking sont synchronises par
sync_stock_alert_tracking_v4. Fix A3 2026-04-19 (BO-STOCK-006) : suppression
du double UPDATE sur stock_alert_tracking qui cumulait les valeurs.';

-- ============================================================================
-- FIX 2 : trigger_so_insert_validated_forecast (INSERT SO direct-validated)
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

                -- FIX A3 : PLUS d'UPDATE manuel sur stock_alert_tracking
                -- (sync_stock_alert_tracking_v4 fait le job via AFTER UPDATE products)
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.trigger_so_insert_validated_forecast() IS
'AFTER INSERT sur sales_orders : SO creee directement en validated (import Bubble/
backfill), incremente forecasted_out sur products. Snapshots stock_alert_tracking
synchronises par sync_stock_alert_tracking_v4. Fix A3 2026-04-19 (BO-STOCK-006).';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    -- Verifier que les 2 fonctions sont toujours SECURITY DEFINER
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'update_forecasted_out_on_so_validation'
          AND prosecdef = true
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-006 A3] update_forecasted_out_on_so_validation must be SECURITY DEFINER';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'trigger_so_insert_validated_forecast'
          AND prosecdef = true
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-006 A3] trigger_so_insert_validated_forecast must be SECURITY DEFINER';
    END IF;

    RAISE NOTICE '[BO-STOCK-006 A3] OK : double UPDATE stock_alert_tracking supprime dans 2 fonctions';
END $$;

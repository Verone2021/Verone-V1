-- Migration: Fix A6 — validate_stock_alerts_on_po filtre alert_type
-- Date: 2026-04-19
-- Task: BO-STOCK-006 (A6)
--
-- CONTEXTE (bug originel depuis 27 nov 2025)
-- ==========================================
-- La fonction `validate_stock_alerts_on_po` force `validated=true` sur TOUTES
-- les alertes d'un produit lors de la validation PO, sans distinguer le type
-- `low_stock` vs `out_of_stock`.
--
-- Or par design :
-- - `out_of_stock.validated=true` si PO couvre (fi>0 et fo>0, previsionnel>=0)
-- - `low_stock.validated=true` UNIQUEMENT si previsionnel >= min_stock
--
-- Exemple du bug observe (SAC-0001 le 17 avril 2026) :
-- SO qty=10 validee, PO qty=10 validee -> previsionnel=0, min_stock=5
-- - `out_of_stock.validated=true` (correct, previsionnel>=0)
-- - `low_stock.validated=true` (INCORRECT, previsionnel=0 < min_stock=5)
--
-- FIX : ajouter filtre `AND alert_type = 'out_of_stock'` dans le WHERE.
-- Pour `low_stock`, laisser `sync_stock_alert_tracking_v4` recalculer
-- correctement `validated = (previsionnel >= min_stock)`.
--
-- Reference doc : docs/scratchpad/audit-regressions-stock-alertes-2026-04-17.md

CREATE OR REPLACE FUNCTION public.validate_stock_alerts_on_po()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_item RECORD;
  v_updated_count INTEGER := 0;
BEGIN
    IF NEW.status = 'validated' AND OLD.status = 'draft' THEN
        FOR v_item IN SELECT product_id FROM purchase_order_items WHERE purchase_order_id = NEW.id
        LOOP
            UPDATE stock_alert_tracking
            SET validated = true,
                validated_at = NOW(),
                validated_by = NEW.validated_by,
                quantity_in_draft = 0,
                draft_order_id = NULL,
                draft_order_number = NULL,
                added_to_draft_at = NULL,
                updated_at = NOW()
            WHERE product_id = v_item.product_id
              AND draft_order_id = NEW.id
              AND alert_type = 'out_of_stock';  -- Fix A6 : ne toucher que out_of_stock

            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        END LOOP;

        RAISE NOTICE 'PO % validee : % alertes out_of_stock mises a jour (validated=true, draft fields cleared). low_stock recalcule par sync_v4.', NEW.po_number, v_updated_count;
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.validate_stock_alerts_on_po() IS
'AFTER UPDATE sur purchase_orders : quand PO draft -> validated, passe les alertes
out_of_stock en validated=true. Les alertes low_stock sont recalculees par
sync_stock_alert_tracking_v4 (validated = previsionnel >= min_stock).
Fix A6 2026-04-19 (BO-STOCK-006) : ajout filtre alert_type pour ne pas
ecraser le calcul correct de low_stock.validated.';

-- Verification
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'validate_stock_alerts_on_po'
          AND prosecdef = true
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-006 A6] validate_stock_alerts_on_po must be SECURITY DEFINER';
    END IF;
    RAISE NOTICE '[BO-STOCK-006 A6] OK : filtre alert_type=out_of_stock ajoute';
END $$;

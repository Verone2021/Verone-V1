-- Migration: Harden stock triggers — SECURITY DEFINER + missing UPDATE triggers
-- Date: 2026-04-18
-- Task: BO-STOCK-002 Phase 1
--
-- CONTEXTE
-- ========
-- L'audit 2026-04-17 (docs/scratchpad/audit-exhaustif-stock-triggers-2026-04-17.md)
-- a identifie 4 points d'exposition au meme bug RLS silencieux que celui
-- corrige par BO-STOCK-001 :
--
-- 1. 7 fonctions trigger en SECURITY INVOKER qui UPDATE des tables dont
--    les policies RLS peuvent ne pas couvrir le caller staff
-- 2. 2 triggers BEFORE UPDATE absents de la DB (disparus sans trace)
-- 3. 1 doublon de trigger sur purchase_order_items (recalcul 2x)
--
-- Ce fix :
-- - Partie A : ajoute SECURITY DEFINER aux 7 fonctions trigger
-- - Partie B : restaure trigger_before_update_shipment + _reception
-- - Partie C : supprime le doublon trig_recalc_po_totals
-- - Partie D : bloc DO $$ de verification

-- ============================================================================
-- PARTIE A : SECURITY DEFINER sur 7 fonctions trigger
-- ============================================================================
-- Logique metier INCHANGEE, seul le mode d'execution change.

-- A1 : update_stock_alert_on_movement (no-op actuel mais preparation future)
CREATE OR REPLACE FUNCTION public.update_stock_alert_on_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Sur INSERT/UPDATE/DELETE: la vue stock_alerts_view se recalcule automatiquement
  -- car elle utilise get_smart_stock_status() qui check movements.
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- A2 : validate_stock_alerts_on_po (PO draft->validated : valide alertes)
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
              AND draft_order_id = NEW.id;

            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        END LOOP;

        RAISE NOTICE 'PO % validee : % alertes mises a jour (validated=true, draft fields cleared)', NEW.po_number, v_updated_count;
    END IF;

    RETURN NEW;
END;
$function$;

-- A3 : reverse_stock_on_movement_delete (BEFORE DELETE stock_movements)
CREATE OR REPLACE FUNCTION public.reverse_stock_on_movement_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF OLD.affects_forecast = true THEN
        RAISE NOTICE 'stock_movement DELETE % (affects_forecast=true): stock_real not modified for product %',
            OLD.id, OLD.product_id;
        RETURN OLD;
    END IF;

    UPDATE products
    SET stock_real = COALESCE(stock_real, 0) - OLD.quantity_change,
        updated_at = NOW()
    WHERE id = OLD.product_id;

    RETURN OLD;
END;
$function$;

-- A4 : handle_reception_deletion (BEFORE DELETE purchase_order_receptions)
-- Meme strategie que handle_shipment_deletion (BO-STOCK-001) :
-- deleguer la restauration stock au trigger trg_reverse_stock_on_movement_delete
-- via le DELETE du stock_movement associe (evite double-restauration).
CREATE OR REPLACE FUNCTION public.handle_reception_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- DELETE le stock_movement associe : le trigger reverse restaurera stock_real
    DELETE FROM stock_movements
    WHERE reference_type = 'reception'
      AND reference_id = OLD.id
      AND product_id = OLD.product_id;

    -- Rollback quantity_received sur purchase_order_items
    UPDATE purchase_order_items
    SET quantity_received = GREATEST(0, COALESCE(quantity_received, 0) - OLD.quantity_received)
    WHERE id = OLD.purchase_order_item_id;

    RETURN OLD;
END;
$function$;

-- A5 : reset_stock_alerts_on_po_cancel (PO -> cancelled : reset alertes)
CREATE OR REPLACE FUNCTION public.reset_stock_alerts_on_po_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_item RECORD;
    v_reset_count INTEGER := 0;
BEGIN
    FOR v_item IN
        SELECT product_id FROM purchase_order_items WHERE purchase_order_id = NEW.id
    LOOP
        UPDATE stock_alert_tracking
        SET validated = false,
            validated_at = NULL,
            validated_by = NULL
        WHERE product_id = v_item.product_id AND validated = true;

        GET DIAGNOSTICS v_reset_count = ROW_COUNT;
        IF v_reset_count > 0 THEN
            RAISE NOTICE 'Alerte reinitialisee pour produit %', v_item.product_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'PO % annulee: Alertes reinitialisees', NEW.po_number;
    RETURN NEW;
END;
$function$;

-- A6 : revalidate_alerts_on_reception (apres reception : recalc stock alert)
CREATE OR REPLACE FUNCTION public.revalidate_alerts_on_reception()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_product_id UUID;
  v_stock_forecasted INTEGER;
  v_min_stock INTEGER;
BEGIN
  SELECT product_id INTO v_product_id
  FROM purchase_order_items
  WHERE id = NEW.purchase_order_item_id;

  v_stock_forecasted := calculate_stock_forecasted(v_product_id);

  SELECT min_stock INTO v_min_stock FROM products WHERE id = v_product_id;

  IF v_stock_forecasted < v_min_stock THEN
    RAISE NOTICE 'Reception partielle - Stock toujours insuffisant pour produit %', v_product_id;
  ELSE
    RAISE NOTICE 'Reception - Stock maintenant suffisant pour produit %', v_product_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- A7 : update_sales_order_affiliate_totals (+ fix search_path NULL)
CREATE OR REPLACE FUNCTION public.update_sales_order_affiliate_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_order_id UUID;
  v_is_linkme BOOLEAN;
  v_total_ht NUMERIC(15, 2);
  v_total_ttc NUMERIC(15, 2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  SELECT channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  INTO v_is_linkme
  FROM sales_orders
  WHERE id = v_order_id;

  IF v_is_linkme THEN
    SELECT COALESCE(SUM(retrocession_amount), 0)
    INTO v_total_ht
    FROM sales_order_items
    WHERE sales_order_id = v_order_id;

    SELECT COALESCE(SUM(retrocession_amount * (1 + COALESCE(tax_rate, 0.20))), 0)
    INTO v_total_ttc
    FROM sales_order_items
    WHERE sales_order_id = v_order_id;

    UPDATE sales_orders
    SET affiliate_total_ht = v_total_ht,
        affiliate_total_ttc = v_total_ttc,
        updated_at = NOW()
    WHERE id = v_order_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- ============================================================================
-- PARTIE B : Restaurer triggers BEFORE UPDATE manquants (shipments + receptions)
-- ============================================================================
-- Source : migrations 20251124_003 et 20251124_004 (fonctions disparues de la DB)

-- B1 : handle_shipment_quantity_update()
CREATE OR REPLACE FUNCTION public.handle_shipment_quantity_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_quantity_delta INTEGER;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    IF OLD.quantity_shipped = NEW.quantity_shipped THEN
        RETURN NEW;
    END IF;

    -- Delta negatif si augmentation (sortie supplementaire), positif si diminution
    v_quantity_delta := -(NEW.quantity_shipped - OLD.quantity_shipped);

    SELECT stock_real INTO v_current_stock FROM products WHERE id = NEW.product_id;
    v_new_stock := v_current_stock + v_quantity_delta;

    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Stock ne peut pas devenir negatif: current=%, delta=%, new=%',
            v_current_stock, v_quantity_delta, v_new_stock;
    END IF;

    UPDATE products
    SET stock_real = v_new_stock, updated_at = NOW()
    WHERE id = NEW.product_id;

    -- Propager au stock_movement associe
    UPDATE stock_movements
    SET quantity_change = quantity_change + v_quantity_delta,
        quantity_after = quantity_after + v_quantity_delta,
        notes = COALESCE(notes, '') || ' [Quantite modifiee: ' || OLD.quantity_shipped || ' -> ' || NEW.quantity_shipped || ']',
        updated_at = NOW()
    WHERE reference_type = 'shipment'
      AND reference_id = NEW.id
      AND product_id = NEW.product_id;

    -- Propager a sales_order_items.quantity_shipped
    UPDATE sales_order_items
    SET quantity_shipped = COALESCE(quantity_shipped, 0) + (NEW.quantity_shipped - OLD.quantity_shipped)
    WHERE sales_order_id = NEW.sales_order_id AND product_id = NEW.product_id;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_before_update_shipment ON sales_order_shipments;
CREATE TRIGGER trigger_before_update_shipment
    BEFORE UPDATE ON sales_order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION handle_shipment_quantity_update();

COMMENT ON FUNCTION public.handle_shipment_quantity_update() IS
'BEFORE UPDATE sur sales_order_shipments : ajuste stock_real + stock_movement + sales_order_items quand quantity_shipped change.
SECURITY DEFINER. Restaure l''ancien trigger disparu (migration 20251124_004).';

-- B2 : handle_reception_quantity_update()
CREATE OR REPLACE FUNCTION public.handle_reception_quantity_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_quantity_delta INTEGER;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    IF OLD.quantity_received = NEW.quantity_received THEN
        RETURN NEW;
    END IF;

    v_quantity_delta := NEW.quantity_received - OLD.quantity_received;

    SELECT stock_real INTO v_current_stock FROM products WHERE id = NEW.product_id;
    v_new_stock := v_current_stock + v_quantity_delta;

    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Stock ne peut pas devenir negatif: current=%, delta=%, new=%',
            v_current_stock, v_quantity_delta, v_new_stock;
    END IF;

    UPDATE products
    SET stock_real = v_new_stock, updated_at = NOW()
    WHERE id = NEW.product_id;

    -- Propager au stock_movement associe
    UPDATE stock_movements
    SET quantity_change = quantity_change + v_quantity_delta,
        quantity_after = quantity_after + v_quantity_delta,
        notes = COALESCE(notes, '') || ' [Quantite modifiee: ' || OLD.quantity_received || ' -> ' || NEW.quantity_received || ']',
        updated_at = NOW()
    WHERE reference_type = 'reception'
      AND reference_id = NEW.id
      AND product_id = NEW.product_id;

    -- Propager a purchase_order_items.quantity_received
    UPDATE purchase_order_items
    SET quantity_received = COALESCE(quantity_received, 0) + v_quantity_delta
    WHERE id = NEW.purchase_order_item_id;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_before_update_reception ON purchase_order_receptions;
CREATE TRIGGER trigger_before_update_reception
    BEFORE UPDATE ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_reception_quantity_update();

COMMENT ON FUNCTION public.handle_reception_quantity_update() IS
'BEFORE UPDATE sur purchase_order_receptions : ajuste stock_real + stock_movement + purchase_order_items quand quantity_received change.
SECURITY DEFINER. Restaure l''ancien trigger disparu (migration 20251124_003).';

-- ============================================================================
-- PARTIE C : Supprimer doublon trig_recalc_po_totals
-- ============================================================================
-- Il y a 2 triggers qui appellent la meme fonction recalculate_purchase_order_totals()
-- sur AFTER INSERT/UPDATE/DELETE de purchase_order_items :
--   - recalculate_purchase_order_totals_trigger (conserve)
--   - trig_recalc_po_totals (supprime)
-- Resultat actuel : recalcul effectue 2x a chaque modification d'item.

DROP TRIGGER IF EXISTS trig_recalc_po_totals ON purchase_order_items;

-- ============================================================================
-- PARTIE D : VERIFICATION
-- ============================================================================
DO $$
DECLARE
    v_not_secdef TEXT;
    v_missing_trigger TEXT;
BEGIN
    -- Check 1 : les 7 fonctions Partie A + les 2 Partie B sont SECURITY DEFINER
    SELECT string_agg(proname, ', ') INTO v_not_secdef
    FROM pg_proc
    WHERE proname IN (
        'update_stock_alert_on_movement',
        'validate_stock_alerts_on_po',
        'reverse_stock_on_movement_delete',
        'handle_reception_deletion',
        'reset_stock_alerts_on_po_cancel',
        'revalidate_alerts_on_reception',
        'update_sales_order_affiliate_totals',
        'handle_shipment_quantity_update',
        'handle_reception_quantity_update'
    )
    AND prosecdef = false;

    IF v_not_secdef IS NOT NULL THEN
        RAISE EXCEPTION '[BO-STOCK-002] Fonctions non SECURITY DEFINER : %', v_not_secdef;
    END IF;

    -- Check 2 : les 2 triggers BEFORE UPDATE existent
    SELECT string_agg(missing, ', ') INTO v_missing_trigger
    FROM (
        SELECT 'trigger_before_update_shipment' AS missing
        WHERE NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_before_update_shipment')
        UNION ALL
        SELECT 'trigger_before_update_reception'
        WHERE NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_before_update_reception')
    ) t;

    IF v_missing_trigger IS NOT NULL THEN
        RAISE EXCEPTION '[BO-STOCK-002] Triggers manquants : %', v_missing_trigger;
    END IF;

    -- Check 3 : doublon trig_recalc_po_totals supprime
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_recalc_po_totals') THEN
        RAISE EXCEPTION '[BO-STOCK-002] trig_recalc_po_totals toujours present (doublon non supprime)';
    END IF;

    -- Check 4 : recalculate_purchase_order_totals_trigger toujours la (garde le bon)
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'recalculate_purchase_order_totals_trigger') THEN
        RAISE EXCEPTION '[BO-STOCK-002] recalculate_purchase_order_totals_trigger manquant !';
    END IF;

    RAISE NOTICE '[BO-STOCK-002 Phase 1] OK : 9 fonctions SECURITY DEFINER, 2 triggers BEFORE UPDATE restaures, 1 doublon supprime';
END $$;

--
-- Migration: Corriger DERNIÈRE fonction trg_purchase_orders_stock_automation utilisant 'confirmed' → 'validated'
-- Date: 2025-11-21
-- Raison: FINALISATION ABSOLUE migration enums purchase_order_status
--

-- ============================================================================
-- FUNCTION: trg_purchase_orders_stock_automation (TRIGGER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trg_purchase_orders_stock_automation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- ✅ FIX: Commande validée → Créer mouvements prévisionnels IN
    IF OLD.status != 'validated' AND NEW.status = 'validated' THEN
        PERFORM create_purchase_order_forecast_movements(NEW.id, NEW.validated_by);
    END IF;

    -- Commande annulée → Supprimer mouvements prévisionnels
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        PERFORM cancel_order_forecast_movements(NEW.id, 'purchase_order_forecast', NEW.validated_by);
    END IF;

    RETURN NEW;
END;
$function$;

-- ============================================================================
-- Commentaire
-- ============================================================================

COMMENT ON FUNCTION public.trg_purchase_orders_stock_automation IS
'Trigger: Automatisation stock lors changement status commande fournisseur (validée → créer forecast IN, annulée → supprimer forecast)';

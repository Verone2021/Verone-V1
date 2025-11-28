-- ============================================================================
-- Migration: Fix trigger rollback_so_forecasted pour annulation SO
-- Date: 2025-11-28
-- Description: Corrige le bug qui cause des stock_forecasted_out négatifs
--              lors de l'annulation d'une SO depuis le statut draft
-- ============================================================================

-- CONTEXTE DU BUG:
-- Quand une SO suit le cycle: draft → validated → draft → cancelled
-- Le trigger rollback_so_forecasted faisait un rollback MÊME quand OLD.status = 'draft'
-- Résultat: double soustraction → stock_forecasted_out devient négatif

-- SOLUTION:
-- Ne faire le rollback QUE si OLD.status IN ('validated', 'partially_shipped')

-- ============================================================================
-- STEP 1: Corriger la fonction rollback_so_forecasted
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rollback_so_forecasted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_item RECORD;
BEGIN
    -- ✅ FIX: Ne faire le rollback QUE si on annule depuis validated/partially_shipped
    -- Si on annule depuis draft, il n'y a pas de forecasted_out réservé donc pas de rollback
    IF NEW.status = 'cancelled' AND OLD.status IN ('validated', 'partially_shipped') THEN
        FOR v_item IN
            SELECT product_id, quantity, quantity_shipped
            FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Rollback seulement la quantité non encore expédiée
            -- GREATEST(0, ...) pour éviter les valeurs négatives
            UPDATE products
            SET stock_forecasted_out = GREATEST(0, stock_forecasted_out - (v_item.quantity - COALESCE(v_item.quantity_shipped, 0)))
            WHERE id = v_item.product_id;
        END LOOP;
        RAISE NOTICE 'SO % annulée depuis % : forecasted_out rollback effectué', NEW.order_number, OLD.status;
    ELSIF NEW.status = 'cancelled' AND OLD.status = 'draft' THEN
        -- Pas de rollback nécessaire pour une SO en draft (pas de forecasted_out réservé)
        RAISE NOTICE 'SO % annulée depuis draft : pas de rollback nécessaire (aucun forecasted réservé)', NEW.order_number;
    END IF;

    RETURN NEW;
END;
$function$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger rollback_so_forecasted corrigé:';
    RAISE NOTICE '   - Annulation depuis validated/partially_shipped → rollback forecasted_out';
    RAISE NOTICE '   - Annulation depuis draft → pas de rollback (correct)';
END $$;

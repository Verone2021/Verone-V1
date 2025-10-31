-- Migration: Supprimer trigger duplicate purchase_order_forecast_trigger
-- Date: 2025-10-31
-- Objectif: Éliminer redondance trigger #8 (legacy) qui fait doublon avec handle_purchase_order_forecast()
-- Impact: AUCUN - Ce trigger ne fait rien car purchase_order_receptions n'est jamais utilisée
-- Approche: Suppression ciblée, 90% des triggers restent intacts

-- Vérifier existence trigger avant suppression
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'purchase_order_forecast_trigger'
    ) THEN
        -- Supprimer le trigger legacy
        DROP TRIGGER IF EXISTS purchase_order_forecast_trigger ON purchase_orders;

        RAISE NOTICE '✅ Trigger duplicate "purchase_order_forecast_trigger" supprimé';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger "purchase_order_forecast_trigger" déjà supprimé';
    END IF;
END $$;

-- NOTE: Le trigger principal handle_purchase_order_forecast() reste ACTIF
-- Il gère correctement les 3 workflows:
-- 1. Confirmation commande → stock_forecasted_in
-- 2. Réception commande → stock_real (algorithm differential)
-- 3. Annulation commande → suppression mouvements prévisionnels

-- VALIDATION: Vérifier que les 9 triggers restants sont bien actifs
DO $$
DECLARE
    v_trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname IN ('purchase_orders', 'sales_orders', 'stock_movements', 'products')
      AND t.tgname LIKE '%stock%' OR t.tgname LIKE '%order%';

    RAISE NOTICE '✅ Triggers stock/orders actifs restants: %', v_trigger_count;

    IF v_trigger_count < 9 THEN
        RAISE WARNING '⚠️ Moins de 9 triggers actifs détectés. Vérifier intégrité.';
    END IF;
END $$;

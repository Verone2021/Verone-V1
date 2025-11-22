-- =============================================
-- Migration: Fix Validated GREEN Status - V4
-- Date: 2025-11-22
-- Description: CORRECTION CRITIQUE - Calcul dynamique validated
--              basé sur stock prévisionnel >= min_stock
--
-- BUG CORRIGÉ V3: validated toujours hardcodé à false
--   → Alertes restaient ROUGES malgré previsionnel suffisant
--
-- SOLUTION V4: Calcul booléen v_is_validated
--   → VERT si previsionnel >= min_stock
--   → ROUGE si previsionnel < min_stock
-- =============================================

-- ÉTAPE 1: Suppression V3
DROP TRIGGER IF EXISTS trigger_sync_stock_alert_tracking_v3 ON public.products CASCADE;
DROP FUNCTION IF EXISTS public.sync_stock_alert_tracking_v3() CASCADE;

-- ÉTAPE 2: Création fonction V4 avec calcul validated
CREATE OR REPLACE FUNCTION public.sync_stock_alert_tracking_v4()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_previsionnel INTEGER;
    v_is_validated BOOLEAN;  -- ✅ NOUVEAU : Calcul GREEN status
BEGIN
    v_previsionnel := NEW.stock_real + NEW.stock_forecasted_in - NEW.stock_forecasted_out;

    -- ========================================
    -- ALERTE 1: low_stock (basé sur stock RÉEL uniquement)
    -- Condition: stock_real < min_stock
    -- Validated: previsionnel >= min_stock (GREEN)
    -- ========================================
    IF NEW.stock_real < NEW.min_stock THEN
        -- ✅ Calcul dynamique du statut GREEN
        v_is_validated := v_previsionnel >= NEW.min_stock;

        INSERT INTO stock_alert_tracking (
            product_id, supplier_id, alert_type, alert_priority,
            stock_real, stock_forecasted_in, stock_forecasted_out,
            min_stock, validated
        ) VALUES (
            NEW.id, NEW.supplier_id, 'low_stock', 2,
            NEW.stock_real, NEW.stock_forecasted_in, NEW.stock_forecasted_out,
            NEW.min_stock, v_is_validated  -- ✅ Utilise calcul dynamique
        )
        ON CONFLICT (product_id, alert_type) DO UPDATE SET
            stock_real = EXCLUDED.stock_real,
            stock_forecasted_in = EXCLUDED.stock_forecasted_in,
            stock_forecasted_out = EXCLUDED.stock_forecasted_out,
            min_stock = EXCLUDED.min_stock,
            validated = EXCLUDED.validated;  -- ✅ Met à jour GREEN status
    ELSE
        -- Supprimer alerte low_stock si stock_real >= min_stock
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'low_stock';
    END IF;

    -- ========================================
    -- ALERTE 2: out_of_stock (basé sur stock PRÉVISIONNEL)
    -- Condition: stock_previsionnel < 0
    -- Validated: false (toujours ROUGE car rupture)
    -- ========================================
    IF v_previsionnel < 0 THEN
        INSERT INTO stock_alert_tracking (
            product_id, supplier_id, alert_type, alert_priority,
            stock_real, stock_forecasted_in, stock_forecasted_out,
            shortage_quantity, validated
        ) VALUES (
            NEW.id, NEW.supplier_id, 'out_of_stock', 3,
            NEW.stock_real, NEW.stock_forecasted_in, NEW.stock_forecasted_out,
            ABS(v_previsionnel), false  -- ✅ Rupture = toujours ROUGE
        )
        ON CONFLICT (product_id, alert_type) DO UPDATE SET
            stock_real = EXCLUDED.stock_real,
            stock_forecasted_in = EXCLUDED.stock_forecasted_in,
            stock_forecasted_out = EXCLUDED.stock_forecasted_out,
            shortage_quantity = EXCLUDED.shortage_quantity,
            validated = EXCLUDED.validated;
    ELSE
        -- Supprimer alerte out_of_stock si stock_previsionnel >= 0
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'out_of_stock';
    END IF;

    RETURN NEW;
END;
$function$;

-- ÉTAPE 3: Création trigger V4
CREATE TRIGGER trigger_sync_stock_alert_tracking_v4
    AFTER INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_stock_alert_tracking_v4();

-- ÉTAPE 4: Forcer recalcul pour produits avec alertes
UPDATE products
SET stock_real = stock_real
WHERE sku IN ('FMIL-ORANG-13', 'FMIL-VERT-01');

-- ÉTAPE 5: Vérification finale GREEN status
DO $$
DECLARE
  v_alert_count INTEGER;
  v_green_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_alert_count FROM stock_alert_tracking;
  SELECT COUNT(*) INTO v_green_count FROM stock_alert_tracking WHERE validated = true;

  RAISE NOTICE '✅ Nombre alertes créées: %', v_alert_count;
  RAISE NOTICE '✅ Nombre alertes VERTES: %', v_green_count;

  IF v_alert_count = 2 AND v_green_count = 2 THEN
    RAISE NOTICE '✅ SUCCÈS: 2 alertes créées, 2 VERTES';
  ELSE
    RAISE WARNING '⚠️ ATTENTION: % alerte(s) créée(s), % VERTE(s), attendu 2/2', v_alert_count, v_green_count;
  END IF;
END $$;

-- Migration: A8 — Add 'low_stock_forecast' alert type
-- Date: 2026-04-20
-- Task: BO-STOCK-007 (A8)
--
-- CONTEXTE
-- ========
-- La doc business `docs/current/modules/stock-module-reference.md` documente
-- le type d'alerte `forecast_shortage` (previsionnel < min_stock) mais aucune
-- version du code ne l'a jamais implemente. Option B (validee par Romeo) :
-- ajouter un nouveau alert_type `low_stock_forecast` pour distinguer du
-- `low_stock` classique (base sur stock_real < min_stock).
--
-- DIFFERENCE DES 2 TYPES :
-- - low_stock           : stock_real < min_stock (stock physique bas)
-- - low_stock_forecast  : stock_real >= min_stock MAIS previsionnel < min_stock
--                         (stock OK maintenant, mais tombera sous le seuil
--                          apres les expeditions SO validees en attente)
-- - out_of_stock        : previsionnel < 0 (ne peut plus honorer SO)
--
-- IMPLEMENTATION :
-- 1. Etendre CHECK constraint sur alert_type
-- 2. Modifier sync_stock_alert_tracking_v4 pour creer/supprimer low_stock_forecast
-- 3. Mettre a jour stock_alerts_unified_view pour remonter low_stock_forecast

-- ============================================================================
-- STEP 1 : Etendre la CHECK constraint alert_type
-- ============================================================================
ALTER TABLE stock_alert_tracking
  DROP CONSTRAINT IF EXISTS stock_alert_tracking_alert_type_check;

ALTER TABLE stock_alert_tracking
  ADD CONSTRAINT stock_alert_tracking_alert_type_check
  CHECK (alert_type = ANY (ARRAY[
    'low_stock'::text,
    'low_stock_forecast'::text,
    'out_of_stock'::text,
    'no_stock_but_ordered'::text
  ]));

-- ============================================================================
-- STEP 2 : Modifier sync_stock_alert_tracking_v4 pour gerer low_stock_forecast
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_stock_alert_tracking_v4()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_previsionnel INTEGER;
    v_has_po_in_transit BOOLEAN;
    v_has_so_pending BOOLEAN;
    v_is_validated BOOLEAN;
    v_shortage INTEGER;
BEGIN
    v_previsionnel := COALESCE(NEW.stock_real, 0)
                    + COALESCE(NEW.stock_forecasted_in, 0)
                    - COALESCE(NEW.stock_forecasted_out, 0);

    v_has_po_in_transit := (COALESCE(NEW.stock_forecasted_in, 0) > 0);
    v_has_so_pending := (COALESCE(NEW.stock_forecasted_out, 0) > 0);

    -- ========================================================================
    -- OUT_OF_STOCK : previsionnel negatif
    -- ========================================================================
    IF v_previsionnel < 0 THEN
        INSERT INTO stock_alert_tracking (
            product_id, supplier_id, alert_type, alert_priority,
            stock_real, stock_forecasted_in, stock_forecasted_out,
            shortage_quantity, validated, min_stock
        ) VALUES (
            NEW.id, NEW.supplier_id, 'out_of_stock', 3,
            NEW.stock_real, NEW.stock_forecasted_in, NEW.stock_forecasted_out,
            ABS(v_previsionnel), false, COALESCE(NEW.min_stock, 0)
        )
        ON CONFLICT (product_id, alert_type) DO UPDATE SET
            stock_real = EXCLUDED.stock_real,
            stock_forecasted_in = EXCLUDED.stock_forecasted_in,
            stock_forecasted_out = EXCLUDED.stock_forecasted_out,
            shortage_quantity = EXCLUDED.shortage_quantity,
            validated = false,
            updated_at = NOW();

    ELSIF v_has_po_in_transit AND v_has_so_pending THEN
        -- VERT : PO en transit couvre SO en attente
        IF EXISTS (SELECT 1 FROM stock_alert_tracking WHERE product_id = NEW.id AND alert_type = 'out_of_stock') THEN
            UPDATE stock_alert_tracking SET
                validated = true,
                stock_real = NEW.stock_real,
                stock_forecasted_in = NEW.stock_forecasted_in,
                stock_forecasted_out = NEW.stock_forecasted_out,
                shortage_quantity = 0,
                updated_at = NOW()
            WHERE product_id = NEW.id AND alert_type = 'out_of_stock';
        ELSE
            INSERT INTO stock_alert_tracking (
                product_id, supplier_id, alert_type, alert_priority,
                stock_real, stock_forecasted_in, stock_forecasted_out,
                shortage_quantity, validated, min_stock
            ) VALUES (
                NEW.id, NEW.supplier_id, 'out_of_stock', 3,
                NEW.stock_real, NEW.stock_forecasted_in, NEW.stock_forecasted_out,
                0, true, COALESCE(NEW.min_stock, 0)
            )
            ON CONFLICT (product_id, alert_type) DO UPDATE SET
                validated = true,
                stock_real = EXCLUDED.stock_real,
                stock_forecasted_in = EXCLUDED.stock_forecasted_in,
                stock_forecasted_out = EXCLUDED.stock_forecasted_out,
                shortage_quantity = 0,
                updated_at = NOW();
        END IF;
    ELSE
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'out_of_stock';
    END IF;

    -- ========================================================================
    -- LOW_STOCK : stock_real < min_stock (stock physique sous le seuil)
    -- ========================================================================
    IF COALESCE(NEW.min_stock, 0) > 0 AND NEW.stock_real < NEW.min_stock THEN
        v_is_validated := v_previsionnel >= NEW.min_stock;

        INSERT INTO stock_alert_tracking (
            product_id, supplier_id, alert_type, alert_priority,
            stock_real, stock_forecasted_in, stock_forecasted_out,
            min_stock, shortage_quantity, validated
        ) VALUES (
            NEW.id, NEW.supplier_id, 'low_stock', 2,
            NEW.stock_real, NEW.stock_forecasted_in, NEW.stock_forecasted_out,
            NEW.min_stock, GREATEST(0, NEW.min_stock - v_previsionnel), v_is_validated
        )
        ON CONFLICT (product_id, alert_type) DO UPDATE SET
            stock_real = EXCLUDED.stock_real,
            stock_forecasted_in = EXCLUDED.stock_forecasted_in,
            stock_forecasted_out = EXCLUDED.stock_forecasted_out,
            min_stock = EXCLUDED.min_stock,
            shortage_quantity = EXCLUDED.shortage_quantity,
            validated = EXCLUDED.validated,
            updated_at = NOW();
    ELSE
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'low_stock';
    END IF;

    -- ========================================================================
    -- LOW_STOCK_FORECAST (A8) : stock_real OK mais previsionnel < min_stock
    -- Le stock va tomber sous le seuil apres les expeditions SO en attente.
    -- ========================================================================
    IF COALESCE(NEW.min_stock, 0) > 0
       AND NEW.stock_real >= NEW.min_stock
       AND v_previsionnel >= 0
       AND v_previsionnel < NEW.min_stock THEN

        v_shortage := NEW.min_stock - v_previsionnel;
        -- validated = true si PO en transit couvre le manque
        v_is_validated := COALESCE(NEW.stock_forecasted_in, 0) >= v_shortage;

        INSERT INTO stock_alert_tracking (
            product_id, supplier_id, alert_type, alert_priority,
            stock_real, stock_forecasted_in, stock_forecasted_out,
            min_stock, shortage_quantity, validated
        ) VALUES (
            NEW.id, NEW.supplier_id, 'low_stock_forecast', 2,
            NEW.stock_real, NEW.stock_forecasted_in, NEW.stock_forecasted_out,
            NEW.min_stock, v_shortage, v_is_validated
        )
        ON CONFLICT (product_id, alert_type) DO UPDATE SET
            stock_real = EXCLUDED.stock_real,
            stock_forecasted_in = EXCLUDED.stock_forecasted_in,
            stock_forecasted_out = EXCLUDED.stock_forecasted_out,
            min_stock = EXCLUDED.min_stock,
            shortage_quantity = EXCLUDED.shortage_quantity,
            validated = EXCLUDED.validated,
            updated_at = NOW();
    ELSE
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'low_stock_forecast';
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.sync_stock_alert_tracking_v4() IS
'AFTER INSERT/UPDATE sur products : synchronise stock_alert_tracking (out_of_stock,
low_stock, low_stock_forecast). A8 2026-04-20 (BO-STOCK-007) : ajout du type
low_stock_forecast pour alerter quand le previsionnel va descendre sous min_stock
apres les SO validees en attente, meme si stock_real est encore OK.';

-- ============================================================================
-- STEP 3 : Mettre a jour la vue stock_alerts_unified_view
-- Inclure low_stock_forecast dans le CASE alert_type + filtre WHERE
-- ============================================================================
CREATE OR REPLACE VIEW public.stock_alerts_unified_view AS
WITH product_alerts AS (
    SELECT p.id AS product_id,
        p.name AS product_name,
        p.sku,
        COALESCE(p.stock_real, 0) AS stock_real,
        COALESCE(p.stock_forecasted_in, 0) AS stock_forecasted_in,
        COALESCE(p.stock_forecasted_out, 0) AS stock_forecasted_out,
        COALESCE(p.min_stock, 0) AS min_stock,
        COALESCE(p.stock_real, 0) + COALESCE(p.stock_forecasted_in, 0)
            - COALESCE(p.stock_forecasted_out, 0) AS stock_previsionnel,
        sat.id AS tracking_id,
        sat.alert_type AS tracking_alert_type,
        sat.draft_order_id,
        sat.draft_order_number,
        COALESCE(sat.quantity_in_draft, 0) AS quantity_in_draft,
        sat.validated,
        sat.validated_at,
        sat.supplier_id,
        COALESCE(p.stock_real, 0) + COALESCE(p.stock_forecasted_in, 0)
            - COALESCE(p.stock_forecasted_out, 0)
            + COALESCE(sat.quantity_in_draft, 0) AS stock_previsionnel_avec_draft,
        (SELECT pi.public_url
           FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_primary = true
         LIMIT 1) AS product_image_url
    FROM products p
    LEFT JOIN stock_alert_tracking sat ON sat.product_id = p.id
    WHERE p.archived_at IS NULL
)
SELECT COALESCE(tracking_id, product_id) AS id,
    product_id, product_name, sku, stock_real,
    stock_forecasted_in, stock_forecasted_out, min_stock,
    stock_previsionnel, stock_previsionnel_avec_draft,
    draft_order_id, draft_order_number, quantity_in_draft,
    validated, validated_at, supplier_id, product_image_url,
    CASE
        -- Preserve les types stocke en table (low_stock, low_stock_forecast, out_of_stock)
        WHEN tracking_alert_type = 'low_stock_forecast' THEN 'low_stock_forecast'::text
        WHEN tracking_alert_type = 'low_stock' THEN 'low_stock'::text
        WHEN stock_previsionnel < 0 THEN 'out_of_stock'::text
        WHEN validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0 THEN 'out_of_stock'::text
        WHEN min_stock > 0 AND stock_previsionnel < min_stock THEN 'low_stock'::text
        ELSE 'none'::text
    END AS alert_type,
    CASE
        WHEN stock_previsionnel < 0 THEN 3
        WHEN tracking_alert_type = 'low_stock_forecast' THEN 2
        WHEN validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0 THEN 1
        WHEN stock_real <= 0 AND min_stock > 0 THEN 3
        WHEN min_stock > 0 AND stock_previsionnel < min_stock THEN 2
        ELSE 0
    END AS alert_priority,
    CASE
        WHEN stock_previsionnel < 0 THEN ABS(stock_previsionnel)
        WHEN validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0 THEN 0
        WHEN min_stock > 0 THEN GREATEST(0, min_stock - stock_previsionnel)
        ELSE 0
    END AS shortage_quantity,
    CASE
        WHEN validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0 THEN 'green'::text
        WHEN stock_previsionnel < 0 AND stock_previsionnel_avec_draft < 0 THEN 'critical_red'::text
        WHEN stock_previsionnel < 0 AND quantity_in_draft > 0 AND stock_previsionnel_avec_draft >= 0 THEN 'orange'::text
        WHEN tracking_alert_type = 'low_stock_forecast' AND validated = true THEN 'green'::text
        WHEN tracking_alert_type = 'low_stock_forecast' THEN 'orange'::text
        WHEN stock_previsionnel >= 0 AND (min_stock = 0 OR stock_previsionnel >= min_stock) THEN 'resolved'::text
        WHEN min_stock > 0 AND stock_previsionnel < min_stock AND quantity_in_draft > 0 AND stock_previsionnel_avec_draft >= min_stock THEN 'orange'::text
        WHEN min_stock > 0 AND stock_previsionnel < min_stock THEN 'red'::text
        ELSE 'resolved'::text
    END AS alert_color,
    CASE
        WHEN validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0 THEN 'info'::text
        WHEN stock_previsionnel < 0 THEN 'critical'::text
        WHEN stock_real <= 0 AND min_stock > 0 THEN 'critical'::text
        WHEN tracking_alert_type = 'low_stock_forecast' THEN 'warning'::text
        WHEN min_stock > 0 AND stock_previsionnel < min_stock THEN 'warning'::text
        ELSE 'info'::text
    END AS severity,
    (draft_order_id IS NOT NULL AND quantity_in_draft > 0) AS is_in_draft
FROM product_alerts
WHERE stock_previsionnel < 0
   OR (min_stock > 0 AND stock_previsionnel < min_stock)
   OR tracking_alert_type = 'low_stock_forecast'
   OR (validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0)
ORDER BY
    CASE
        WHEN stock_previsionnel < 0 THEN 3
        WHEN tracking_alert_type = 'low_stock_forecast' THEN 2
        WHEN validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0 THEN 1
        WHEN stock_real <= 0 AND min_stock > 0 THEN 3
        WHEN min_stock > 0 AND stock_previsionnel < min_stock THEN 2
        ELSE 0
    END DESC,
    stock_previsionnel;

-- ============================================================================
-- STEP 4 : VERIFICATION
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'stock_alert_tracking'::regclass
          AND conname = 'stock_alert_tracking_alert_type_check'
          AND pg_get_constraintdef(oid) LIKE '%low_stock_forecast%'
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-007 A8] CHECK constraint doit inclure low_stock_forecast';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'sync_stock_alert_tracking_v4' AND prosecdef = true
    ) THEN
        RAISE EXCEPTION '[BO-STOCK-007 A8] sync_stock_alert_tracking_v4 doit etre SECURITY DEFINER';
    END IF;

    RAISE NOTICE '[BO-STOCK-007 A8] OK : alert_type low_stock_forecast ajoute + trigger + vue mises a jour';
END $$;

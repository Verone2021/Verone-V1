-- ============================================================================
-- Migration: Fix sync_stock_alert_tracking_v4 - État VERT pour PO en transit
-- Date: 2025-12-08
-- Description: Corriger la logique pour garder l'alerte en VERT quand une PO
--              validée est en transit, au lieu de la SUPPRIMER
--
--   BUG: La fonction supprimait l'alerte out_of_stock dès que prévisionnel >= 0
--        Alors qu'elle devrait rester visible en VERT si c'est grâce à une PO en transit
--
--   WORKFLOW MÉTIER:
--   - ROUGE : prévisionnel < 0, aucune PO validée ne couvre le besoin
--   - VERT  : prévisionnel >= 0 GRÂCE à PO validée (stock_forecasted_in > 0)
--   - DISPARAÎT : stock_real >= forecasted_out (après réception effective)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_stock_alert_tracking_v4()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_previsionnel INTEGER;
    v_has_po_in_transit BOOLEAN;
    v_has_so_pending BOOLEAN;
    v_is_validated BOOLEAN;
BEGIN
    -- Calcul du stock prévisionnel
    v_previsionnel := COALESCE(NEW.stock_real, 0)
                    + COALESCE(NEW.stock_forecasted_in, 0)
                    - COALESCE(NEW.stock_forecasted_out, 0);

    -- Indicateurs métier
    v_has_po_in_transit := (COALESCE(NEW.stock_forecasted_in, 0) > 0);
    v_has_so_pending := (COALESCE(NEW.stock_forecasted_out, 0) > 0);

    -- ========================================================================
    -- OUT_OF_STOCK : Gestion des alertes de stock négatif
    -- ========================================================================

    IF v_previsionnel < 0 THEN
        -- ROUGE : Alerte active, prévisionnel négatif
        v_is_validated := false;

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
            validated = false,  -- Remet en ROUGE si prévisionnel redevient négatif
            updated_at = NOW();

        RAISE NOTICE '🔴 [out_of_stock] Produit % - prévisionnel=% (ROUGE)', NEW.id, v_previsionnel;

    ELSIF v_has_po_in_transit AND v_has_so_pending THEN
        -- VERT : Prévisionnel OK grâce à PO validée en transit
        -- Il y a des SO en attente (forecasted_out > 0) mais la PO couvre le besoin

        -- Vérifier si l'alerte existe (elle a été créée quand le prévisionnel était négatif)
        IF EXISTS (SELECT 1 FROM stock_alert_tracking WHERE product_id = NEW.id AND alert_type = 'out_of_stock') THEN
            UPDATE stock_alert_tracking SET
                validated = true,
                stock_real = NEW.stock_real,
                stock_forecasted_in = NEW.stock_forecasted_in,
                stock_forecasted_out = NEW.stock_forecasted_out,
                shortage_quantity = 0,
                updated_at = NOW()
            WHERE product_id = NEW.id AND alert_type = 'out_of_stock';

            RAISE NOTICE '🟢 [out_of_stock] Produit % - prévisionnel=%, PO en transit=% (VERT)',
                NEW.id, v_previsionnel, NEW.stock_forecasted_in;
        ELSE
            -- Si l'alerte n'existe pas mais qu'on a une SO en attente avec PO en transit,
            -- créer l'alerte directement en VERT (cas où SO et PO créées en même temps)
            INSERT INTO stock_alert_tracking (
                product_id, supplier_id, alert_type, alert_priority,
                stock_real, stock_forecasted_in, stock_forecasted_out,
                shortage_quantity, validated, min_stock
            ) VALUES (
                NEW.id, NEW.supplier_id, 'out_of_stock', 3,
                NEW.stock_real, NEW.stock_forecasted_in, NEW.stock_forecasted_out,
                0, true, COALESCE(NEW.min_stock, 0)  -- validated = true car PO couvre
            )
            ON CONFLICT (product_id, alert_type) DO UPDATE SET
                validated = true,
                stock_real = EXCLUDED.stock_real,
                stock_forecasted_in = EXCLUDED.stock_forecasted_in,
                stock_forecasted_out = EXCLUDED.stock_forecasted_out,
                shortage_quantity = 0,
                updated_at = NOW();

            RAISE NOTICE '🟢 [out_of_stock] Produit % - créé en VERT (PO couvre SO)', NEW.id;
        END IF;

    ELSE
        -- DISPARAÎT : Plus de SO en attente OU stock réel suffisant
        -- Supprimer l'alerte out_of_stock uniquement si pas de PO en transit avec SO
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'out_of_stock';

        RAISE NOTICE '✅ [out_of_stock] Produit % - SUPPRIMÉE (stock OK)', NEW.id;
    END IF;

    -- ========================================================================
    -- LOW_STOCK : Gestion des alertes de stock bas (min_stock)
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

        IF v_is_validated THEN
            RAISE NOTICE '🟢 [low_stock] Produit % - stock_real=%, min_stock=%, prévisionnel=% (VERT)',
                NEW.id, NEW.stock_real, NEW.min_stock, v_previsionnel;
        ELSE
            RAISE NOTICE '🔴 [low_stock] Produit % - stock_real=%, min_stock=%, prévisionnel=% (ROUGE)',
                NEW.id, NEW.stock_real, NEW.min_stock, v_previsionnel;
        END IF;
    ELSE
        -- Supprimer l'alerte low_stock si stock >= min_stock OU min_stock = 0
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'low_stock';
    END IF;

    RETURN NEW;
END;
$function$;

-- Commentaire explicatif
COMMENT ON FUNCTION sync_stock_alert_tracking_v4() IS
'Trigger sur products (INSERT/UPDATE) pour synchroniser stock_alert_tracking.

WORKFLOW ALERTES OUT_OF_STOCK :
- ROUGE : prévisionnel < 0 (validated = false)
- VERT  : prévisionnel >= 0 ET stock_forecasted_in > 0 ET stock_forecasted_out > 0 (validated = true)
         → PO validée couvre les SO en attente, mais marchandise pas encore reçue
- DISPARAÎT : stock_real couvre les besoins OU plus de SO en attente

WORKFLOW ALERTES LOW_STOCK :
- ROUGE : stock_real < min_stock ET prévisionnel < min_stock (validated = false)
- VERT  : stock_real < min_stock ET prévisionnel >= min_stock (validated = true)
- DISPARAÎT : stock_real >= min_stock OU min_stock = 0

Migration: 20251208_004';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  -- Vérifier que la fonction existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'sync_stock_alert_tracking_v4'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251208_004 terminée';
    RAISE NOTICE '   Fonction sync_stock_alert_tracking_v4 corrigée';
    RAISE NOTICE '   État VERT maintenant géré pour PO en transit';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Échec création fonction sync_stock_alert_tracking_v4';
  END IF;
END $$;

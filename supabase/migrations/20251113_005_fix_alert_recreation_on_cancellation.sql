-- Migration: Fix alert reactivation by recreation (Bug #3)
-- Date: 2025-11-13
-- Bug: Alert draft_order_id overwritten when product added to multiple POs
-- Impact: Cancelled PO doesn't reactivate alert correctly
-- Priority: P1 - HIGH
--
-- Solution: DELETE old alert + CREATE new clean alert (no residual draft_order_id)
-- Best practice: Clean state rather than complex cleanup

\echo '========================================';
\echo 'FIX BUG #3: ALERT RECREATION ON CANCELLATION';
\echo '========================================';
\echo '';

-- =============================================
-- DROP & RECREATE FUNCTION reactivate_alert_on_order_cancelled
-- =============================================

DROP FUNCTION IF EXISTS reactivate_alert_on_order_cancelled() CASCADE;

CREATE OR REPLACE FUNCTION reactivate_alert_on_order_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_alert RECORD;
  v_product RECORD;
  v_new_alert_id UUID;
BEGIN
  -- Si commande annulée (UPDATE status → cancelled)
  -- OU commande supprimée (DELETE)
  IF (TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled')
     OR TG_OP = 'DELETE' THEN

    -- ✅ NOUVELLE LOGIQUE : DELETE + INSERT (au lieu de UPDATE)
    -- Boucle sur toutes les alertes liées à cette commande
    FOR v_alert IN
      SELECT *
      FROM stock_alert_tracking
      WHERE draft_order_id = COALESCE(NEW.id, OLD.id)
    LOOP
      -- Récupérer infos produit actuelles
      SELECT
        id,
        stock_real,
        stock_forecasted_out,
        stock_forecasted_in,
        min_stock,
        supplier_id
      INTO v_product
      FROM products
      WHERE id = v_alert.product_id;

      -- ✅ STEP 1: DELETE ancienne alerte
      DELETE FROM stock_alert_tracking
      WHERE id = v_alert.id;

      RAISE NOTICE '🗑️ Alerte % supprimée (produit: %, commande annulée: %)',
        v_alert.id, v_product.id, COALESCE(NEW.po_number, OLD.po_number);

      -- ✅ STEP 2: Calculer si produit nécessite toujours alerte
      -- Seulement si stock toujours en dessous du minimum
      IF v_product.stock_real < v_product.min_stock THEN

        -- Calculer nouvelle shortage_quantity
        DECLARE
          v_shortage_qty INTEGER;
          v_alert_type TEXT;
          v_priority INTEGER;
        BEGIN
          v_shortage_qty := v_product.min_stock - v_product.stock_real;

          -- Déterminer type alerte
          IF v_product.stock_real <= 0 THEN
            v_alert_type := 'out_of_stock';
            v_priority := 1; -- CRITICAL
          ELSE
            v_alert_type := 'low_stock';
            v_priority := 2; -- HIGH
          END IF;

          -- ✅ STEP 3: INSERT nouvelle alerte propre (sans draft_order_id)
          INSERT INTO stock_alert_tracking (
            product_id,
            supplier_id,
            alert_type,
            alert_priority,
            stock_real,
            stock_forecasted_out,
            stock_forecasted_in,
            min_stock,
            shortage_quantity,
            draft_order_id,        -- ✅ NULL (propre)
            quantity_in_draft,     -- ✅ 0 (propre)
            added_to_draft_at,     -- ✅ NULL (propre)
            validated,             -- ✅ false (alerte active)
            validated_at,
            validated_by,
            notes,
            created_at,
            updated_at
          ) VALUES (
            v_product.id,
            v_product.supplier_id,
            v_alert_type,
            v_priority,
            v_product.stock_real,
            v_product.stock_forecasted_out,
            v_product.stock_forecasted_in,
            v_product.min_stock,
            v_shortage_qty,
            NULL,                  -- ✅ Pas de draft_order_id
            0,                     -- ✅ Pas de quantité en draft
            NULL,                  -- ✅ Pas de date ajout draft
            false,                 -- ✅ Alerte active
            NULL,
            NULL,
            format('Alerte recréée après annulation commande %s (Bug #3 fix)', COALESCE(NEW.po_number, OLD.po_number)),
            NOW(),
            NOW()
          )
          RETURNING id INTO v_new_alert_id;

          RAISE NOTICE '✅ Nouvelle alerte % créée pour produit % (shortage: %s unités)',
            v_new_alert_id, v_product.id, v_shortage_qty;
        END;

      ELSE
        -- Stock revenu au-dessus minimum → Pas besoin nouvelle alerte
        RAISE NOTICE 'ℹ️ Produit % : Stock OK (%s >= %s) - Pas de nouvelle alerte créée',
          v_product.id, v_product.stock_real, v_product.min_stock;
      END IF;

    END LOOP;

    RAISE NOTICE '🔄 Alertes recréées pour commande % (annulation/suppression)',
      COALESCE(NEW.po_number, OLD.po_number);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recréer trigger (même configuration qu'avant)
CREATE TRIGGER trigger_reactivate_alert_on_order_cancelled
  AFTER UPDATE OF status OR DELETE
  ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION reactivate_alert_on_order_cancelled();

COMMENT ON FUNCTION reactivate_alert_on_order_cancelled() IS
'Trigger: Recrée alertes stock si commande annulée ou supprimée (Bug #3 fix 2025-11-13).
Workflow: DELETE ancienne alerte + INSERT nouvelle alerte propre (sans draft_order_id résiduel).
Best practice: Clean state plutôt que complex cleanup.';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger reactivate_alert_on_order_cancelled() mis à jour avec BUG #3 fixé';
  RAISE NOTICE '   Nouvelle logique: DELETE + INSERT (au lieu de UPDATE)';
  RAISE NOTICE '   Bénéfice: Alerte propre sans résidus (draft_order_id, quantity_in_draft)';
  RAISE NOTICE '   Contrainte unique_product_alert respectée';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';
\echo '✅ MIGRATION 005 TERMINÉE';
\echo '========================================';
\echo '';
\echo 'Correction effectuée:';
\echo '1. DELETE ancienne alerte (avec draft_order_id résiduel)';
\echo '2. INSERT nouvelle alerte propre (validated=false, draft_order_id=NULL)';
\echo '3. Nouvelle alerte créée SEULEMENT si stock toujours < min_stock';
\echo '';

-- Migration: Fix purchase order cancellation from partially_received status
-- Date: 2025-11-13
-- Bug: Trigger doesn't release forecasted_in when cancelling partially received PO
-- Impact: Stock prévisionnel incorrect (forecasted_in reste bloqué après annulation PO partiellement reçue)
-- Priority: P1 - HIGH
--
-- Correction: Ajouter CAS 4 pour gérer annulation depuis 'partially_received'
-- Calcul net : Libérer seulement (quantity - quantity_received)

\echo '========================================';
\echo 'FIX BUG #4: ANNULATION PO PARTIELLE';
\echo '========================================';
\echo '';

-- =============================================
-- DROP & RECREATE FUNCTION handle_purchase_order_forecast
-- =============================================

DROP FUNCTION IF EXISTS handle_purchase_order_forecast() CASCADE;

CREATE OR REPLACE FUNCTION handle_purchase_order_forecast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_stock_before INTEGER;
  v_qty_diff INTEGER;
  v_already_received INTEGER;
  v_forecasted_qty INTEGER;
BEGIN
  -- CAS 1: Commande confirmée (draft/sent → confirmed)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        notes,
        reason_code,
        affects_forecast,
        forecast_type,
        performed_by
      ) VALUES (
        v_item.product_id,
        'IN',
        v_item.quantity,
        0,
        0,
        'purchase_order',
        NEW.id,
        'Entrée prévisionnelle - Commande fournisseur ' || NEW.po_number,
        'purchase_reception',
        true,
        'in',
        NEW.created_by
      );
    END LOOP;

  -- CAS 2: RÉCEPTION (partially_received OU received)
  ELSIF NEW.status IN ('partially_received', 'received') THEN

    -- Parcourir tous les items de la commande
    FOR v_item IN
      SELECT
        poi.id,
        poi.product_id,
        poi.quantity,
        COALESCE(poi.quantity_received, 0) as quantity_received
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      -- CALCUL DIFFÉRENTIEL ROBUSTE:
      -- Comparer quantity_received avec SUM des mouvements stock réels déjà créés
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      INTO v_already_received
      FROM stock_movements
      WHERE reference_type = 'purchase_order'
        AND reference_id = NEW.id
        AND product_id = v_item.product_id
        AND affects_forecast = false  -- Mouvement RÉEL (pas prévisionnel)
        AND movement_type = 'IN';

      -- Différence = ce qui doit être ajouté maintenant
      v_qty_diff := v_item.quantity_received - v_already_received;

      -- Si augmentation de quantité reçue
      IF v_qty_diff > 0 THEN

        -- 1. Retirer du prévisionnel IN (différentiel)
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity_change,
          quantity_before,
          quantity_after,
          reference_type,
          reference_id,
          notes,
          reason_code,
          affects_forecast,
          forecast_type,
          performed_by
        ) VALUES (
          v_item.product_id,
          'OUT',
          -v_qty_diff,  -- Différentiel uniquement
          0,
          0,
          'purchase_order',
          NEW.id,
          CASE
            WHEN NEW.status = 'partially_received' THEN
              format('Réception partielle - Annulation prévisionnel %s/%s unités (déjà reçu: %s)',
                     v_item.quantity_received, v_item.quantity, v_already_received)
            ELSE
              format('Réception complète - Annulation prévisionnel %s/%s unités (déjà reçu: %s)',
                     v_item.quantity_received, v_item.quantity, v_already_received)
          END,
          'purchase_reception',
          true,
          'in',
          NEW.received_by
        );

        -- Récupérer stock réel avant
        SELECT COALESCE(stock_real, stock_quantity, 0)
        INTO v_stock_before
        FROM products
        WHERE id = v_item.product_id;

        -- 2. Ajouter au stock réel (différentiel)
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity_change,
          quantity_before,
          quantity_after,
          reference_type,
          reference_id,
          notes,
          reason_code,
          affects_forecast,
          forecast_type,
          performed_by
        ) VALUES (
          v_item.product_id,
          'IN',
          v_qty_diff,  -- Différentiel uniquement
          v_stock_before,
          v_stock_before + v_qty_diff,
          'purchase_order',
          NEW.id,
          CASE
            WHEN NEW.status = 'partially_received' THEN
              format('Réception partielle - %s/%s unités (déjà reçu: %s)',
                     v_item.quantity_received, v_item.quantity, v_already_received)
            ELSE
              format('Réception complète - %s/%s unités (déjà reçu: %s) - PO %s',
                     v_item.quantity_received, v_item.quantity, v_already_received, NEW.po_number)
          END,
          'purchase_reception',
          false,
          null,
          NEW.received_by
        );

      END IF;  -- v_qty_diff > 0
    END LOOP;

  -- CAS 3: Annulation (confirmed/sent → cancelled)
  ELSIF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'sent') THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        notes,
        reason_code,
        affects_forecast,
        forecast_type,
        performed_by
      ) VALUES (
        v_item.product_id,
        'OUT',
        -v_item.quantity,
        0,
        0,
        'purchase_order',
        NEW.id,
        'Annulation prévisionnel - Commande annulée',
        'purchase_reception',
        true,
        'in',
        NEW.created_by
      );
    END LOOP;

  -- ✅ CAS 4 (NOUVEAU): Annulation depuis partially_received
  -- Correction Bug #4: Gérer annulation PO partiellement reçue
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'partially_received' THEN
    FOR v_item IN
      SELECT
        poi.product_id,
        poi.quantity,
        COALESCE(poi.quantity_received, 0) as quantity_received
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      -- ✅ CALCUL NET : Quantité restante en prévisionnel
      v_forecasted_qty := v_item.quantity - v_item.quantity_received;

      -- Libérer seulement si reste du prévisionnel
      IF v_forecasted_qty > 0 THEN
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity_change,
          quantity_before,
          quantity_after,
          reference_type,
          reference_id,
          notes,
          reason_code,
          affects_forecast,
          forecast_type,
          performed_by
        ) VALUES (
          v_item.product_id,
          'OUT',
          -v_forecasted_qty,  -- ✅ NET seulement (quantity - quantity_received)
          0,
          0,
          'purchase_order',
          NEW.id,
          format('Annulation PO partiellement reçue - Libération %s unités (déjà reçu: %s/%s)',
                 v_forecasted_qty, v_item.quantity_received, v_item.quantity),
          'purchase_reception',
          true,
          'in',
          NEW.created_by
        );

        -- Log pour monitoring
        RAISE NOTICE '✅ [BUG #4 FIX] Forecasted_in libéré pour produit % (net: %s = %s - %s)',
          v_item.product_id, v_forecasted_qty, v_item.quantity, v_item.quantity_received;
      ELSE
        -- Note: Si quantity_received = quantity, aucune libération nécessaire
        RAISE NOTICE 'ℹ️ PO annulée mais 100%% reçue - Aucune libération forecasted_in nécessaire (produit: %)',
          v_item.product_id;
      END IF;
    END LOOP;

  END IF;

  RETURN NEW;
END;
$function$;

-- Recréer trigger (même configuration qu'avant)
CREATE TRIGGER trigger_purchase_order_forecast
  AFTER INSERT OR UPDATE OF status
  ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_order_forecast();

COMMENT ON FUNCTION handle_purchase_order_forecast() IS
'Trigger: Gère les mouvements stock prévisionnels pour commandes fournisseurs.
Déclenché sur INSERT/UPDATE de status.
CAS 1: draft/sent→confirmed: Créer prévisionnel IN.
CAS 2: →partially_received/received: Algorithme différentiel (réceptions successives).
CAS 3: confirmed/sent→cancelled: Libérer prévisionnel.
CAS 4: partially_received→cancelled: Libérer NET (quantity - quantity_received) - BUG #4 fix 2025-11-13.';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger handle_purchase_order_forecast() mis à jour avec BUG #4 fixé';
  RAISE NOTICE '   CAS 4 ajouté: Annulation PO partiellement reçue gérée correctement';
  RAISE NOTICE '   Calcul net: forecasted_qty = quantity - quantity_received';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';
\echo '✅ MIGRATION 004 TERMINÉE';
\echo '========================================';
\echo '';
\echo 'Correction effectuée:';
\echo '1. Ajout CAS 4 pour annulation depuis partially_received';
\echo '2. Calcul net correct (quantity - quantity_received)';
\echo '3. Libération forecasted_in uniquement pour quantité non reçue';
\echo '';

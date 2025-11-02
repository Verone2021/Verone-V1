-- ================================================================
-- Migration: Fix trigger pour réceptions successives
-- Date: 2025-10-30
-- Description: Supprime la condition bloquante OLD.status NOT IN
--              pour permettre les réceptions successives
-- Bug: Le trigger ne créait pas de mouvements lors de la 2ème
--      réception partielle car OLD.status était déjà 'partially_received'
-- Fix: L'algorithme différentiel est idempotent, donc pas besoin
--      de bloquer les réceptions successives avec le check OLD.status
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_purchase_order_forecast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_stock_before INTEGER;
  v_qty_diff INTEGER;
  v_already_received INTEGER;
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

  -- ✅ CAS 2: RÉCEPTION (partially_received OU received)
  -- FIX: Suppression de la condition bloquante OLD.status NOT IN
  --      L'algorithme différentiel gère déjà les duplicatas
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
      -- 🔑 CALCUL DIFFÉRENTIEL ROBUSTE:
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

  END IF;

  RETURN NEW;
END;
$function$;

-- ================================================================
-- CHANGEMENT PRÉCIS:
-- AVANT: ELSIF NEW.status IN ('partially_received', 'received') AND
--              OLD.status NOT IN ('partially_received', 'received') THEN
-- APRÈS: ELSIF NEW.status IN ('partially_received', 'received') THEN
--
-- RAISON: La condition OLD.status NOT IN bloquait les réceptions
--         successives. L'algorithme différentiel (v_already_received)
--         gère déjà la protection contre les duplicatas.
-- ================================================================

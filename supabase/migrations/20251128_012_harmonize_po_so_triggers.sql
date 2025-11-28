-- ============================================================================
-- Migration: Harmonisation Triggers PO/SO pour Stocks Prévisionnels
-- Date: 2025-11-28
-- Description: Corriger les 4 lacunes identifiées dans l'audit des triggers
--   L1: DELETE item PO brouillon sans mise à jour tracking
--   L2: Dévalidation PO (validated→draft) sans rollback stock_forecasted_in
--   L3: Fonction validate_stock_alerts_on_po() existe mais trigger manque
--   L4: Validation SO sans trigger (supprimé le 20 nov)
-- ============================================================================

-- ============================================================================
-- PARTIE A : Corriger LACUNE L1 - DELETE item PO brouillon
-- Quand on supprime un item d'une PO brouillon, quantity_in_draft doit être recalculé
-- ============================================================================

CREATE OR REPLACE FUNCTION public.track_product_removed_from_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_po_status purchase_order_status;
  v_remaining_qty INTEGER;
  v_first_draft_id UUID;
  v_first_draft_number TEXT;
BEGIN
  -- Vérifier le statut de la PO
  SELECT status INTO v_po_status
  FROM purchase_orders
  WHERE id = OLD.purchase_order_id;

  IF v_po_status = 'draft' THEN
    -- Recalculer quantity_in_draft (SUM des autres items restants dans TOUS les brouillons)
    SELECT COALESCE(SUM(poi.quantity), 0) INTO v_remaining_qty
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.product_id = OLD.product_id
      AND po.status = 'draft'
      AND poi.id != OLD.id;

    -- Trouver le premier brouillon restant (pour le lien)
    SELECT po.id, po.po_number INTO v_first_draft_id, v_first_draft_number
    FROM purchase_orders po
    JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
    WHERE poi.product_id = OLD.product_id
      AND po.status = 'draft'
      AND poi.id != OLD.id
    ORDER BY po.created_at ASC
    LIMIT 1;

    -- Mettre à jour stock_alert_tracking
    UPDATE stock_alert_tracking SET
      quantity_in_draft = v_remaining_qty,
      draft_order_id = v_first_draft_id,
      draft_order_number = v_first_draft_number,
      -- Si plus de brouillon, remettre validated à false
      validated = CASE WHEN v_remaining_qty = 0 THEN false ELSE validated END,
      updated_at = NOW()
    WHERE product_id = OLD.product_id;

    RAISE NOTICE '✅ [L1] track_product_removed_from_draft: Produit % - qty_remaining=%, draft_id=%',
      OLD.product_id, v_remaining_qty, v_first_draft_id;
  END IF;

  RETURN OLD;
END;
$$;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_track_product_removed_from_draft ON purchase_order_items;
CREATE TRIGGER trigger_track_product_removed_from_draft
AFTER DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION track_product_removed_from_draft();

COMMENT ON FUNCTION track_product_removed_from_draft() IS
'[L1] Trigger AFTER DELETE sur purchase_order_items.
Recalcule quantity_in_draft dans stock_alert_tracking quand un item est supprimé d''une PO brouillon.
Migration: 20251128_012';

-- ============================================================================
-- PARTIE B : Corriger LACUNE L2 - Dévalidation PO (validated → draft)
-- Rollback stock_forecasted_in et restaurer le tracking brouillon
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rollback_forecasted_in_on_po_devalidation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_item RECORD;
  v_qty_to_rollback INTEGER;
BEGIN
  -- Uniquement sur transition validated → draft
  IF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    -- Pour chaque item de la PO
    FOR v_item IN
      SELECT product_id, quantity, COALESCE(quantity_received, 0) as qty_received
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      -- Quantité à rollback = quantité commandée - quantité déjà reçue
      v_qty_to_rollback := v_item.quantity - v_item.qty_received;

      IF v_qty_to_rollback > 0 THEN
        -- Décrémenter stock_forecasted_in (protéger contre négatif)
        UPDATE products
        SET stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - v_qty_to_rollback)
        WHERE id = v_item.product_id;

        -- Restaurer le tracking brouillon
        UPDATE stock_alert_tracking SET
          draft_order_id = NEW.id,
          draft_order_number = NEW.po_number,
          quantity_in_draft = v_item.quantity,
          validated = FALSE,
          validated_at = NULL,
          validated_by = NULL,
          updated_at = NOW()
        WHERE product_id = v_item.product_id;

        RAISE NOTICE '✅ [L2] rollback_forecasted_in: Produit % - rollback % unités, restored draft PO %',
          v_item.product_id, v_qty_to_rollback, NEW.po_number;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_rollback_forecasted_in_on_po_devalidation ON purchase_orders;
CREATE TRIGGER trigger_rollback_forecasted_in_on_po_devalidation
AFTER UPDATE OF status ON purchase_orders
FOR EACH ROW
WHEN (OLD.status = 'validated' AND NEW.status = 'draft')
EXECUTE FUNCTION rollback_forecasted_in_on_po_devalidation();

COMMENT ON FUNCTION rollback_forecasted_in_on_po_devalidation() IS
'[L2] Trigger AFTER UPDATE sur purchase_orders (validated → draft).
Rollback stock_forecasted_in et restaure le tracking brouillon dans stock_alert_tracking.
Migration: 20251128_012';

-- ============================================================================
-- PARTIE C : Corriger LACUNE L3 - Trigger manquant pour validate_stock_alerts_on_po()
-- La fonction existe mais le trigger n'est pas créé
-- ============================================================================

-- Vérifier si la fonction existe, sinon la créer
DO $$
BEGIN
  -- Vérifier si la fonction existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'validate_stock_alerts_on_po'
  ) THEN
    RAISE NOTICE '⚠️ [L3] Fonction validate_stock_alerts_on_po() n''existe pas - création ignorée';
  ELSE
    -- Créer le trigger si la fonction existe
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_validate_stock_alerts_on_po'
    ) THEN
      CREATE TRIGGER trigger_validate_stock_alerts_on_po
      AFTER UPDATE OF status ON purchase_orders
      FOR EACH ROW
      WHEN (OLD.status = 'draft' AND NEW.status = 'validated')
      EXECUTE FUNCTION validate_stock_alerts_on_po();

      RAISE NOTICE '✅ [L3] Trigger trigger_validate_stock_alerts_on_po créé';
    ELSE
      RAISE NOTICE '✅ [L3] Trigger trigger_validate_stock_alerts_on_po existe déjà';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PARTIE D : Corriger LACUNE L4 - Validation SO (draft → validated)
-- Le trigger a été supprimé le 20 novembre - il faut le recréer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_forecasted_out_on_so_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_item RECORD;
  v_qty_to_reserve INTEGER;
BEGIN
  -- Uniquement sur transition draft → validated
  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    -- Pour chaque item de la SO
    FOR v_item IN
      SELECT product_id, quantity, COALESCE(quantity_shipped, 0) as qty_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
      -- Quantité à réserver = quantité commandée - quantité déjà expédiée
      v_qty_to_reserve := v_item.quantity - v_item.qty_shipped;

      IF v_qty_to_reserve > 0 THEN
        -- Incrémenter stock_forecasted_out (réservation pour le client)
        UPDATE products
        SET stock_forecasted_out = COALESCE(stock_forecasted_out, 0) + v_qty_to_reserve
        WHERE id = v_item.product_id;

        -- Mettre à jour stock_alert_tracking si l'alerte existe
        UPDATE stock_alert_tracking SET
          stock_forecasted_out = COALESCE(stock_forecasted_out, 0) + v_qty_to_reserve,
          updated_at = NOW()
        WHERE product_id = v_item.product_id;

        RAISE NOTICE '✅ [L4] update_forecasted_out_on_so_validation: Produit % - réservé % unités pour SO %',
          v_item.product_id, v_qty_to_reserve, NEW.order_number;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_so_update_forecasted_out ON sales_orders;
CREATE TRIGGER trigger_so_update_forecasted_out
AFTER UPDATE OF status ON sales_orders
FOR EACH ROW
WHEN (OLD.status = 'draft' AND NEW.status = 'validated')
EXECUTE FUNCTION update_forecasted_out_on_so_validation();

COMMENT ON FUNCTION update_forecasted_out_on_so_validation() IS
'[L4] Trigger AFTER UPDATE sur sales_orders (draft → validated).
Incrémente stock_forecasted_out quand une SO est validée.
Migration: 20251128_012';

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  -- Compter les triggers créés
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname IN (
    'trigger_track_product_removed_from_draft',
    'trigger_rollback_forecasted_in_on_po_devalidation',
    'trigger_validate_stock_alerts_on_po',
    'trigger_so_update_forecasted_out'
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 20251128_012 terminée';
  RAISE NOTICE '   Triggers créés/vérifiés: %/4', v_trigger_count;
  RAISE NOTICE '   L1: DELETE item PO brouillon';
  RAISE NOTICE '   L2: Dévalidation PO (validated→draft)';
  RAISE NOTICE '   L3: validate_stock_alerts_on_po trigger';
  RAISE NOTICE '   L4: Validation SO (draft→validated)';
  RAISE NOTICE '========================================';
END $$;

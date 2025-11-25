-- Migration: Ajouter stock_forecasted_in lors de la validation des commandes fournisseurs
-- Description: Lorsqu'une commande fournisseur passe de "draft" à "validated",
--              incrémenter stock_forecasted_in pour tous les produits de la commande.
--              Cela permet de comptabiliser les échantillons et commandes en attente.

-- ==============================================================================
-- FONCTION: update_forecasted_stock_on_po_validation
-- ==============================================================================
-- Détecte le changement de status draft -> validated
-- et incrémente stock_forecasted_in pour chaque item de la commande

CREATE OR REPLACE FUNCTION public.update_forecasted_stock_on_po_validation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Seulement si passage de draft à validated
  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    -- Pour chaque item de la commande, incrémenter stock_forecasted_in
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      UPDATE products
      SET stock_forecasted_in = COALESCE(stock_forecasted_in, 0) + v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.product_id;

      RAISE NOTICE 'Stock forecasted_in updated for product % (+%)', v_item.product_id, v_item.quantity;
    END LOOP;
  END IF;

  -- Gérer également l'annulation: si validated -> cancelled, décrémenter
  IF OLD.status = 'validated' AND NEW.status = 'cancelled' THEN
    FOR v_item IN
      SELECT product_id, quantity, quantity_received
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      -- Décrémenter seulement la quantité non encore reçue
      UPDATE products
      SET stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - (v_item.quantity - COALESCE(v_item.quantity_received, 0))),
          updated_at = NOW()
      WHERE id = v_item.product_id;

      RAISE NOTICE 'Stock forecasted_in decreased for product % (cancelled PO)', v_item.product_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- ==============================================================================
-- TRIGGER: trg_po_validation_forecasted_stock
-- ==============================================================================
-- Se déclenche lors d'un UPDATE sur purchase_orders
-- Uniquement quand le status change

DROP TRIGGER IF EXISTS trg_po_validation_forecasted_stock ON purchase_orders;

CREATE TRIGGER trg_po_validation_forecasted_stock
AFTER UPDATE ON purchase_orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_forecasted_stock_on_po_validation();

-- ==============================================================================
-- COMMENTAIRES
-- ==============================================================================

COMMENT ON FUNCTION public.update_forecasted_stock_on_po_validation() IS
'Incrémente stock_forecasted_in des produits quand une commande fournisseur est validée (draft -> validated).
Décrémente si la commande est annulée (validated -> cancelled).
Utilisé pour les commandes normales ET les échantillons sourcing.';

COMMENT ON TRIGGER trg_po_validation_forecasted_stock ON purchase_orders IS
'Trigger pour mettre à jour stock_forecasted_in lors des changements de status des commandes fournisseurs.';

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
  -- Vérifier que le trigger existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_po_validation_forecasted_stock'
  ) THEN
    RAISE EXCEPTION 'Trigger trg_po_validation_forecasted_stock non créé!';
  END IF;

  RAISE NOTICE '✅ Migration 20251125_001: Trigger stock_forecasted_in sur validation PO créé avec succès';
END;
$$;

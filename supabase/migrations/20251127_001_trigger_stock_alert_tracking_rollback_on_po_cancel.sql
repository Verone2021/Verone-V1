-- ============================================================================
-- Migration: Rollback stock_alert_tracking lors annulation commande fournisseur
-- Date: 2025-11-27
-- Description: Quand une PO est annulée, réinitialise les champs draft dans
--              stock_alert_tracking pour permettre de recréer une commande
--              depuis le modal "Alerte Stock"
-- ============================================================================

-- Fonction trigger: Rollback stock_alert_tracking quand PO annulée
CREATE OR REPLACE FUNCTION rollback_stock_alert_tracking_on_po_cancel()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Si la commande passe à 'cancelled' (depuis n'importe quel statut)
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Réinitialiser les champs draft dans stock_alert_tracking
    -- pour tous les produits liés à cette PO
    UPDATE stock_alert_tracking
    SET
      draft_order_id = NULL,
      quantity_in_draft = NULL,
      added_to_draft_at = NULL,
      updated_at = NOW()
    WHERE draft_order_id = NEW.id;

    RAISE NOTICE 'stock_alert_tracking rollback for PO %: rows updated for cancelled order',
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Supprimer trigger existant si présent (idempotent)
DROP TRIGGER IF EXISTS trg_stock_alert_tracking_rollback_on_po_cancel ON purchase_orders;

-- Créer le trigger
CREATE TRIGGER trg_stock_alert_tracking_rollback_on_po_cancel
AFTER UPDATE ON purchase_orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled')
EXECUTE FUNCTION rollback_stock_alert_tracking_on_po_cancel();

-- Commentaire documentation
COMMENT ON FUNCTION rollback_stock_alert_tracking_on_po_cancel() IS
'Réinitialise stock_alert_tracking.draft_order_id à NULL quand une PO est annulée, permettant de recréer une commande depuis le modal Alerte Stock';

COMMENT ON TRIGGER trg_stock_alert_tracking_rollback_on_po_cancel ON purchase_orders IS
'Déclenché après annulation d''une commande fournisseur pour libérer le lien avec stock_alert_tracking';

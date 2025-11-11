-- Migration: Fix track_product_removed_from_draft() trigger
-- Date: 2025-11-10
-- Description: Correction du bug MAX(uuid) dans le trigger
--
-- BUG: Le trigger utilisait MAX(poi.purchase_order_id) sur une colonne UUID
-- ce qui échoue avec "function max(uuid) does not exist"
--
-- FIX: Utiliser n'importe quelle commande brouillon trouvée (LIMIT 1)
-- car peu importe laquelle on choisit, tant qu'on en a une

CREATE OR REPLACE FUNCTION track_product_removed_from_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_status purchase_order_status;
  v_remaining_quantity INTEGER;
  v_any_draft_id uuid;
BEGIN
  -- Vérifier si la commande était en draft
  SELECT status INTO v_po_status
  FROM purchase_orders
  WHERE id = OLD.purchase_order_id;

  IF v_po_status = 'draft' THEN
    -- Calculer quantité restante dans brouillons pour ce produit
    SELECT
      COALESCE(SUM(poi.quantity), 0)
    INTO v_remaining_quantity
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.product_id = OLD.product_id
      AND po.status = 'draft'
      AND poi.id != OLD.id; -- Exclure l'item en cours de suppression

    -- Si il reste des items, trouver n'importe quelle commande brouillon
    IF v_remaining_quantity > 0 THEN
      SELECT poi.purchase_order_id
      INTO v_any_draft_id
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      WHERE poi.product_id = OLD.product_id
        AND po.status = 'draft'
        AND poi.id != OLD.id
      LIMIT 1;

      -- Toujours des items dans d'autres brouillons
      UPDATE stock_alert_tracking
      SET
        draft_order_id = v_any_draft_id,
        quantity_in_draft = v_remaining_quantity,
        updated_at = now()
      WHERE product_id = OLD.product_id;
    ELSE
      -- Plus aucun item dans brouillons → Réactiver bouton "Commander"
      UPDATE stock_alert_tracking
      SET
        draft_order_id = NULL,
        quantity_in_draft = 0,
        added_to_draft_at = NULL,
        updated_at = now()
      WHERE product_id = OLD.product_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION track_product_removed_from_draft() IS
'Trigger AFTER DELETE sur purchase_order_items.
Met à jour stock_alert_tracking quand produit retiré d''une commande brouillon.
Fix 2025-11-10: Correction bug MAX(uuid) → Utilisation LIMIT 1 pour trouver n''importe quelle commande brouillon.';

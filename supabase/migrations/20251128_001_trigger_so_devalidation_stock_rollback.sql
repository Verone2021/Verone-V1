-- ============================================================================
-- TRIGGER: Rollback stock_forecasted_out lors dévalidation Sales Order
-- Date: 2025-11-28
-- Description: Décrémente stock_forecasted_out quand une commande client
--              passe de 'validated' à 'draft' (dévalidation)
-- Aligné sur le comportement des Purchase Orders (PO)
-- ============================================================================

-- Fonction trigger pour rollback stock prévisionnel sortie
CREATE OR REPLACE FUNCTION rollback_forecasted_out_on_so_devalidation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Si passage de validated à draft (dévalidation)
  IF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    RAISE NOTICE '[SO_DEVALIDATION] Rollback stock_forecasted_out pour SO %', NEW.id;

    FOR v_item IN
      SELECT product_id, quantity, quantity_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
      -- Décrémenter stock_forecasted_out (seulement quantité non expédiée)
      UPDATE products
      SET stock_forecasted_out = GREATEST(0, COALESCE(stock_forecasted_out, 0) - (v_item.quantity - COALESCE(v_item.quantity_shipped, 0))),
          updated_at = NOW()
      WHERE id = v_item.product_id;

      RAISE NOTICE '[SO_DEVALIDATION] Produit % : décrémenté de % unités',
        v_item.product_id,
        (v_item.quantity - COALESCE(v_item.quantity_shipped, 0));
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur sales_orders
DROP TRIGGER IF EXISTS trg_so_devalidation_forecasted_stock ON sales_orders;
CREATE TRIGGER trg_so_devalidation_forecasted_stock
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION rollback_forecasted_out_on_so_devalidation();

-- Commentaire explicatif
COMMENT ON FUNCTION rollback_forecasted_out_on_so_devalidation() IS
'Rollback du stock prévisionnel de sortie lors de la dévalidation d''une commande client (validated → draft). Aligné sur le comportement des Purchase Orders.';

-- ============================================================================
-- NOTES:
-- - Ce trigger se déclenche UNIQUEMENT lors de validated → draft
-- - Le stock_forecasted_out est décrémenté de (quantity - quantity_shipped)
-- - quantity_shipped devrait être 0 car la dévalidation est bloquée si > 0
-- - Utilise GREATEST(0, ...) pour éviter les valeurs négatives
-- ============================================================================

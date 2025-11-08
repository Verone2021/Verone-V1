-- Migration: Nettoyage automatique des mouvements lors suppression commande
-- Description: Supprime automatiquement les mouvements de stock (réels + prévisionnels)
--              lorsqu'une commande fournisseur ou client est supprimée
-- Date: 2025-11-04
-- Auteur: Claude Code

-- ========================================
-- TRIGGER: Cleanup Purchase Order Movements
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_purchase_order_movements()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Supprimer TOUS les mouvements liés à cette commande fournisseur
  -- (Prévisionnels ET réels si réception partielle)
  DELETE FROM stock_movements
  WHERE reference_type = 'purchase_order'
    AND reference_id = OLD.id;

  RAISE NOTICE 'Mouvements stock supprimés pour commande fournisseur %', OLD.po_number;

  RETURN OLD;
END;
$$;

-- Créer le trigger BEFORE DELETE
DROP TRIGGER IF EXISTS trigger_cleanup_purchase_order_movements ON purchase_orders;
CREATE TRIGGER trigger_cleanup_purchase_order_movements
  BEFORE DELETE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_purchase_order_movements();

COMMENT ON FUNCTION cleanup_purchase_order_movements() IS
'Supprime automatiquement tous les mouvements de stock (réels + prévisionnels) liés à une commande fournisseur lors de sa suppression';


-- ========================================
-- TRIGGER: Cleanup Sales Order Movements
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_sales_order_movements()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Supprimer TOUS les mouvements liés à cette commande client
  -- (Prévisionnels ET réels si expédition partielle)
  DELETE FROM stock_movements
  WHERE reference_type = 'sales_order'
    AND reference_id = OLD.id;

  RAISE NOTICE 'Mouvements stock supprimés pour commande client %', OLD.order_number;

  RETURN OLD;
END;
$$;

-- Créer le trigger BEFORE DELETE
DROP TRIGGER IF EXISTS trigger_cleanup_sales_order_movements ON sales_orders;
CREATE TRIGGER trigger_cleanup_sales_order_movements
  BEFORE DELETE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_sales_order_movements();

COMMENT ON FUNCTION cleanup_sales_order_movements() IS
'Supprime automatiquement tous les mouvements de stock (réels + prévisionnels) liés à une commande client lors de sa suppression';


-- ========================================
-- CORRECTION: Stock prévisionnel lors suppression
-- ========================================

-- Mettre à jour la fonction cleanup pour AUSSI réinitialiser stock_forecasted_in/out
CREATE OR REPLACE FUNCTION cleanup_purchase_order_movements()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Pour chaque item de la commande, réinitialiser stock prévisionnel
  FOR v_item IN
    SELECT product_id, quantity
    FROM purchase_order_items
    WHERE purchase_order_id = OLD.id
  LOOP
    -- Si commande confirmée, retirer du stock_forecasted_in
    IF OLD.status IN ('confirmed', 'sent', 'partially_received') THEN
      UPDATE products
      SET stock_forecasted_in = GREATEST(0, stock_forecasted_in - v_item.quantity)
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  -- Supprimer TOUS les mouvements liés à cette commande fournisseur
  DELETE FROM stock_movements
  WHERE reference_type = 'purchase_order'
    AND reference_id = OLD.id;

  RAISE NOTICE 'Mouvements stock supprimés + stock prévisionnel réinitialisé pour PO %', OLD.po_number;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_sales_order_movements()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Pour chaque item de la commande, réinitialiser stock prévisionnel
  FOR v_item IN
    SELECT product_id, quantity
    FROM sales_order_items
    WHERE sales_order_id = OLD.id
  LOOP
    -- Si commande confirmée (mais pas expédiée), retirer du stock_forecasted_out
    IF OLD.status = 'confirmed' AND OLD.warehouse_exit_at IS NULL THEN
      UPDATE products
      SET stock_forecasted_out = GREATEST(0, stock_forecasted_out - v_item.quantity)
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  -- Supprimer TOUS les mouvements liés à cette commande client
  DELETE FROM stock_movements
  WHERE reference_type = 'sales_order'
    AND reference_id = OLD.id;

  RAISE NOTICE 'Mouvements stock supprimés + stock prévisionnel réinitialisé pour SO %', OLD.order_number;

  RETURN OLD;
END;
$$;


-- ========================================
-- TESTS UNITAIRES
-- ========================================

-- Test 1: Vérifier que triggers existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_cleanup_purchase_order_movements'
  ) THEN
    RAISE EXCEPTION 'Trigger cleanup_purchase_order_movements manquant';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_cleanup_sales_order_movements'
  ) THEN
    RAISE EXCEPTION 'Trigger cleanup_sales_order_movements manquant';
  END IF;

  RAISE NOTICE '✅ Triggers cleanup créés avec succès';
END $$;

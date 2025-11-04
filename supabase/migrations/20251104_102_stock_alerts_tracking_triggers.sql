-- Migration: Triggers automatiques pour stock_alert_tracking
-- Date: 2025-11-04
-- Description: 4 triggers pour synchronisation automatique alertes stock avec commandes brouillon

-- =============================================
-- TRIGGER 1: Sync alertes avec products
-- =============================================

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supplier_id uuid;
  v_alert_type TEXT;
  v_alert_priority INTEGER;
  v_shortage INTEGER;
BEGIN
  -- Récupérer supplier_id du produit
  SELECT supplier_id INTO v_supplier_id
  FROM products
  WHERE id = NEW.id;

  -- Si pas de fournisseur, ignorer
  IF v_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculer type et priorité alerte selon règles métier Vérone
  IF NEW.stock_real <= 0 AND NEW.stock_forecasted_out > 0 THEN
    -- Stock épuisé mais commandes en cours
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3; -- Critique
    v_shortage := NEW.stock_forecasted_out;
  ELSIF NEW.stock_real <= 0 THEN
    -- Rupture de stock complète
    v_alert_type := 'out_of_stock';
    v_alert_priority := 3; -- Critique
    v_shortage := COALESCE(NEW.min_stock, 0);
  ELSIF NEW.stock_real < COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
    -- Stock faible (sous minimum)
    v_alert_type := 'low_stock';
    v_alert_priority := 2; -- Warning
    v_shortage := COALESCE(NEW.min_stock, 0) - NEW.stock_real;
  ELSE
    -- Stock OK → Supprimer alerte si existe
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Insérer ou mettre à jour alerte
  INSERT INTO stock_alert_tracking (
    product_id,
    supplier_id,
    alert_type,
    alert_priority,
    stock_real,
    stock_forecasted_out,
    min_stock,
    shortage_quantity
  )
  VALUES (
    NEW.id,
    v_supplier_id,
    v_alert_type,
    v_alert_priority,
    COALESCE(NEW.stock_real, 0),
    COALESCE(NEW.stock_forecasted_out, 0),
    COALESCE(NEW.min_stock, 0),
    v_shortage
  )
  ON CONFLICT (product_id) DO UPDATE SET
    alert_type = EXCLUDED.alert_type,
    alert_priority = EXCLUDED.alert_priority,
    stock_real = EXCLUDED.stock_real,
    stock_forecasted_out = EXCLUDED.stock_forecasted_out,
    min_stock = EXCLUDED.min_stock,
    shortage_quantity = EXCLUDED.shortage_quantity,
    supplier_id = EXCLUDED.supplier_id,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE OF stock_real, stock_forecasted_out, min_stock
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Trigger 1: Maintient stock_alert_tracking synchronisé avec products.
Déclenché sur INSERT/UPDATE de stock_real, stock_forecasted_out, min_stock.
Calcule automatiquement type alerte et priorité selon règles métier.';

-- =============================================
-- TRIGGER 2: Tracking ajout produit à brouillon
-- =============================================

CREATE OR REPLACE FUNCTION track_product_added_to_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_status purchase_order_status;
BEGIN
  -- Vérifier si la commande est en draft
  SELECT status INTO v_po_status
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  IF v_po_status = 'draft' THEN
    -- Mettre à jour stock_alert_tracking
    UPDATE stock_alert_tracking
    SET
      draft_order_id = NEW.purchase_order_id,
      quantity_in_draft = COALESCE(quantity_in_draft, 0) + NEW.quantity,
      added_to_draft_at = COALESCE(added_to_draft_at, now()),
      updated_at = now()
    WHERE product_id = NEW.product_id
      AND validated = false; -- Seulement alertes non validées
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_track_product_added_to_draft
  AFTER INSERT ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION track_product_added_to_draft();

COMMENT ON FUNCTION track_product_added_to_draft() IS
'Trigger 2: Track ajout produit à commande brouillon.
Déclenché sur INSERT dans purchase_order_items.
Met à jour quantity_in_draft et draft_order_id → Désactive bouton "Commander".';

-- =============================================
-- TRIGGER 3: Tracking suppression produit de brouillon
-- =============================================

CREATE OR REPLACE FUNCTION track_product_removed_from_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_status purchase_order_status;
  v_remaining_quantity INTEGER;
  v_latest_draft_id uuid;
BEGIN
  -- Vérifier si la commande était en draft
  SELECT status INTO v_po_status
  FROM purchase_orders
  WHERE id = OLD.purchase_order_id;

  IF v_po_status = 'draft' THEN
    -- Calculer quantité restante dans brouillons pour ce produit
    SELECT
      COALESCE(SUM(poi.quantity), 0),
      MAX(poi.purchase_order_id)
    INTO v_remaining_quantity, v_latest_draft_id
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.product_id = OLD.product_id
      AND po.status = 'draft'
      AND poi.id != OLD.id; -- Exclure l'item en cours de suppression

    -- Mettre à jour stock_alert_tracking
    IF v_remaining_quantity > 0 THEN
      -- Toujours des items dans d'autres brouillons
      UPDATE stock_alert_tracking
      SET
        draft_order_id = v_latest_draft_id,
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

CREATE TRIGGER trigger_track_product_removed_from_draft
  AFTER DELETE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION track_product_removed_from_draft();

COMMENT ON FUNCTION track_product_removed_from_draft() IS
'Trigger 3: Track suppression produit de commande brouillon.
Déclenché sur DELETE dans purchase_order_items.
Recalcule quantity_in_draft. Si = 0 → Réactive bouton "Commander".';

-- =============================================
-- TRIGGER 4: Validation automatique alertes
-- =============================================

CREATE OR REPLACE FUNCTION auto_validate_alerts_on_order_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si changement de statut draft → autre statut (confirmed, sent, etc.)
  IF OLD.status = 'draft' AND NEW.status != 'draft' THEN
    -- Valider toutes les alertes des produits de cette commande
    UPDATE stock_alert_tracking
    SET
      validated = true,
      validated_at = now(),
      validated_by = NEW.validated_by,
      updated_at = now()
    WHERE draft_order_id = NEW.id
      AND validated = false;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_validate_alerts_on_order_confirmed
  AFTER UPDATE OF status ON purchase_orders
  FOR EACH ROW
  WHEN (OLD.status = 'draft' AND NEW.status != 'draft')
  EXECUTE FUNCTION auto_validate_alerts_on_order_confirmed();

COMMENT ON FUNCTION auto_validate_alerts_on_order_confirmed() IS
'Trigger 4: Validation automatique des alertes quand commande confirmée.
Déclenché sur UPDATE purchase_orders.status (draft → autre statut).
Valide automatiquement toutes les alertes des produits de la commande → Bouton "Valider" automatique.';

-- =============================================
-- TRIGGER 5 (BONUS): Sync quantité lors UPDATE item
-- =============================================

CREATE OR REPLACE FUNCTION track_product_quantity_updated_in_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_status purchase_order_status;
  v_total_quantity INTEGER;
BEGIN
  -- Vérifier si la commande est en draft
  SELECT status INTO v_po_status
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  IF v_po_status = 'draft' THEN
    -- Recalculer quantité totale dans brouillons pour ce produit
    SELECT COALESCE(SUM(poi.quantity), 0)
    INTO v_total_quantity
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.product_id = NEW.product_id
      AND po.status = 'draft';

    -- Mettre à jour stock_alert_tracking
    UPDATE stock_alert_tracking
    SET
      quantity_in_draft = v_total_quantity,
      updated_at = now()
    WHERE product_id = NEW.product_id
      AND validated = false;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_track_product_quantity_updated_in_draft
  AFTER UPDATE OF quantity ON purchase_order_items
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
  EXECUTE FUNCTION track_product_quantity_updated_in_draft();

COMMENT ON FUNCTION track_product_quantity_updated_in_draft() IS
'Trigger 5 (Bonus): Sync quantité lors UPDATE de purchase_order_items.quantity.
Déclenché sur UPDATE de quantity dans brouillon.
Recalcule quantity_in_draft pour affichage correct de l''écart commandé vs minimum.';

-- ============================================================================
-- Migration: Corriger track_product_added_to_draft
-- Date: 2025-11-28
-- Description: Supprimer la condition "AND validated = false" qui empêche
--              la mise à jour des alertes déjà validées quand on crée un brouillon
-- Bug: Le badge orange "X unités en attente" ne s'affiche pas
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : Corriger track_product_added_to_draft
-- ============================================================================

CREATE OR REPLACE FUNCTION public.track_product_added_to_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_po_status purchase_order_status;
  v_po_number TEXT;
  v_updated_count INTEGER;
BEGIN
  -- Vérifier si la commande est en draft
  SELECT status, po_number INTO v_po_status, v_po_number
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  IF v_po_status = 'draft' THEN
    -- Mettre à jour stock_alert_tracking avec numéro de commande
    -- FIX 2025-11-28: Supprimer "AND validated = false" pour gérer les alertes déjà validées
    -- FIX 2025-11-28: Remettre validated = false car le produit est de nouveau en attente
    UPDATE stock_alert_tracking
    SET
      draft_order_id = NEW.purchase_order_id,
      draft_order_number = v_po_number,
      quantity_in_draft = COALESCE(quantity_in_draft, 0) + NEW.quantity,
      added_to_draft_at = COALESCE(added_to_draft_at, now()),
      validated = false,  -- Remettre en "non validé" car en attente de validation PO
      validated_at = NULL,
      validated_by = NULL,
      updated_at = now()
    WHERE product_id = NEW.product_id;
    -- SUPPRIMÉ: AND validated = false (empêchait la mise à jour des alertes déjà validées)

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '✅ [DRAFT] track_product_added_to_draft: % alertes mises à jour pour produit % (PO %)',
      v_updated_count, NEW.product_id, v_po_number;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION track_product_added_to_draft() IS
'Trigger AFTER INSERT sur purchase_order_items.
Met à jour stock_alert_tracking quand un produit est ajouté à une PO brouillon.
FIX 2025-11-28: Suppression condition "validated = false" pour gérer alertes déjà validées.
Migration: 20251128_011';

-- ============================================================================
-- PARTIE 2 : Corriger track_product_quantity_updated_in_draft
-- ============================================================================

CREATE OR REPLACE FUNCTION public.track_product_quantity_updated_in_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_po_status purchase_order_status;
  v_total_quantity INTEGER;
  v_draft_order_id UUID;
  v_draft_order_number TEXT;
  v_updated_count INTEGER;
BEGIN
  -- Check if the order is in draft status
  SELECT status INTO v_po_status
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  IF v_po_status = 'draft' THEN
    -- Calculate total quantity in draft orders for this product
    SELECT COALESCE(SUM(poi.quantity), 0)
    INTO v_total_quantity
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.product_id = NEW.product_id
      AND po.status = 'draft';

    -- Get the first draft order (by created_at)
    SELECT po.id, po.po_number
    INTO v_draft_order_id, v_draft_order_number
    FROM purchase_orders po
    JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
    WHERE poi.product_id = NEW.product_id
      AND po.status = 'draft'
    ORDER BY po.created_at ASC
    LIMIT 1;

    -- Update tracking table
    -- FIX 2025-11-28: Supprimer "AND validated = false" pour gérer les alertes déjà validées
    UPDATE stock_alert_tracking
    SET
      draft_order_id = v_draft_order_id,
      draft_order_number = v_draft_order_number,
      quantity_in_draft = v_total_quantity,
      validated = false,  -- Remettre en "non validé" car en attente
      validated_at = NULL,
      validated_by = NULL,
      updated_at = now()
    WHERE product_id = NEW.product_id;
    -- SUPPRIMÉ: AND validated = false

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '✅ [DRAFT] track_product_quantity_updated: % alertes mises à jour pour produit % (qty=%)',
      v_updated_count, NEW.product_id, v_total_quantity;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION track_product_quantity_updated_in_draft() IS
'Trigger AFTER UPDATE OF quantity sur purchase_order_items.
Met à jour stock_alert_tracking quand la quantité change dans une PO brouillon.
FIX 2025-11-28: Suppression condition "validated = false".
Migration: 20251128_011';

-- ============================================================================
-- PARTIE 3 : Corriger les données existantes
-- ============================================================================

-- Mettre à jour les alertes pour les PO brouillon existantes
DO $$
DECLARE
  v_item RECORD;
  v_updated_count INTEGER := 0;
BEGIN
  -- Pour chaque item dans une PO brouillon
  FOR v_item IN
    SELECT
      poi.product_id,
      po.id as po_id,
      po.po_number,
      SUM(poi.quantity) as total_qty
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE po.status = 'draft'
    GROUP BY poi.product_id, po.id, po.po_number
  LOOP
    UPDATE stock_alert_tracking
    SET
      draft_order_id = v_item.po_id,
      draft_order_number = v_item.po_number,
      quantity_in_draft = v_item.total_qty,
      added_to_draft_at = COALESCE(added_to_draft_at, now()),
      validated = false,
      validated_at = NULL,
      validated_by = NULL,
      updated_at = now()
    WHERE product_id = v_item.product_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
      RAISE NOTICE '✅ Alerte corrigée pour produit % (PO %, qty=%)',
        v_item.product_id, v_item.po_number, v_item.total_qty;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  v_po_count INTEGER;
  v_alert_count INTEGER;
BEGIN
  -- Compter les PO brouillon
  SELECT COUNT(*) INTO v_po_count
  FROM purchase_orders
  WHERE status = 'draft';

  -- Compter les alertes avec draft_order_id rempli
  SELECT COUNT(*) INTO v_alert_count
  FROM stock_alert_tracking
  WHERE draft_order_id IS NOT NULL;

  RAISE NOTICE '📊 Vérification:';
  RAISE NOTICE '   - PO brouillon: %', v_po_count;
  RAISE NOTICE '   - Alertes avec draft: %', v_alert_count;
END $$;

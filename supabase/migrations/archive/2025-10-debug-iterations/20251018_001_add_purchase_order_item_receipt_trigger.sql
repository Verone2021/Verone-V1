-- =============================================
-- MIGRATION: Trigger Réceptions Partielles Purchase Orders
-- Date: 2025-10-18
-- =============================================
-- Problème: handle_purchase_order_forecast() ne gère PAS partially_received
-- Root Cause: LATERAL JOIN cassé (OLD.id = NEW.id → même table déjà updated)
-- Solution: Nouveau trigger sur purchase_order_items pour détecter quantity_received changes
--
-- Architecture Bi-Trigger:
-- - Trigger A (purchase_orders): Transitions status (confirmed, cancelled, received TOTAL)
-- - Trigger B (purchase_order_items): Réceptions partielles (quantity_received changes)
-- =============================================

-- =============================================
-- ÉTAPE 1: Créer fonction trigger pour items
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_purchase_order_item_receipt()
RETURNS TRIGGER AS $$
DECLARE
  v_po_status purchase_order_status;
  v_po_number TEXT;
  v_stock_before INTEGER;
  v_qty_diff INTEGER;
BEGIN
  -- Calculer différence de quantité reçue
  v_qty_diff := COALESCE(NEW.quantity_received, 0) - COALESCE(OLD.quantity_received, 0);

  -- Si pas de changement, sortir
  IF v_qty_diff = 0 THEN
    RETURN NEW;
  END IF;

  -- Récupérer status et numéro du purchase order parent
  SELECT status, po_number INTO v_po_status, v_po_number
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  -- Vérifier que le PO est dans un état autorisant les réceptions
  IF v_po_status NOT IN ('partially_received', 'received') THEN
    RAISE EXCEPTION 'Cannot update quantity_received: Purchase Order % status is % (must be partially_received or received)',
      v_po_number, v_po_status;
  END IF;

  -- =============================================
  -- CAS 1: Première réception (OLD.quantity_received = 0)
  -- =============================================
  IF COALESCE(OLD.quantity_received, 0) = 0 THEN
    -- Retirer prévisionnel correspondant à la quantité reçue
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
      performed_by,
      purchase_order_item_id
    ) VALUES (
      NEW.product_id,
      'OUT',
      -v_qty_diff, -- Retirer prévisionnel
      0,
      0,
      'purchase_order',
      NEW.purchase_order_id,
      'Annulation prévisionnel partiel - Réception ' || v_qty_diff || ' unités - PO ' || v_po_number,
      'purchase_reception',
      true,  -- Affecte forecast
      'in',
      (SELECT received_by FROM purchase_orders WHERE id = NEW.purchase_order_id),
      NEW.id
    );

    -- Récupérer stock réel avant mouvement
    SELECT COALESCE(stock_real, stock_quantity, 0) INTO v_stock_before
    FROM products
    WHERE id = NEW.product_id;

    -- Ajouter au stock réel
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
      performed_by,
      purchase_order_item_id
    ) VALUES (
      NEW.product_id,
      'IN',
      v_qty_diff,
      v_stock_before,
      v_stock_before + v_qty_diff,
      'purchase_order',
      NEW.purchase_order_id,
      'Réception partielle - ' || v_qty_diff || ' unités - PO ' || v_po_number,
      'purchase_reception',
      false, -- Stock réel
      null,
      (SELECT received_by FROM purchase_orders WHERE id = NEW.purchase_order_id),
      NEW.id
    );

  -- =============================================
  -- CAS 2: Réception supplémentaire (OLD.quantity_received > 0)
  -- =============================================
  ELSE
    -- Retirer prévisionnel supplémentaire
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
      performed_by,
      purchase_order_item_id
    ) VALUES (
      NEW.product_id,
      'OUT',
      -v_qty_diff,
      0,
      0,
      'purchase_order',
      NEW.purchase_order_id,
      'Annulation prévisionnel supplémentaire - Réception +' || v_qty_diff || ' unités - PO ' || v_po_number,
      'purchase_reception',
      true,
      'in',
      (SELECT received_by FROM purchase_orders WHERE id = NEW.purchase_order_id),
      NEW.id
    );

    -- Récupérer stock réel avant mouvement
    SELECT COALESCE(stock_real, stock_quantity, 0) INTO v_stock_before
    FROM products
    WHERE id = NEW.product_id;

    -- Ajouter au stock réel
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
      performed_by,
      purchase_order_item_id
    ) VALUES (
      NEW.product_id,
      'IN',
      v_qty_diff,
      v_stock_before,
      v_stock_before + v_qty_diff,
      'purchase_order',
      NEW.purchase_order_id,
      'Réception supplémentaire - +' || v_qty_diff || ' unités - PO ' || v_po_number,
      'purchase_reception',
      false,
      null,
      (SELECT received_by FROM purchase_orders WHERE id = NEW.purchase_order_id),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ÉTAPE 2: Créer trigger sur purchase_order_items
-- =============================================

DROP TRIGGER IF EXISTS trigger_purchase_order_item_receipt ON purchase_order_items;

CREATE TRIGGER trigger_purchase_order_item_receipt
  AFTER UPDATE OF quantity_received ON purchase_order_items
  FOR EACH ROW
  WHEN (NEW.quantity_received IS DISTINCT FROM OLD.quantity_received)
  EXECUTE FUNCTION handle_purchase_order_item_receipt();

-- =============================================
-- ÉTAPE 3: Commenter fonction
-- =============================================

COMMENT ON FUNCTION handle_purchase_order_item_receipt() IS
'Gère les mouvements stock lors des réceptions partielles purchase_order_items.
Créé: 2025-10-18
Architecture Bi-Trigger:
- Trigger A (purchase_orders): Transitions status globales (confirmed, cancelled, received)
- Trigger B (purchase_order_items): Réceptions partielles item par item
Workflow:
- Détecte changements quantity_received (OLD vs NEW)
- Vérifie PO status (must be partially_received ou received)
- Cas 1 (première réception): OUT prévisionnel + IN réel
- Cas 2 (réception supplémentaire): OUT prévisionnel + IN réel
- Enregistre purchase_order_item_id pour traçabilité';

COMMENT ON TRIGGER trigger_purchase_order_item_receipt ON purchase_order_items IS
'Trigger AFTER UPDATE quantity_received sur purchase_order_items.
Auto-filtre via WHEN (NEW.quantity_received IS DISTINCT FROM OLD.quantity_received).
Créé: 2025-10-18
Appelle: handle_purchase_order_item_receipt()';

-- =============================================
-- ÉTAPE 4: Ajouter colonne purchase_order_item_id à stock_movements
-- =============================================

-- Vérifier si colonne existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements'
    AND column_name = 'purchase_order_item_id'
  ) THEN
    ALTER TABLE stock_movements
    ADD COLUMN purchase_order_item_id UUID REFERENCES purchase_order_items(id) ON DELETE SET NULL;

    COMMENT ON COLUMN stock_movements.purchase_order_item_id IS
    'Référence optionnelle vers purchase_order_item spécifique.
    Ajouté: 2025-10-18
    Utilité: Traçabilité réceptions partielles item par item';
  END IF;
END $$;

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251018_001 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction créée: handle_purchase_order_item_receipt()';
    RAISE NOTICE 'Trigger créé: trigger_purchase_order_item_receipt';
    RAISE NOTICE 'Colonne ajoutée: stock_movements.purchase_order_item_id';
    RAISE NOTICE '';
    RAISE NOTICE 'Architecture Bi-Trigger:';
    RAISE NOTICE '  - Trigger A (purchase_orders): Status transitions';
    RAISE NOTICE '  - Trigger B (purchase_order_items): Partial receipts ✅ NOUVEAU';
    RAISE NOTICE '';
    RAISE NOTICE 'Fix Root Cause:';
    RAISE NOTICE '  - AVANT: LATERAL JOIN cassé (OLD.id = NEW.id)';
    RAISE NOTICE '  - APRÈS: Trigger direct sur items → accès OLD.quantity_received';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test Case:';
    RAISE NOTICE '  UPDATE purchase_order_items SET quantity_received = 1';
    RAISE NOTICE '  WHERE purchase_order_id = ''52bf7156-ff00-46d4-97ff-383d5fb70f47'';';
    RAISE NOTICE '  Attendu: 2 mouvements (OUT -1 forecast, IN +1 real) ✅';
    RAISE NOTICE '========================================';
END $$;

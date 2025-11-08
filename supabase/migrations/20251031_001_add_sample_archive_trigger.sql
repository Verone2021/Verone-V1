-- =====================================================================
-- Migration: Sample Archive Trigger
-- Description: Empêche l'archivage des échantillons si PO validée
--              Recalcule automatiquement les totaux du PO lors archivage
-- Date: 2025-10-31
-- =====================================================================

-- =====================================================================
-- FUNCTION: check_sample_archive_allowed
-- =====================================================================
-- Vérifie les conditions d'archivage des échantillons:
-- 1. Archive autorisé UNIQUEMENT si PO status = 'draft'
-- 2. Recalcule automatiquement total_ht et total_ttc du PO
-- 3. Lève exception si tentative d'archivage sur PO validée

CREATE OR REPLACE FUNCTION check_sample_archive_allowed()
RETURNS TRIGGER AS $$
DECLARE
  v_po_status purchase_order_status;
  v_item_amount_ht NUMERIC;
BEGIN
  -- ===================================================================
  -- CAS 1: Archivage (archived_at: NULL → NOT NULL)
  -- ===================================================================
  IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN

    -- Récupérer le statut du PO associé
    SELECT status INTO v_po_status
    FROM purchase_orders
    WHERE id = OLD.purchase_order_id;

    -- Bloquer l'archivage si PO déjà validée (status != 'draft')
    IF v_po_status IS NOT NULL AND v_po_status != 'draft' THEN
      RAISE EXCEPTION 'Impossible d''archiver l''échantillon : la commande achat est déjà validée (statut: %)', v_po_status
        USING HINT = 'Seules les commandes au statut "draft" peuvent être modifiées';
    END IF;

    -- Calculer le montant HT de l'item à soustraire
    v_item_amount_ht := OLD.quantity * OLD.unit_price_ht;

    -- Recalculer les totaux du PO (soustraire l'item archivé)
    UPDATE purchase_orders
    SET
      total_ht = GREATEST(total_ht - v_item_amount_ht, 0),
      total_ttc = GREATEST(total_ht - v_item_amount_ht, 0) * 1.20,
      updated_at = NOW()
    WHERE id = OLD.purchase_order_id;

    -- Log l'opération
    RAISE NOTICE 'Échantillon archivé: item_id=%, po_id=%, montant_ht=%',
      OLD.id, OLD.purchase_order_id, v_item_amount_ht;

  END IF;

  -- ===================================================================
  -- CAS 2: Réactivation (archived_at: NOT NULL → NULL)
  -- ===================================================================
  -- Note: La réinsertion dans le PO se fera via fonction dédiée
  -- (pas de recalcul automatique ici pour éviter doublons)

  IF NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL THEN
    RAISE NOTICE 'Échantillon réactivé: item_id=%, po_id=%',
      OLD.id, OLD.purchase_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGER: trigger_check_sample_archive
-- =====================================================================
-- Appliqué sur purchase_order_items BEFORE UPDATE
-- Déclenché uniquement si archived_at change

DROP TRIGGER IF EXISTS trigger_check_sample_archive ON purchase_order_items;

CREATE TRIGGER trigger_check_sample_archive
  BEFORE UPDATE OF archived_at
  ON purchase_order_items
  FOR EACH ROW
  WHEN (OLD.archived_at IS DISTINCT FROM NEW.archived_at)
  EXECUTE FUNCTION check_sample_archive_allowed();

-- =====================================================================
-- COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON FUNCTION check_sample_archive_allowed() IS
  'Trigger function: Empêche archivage échantillon si PO validée, recalcule totaux PO automatiquement';

COMMENT ON TRIGGER trigger_check_sample_archive ON purchase_order_items IS
  'Déclenché avant UPDATE sur archived_at pour valider archivage échantillon';

-- =====================================================================
-- TESTS VALIDATION
-- =====================================================================
-- TEST 1: Archivage autorisé (PO draft)
-- TEST 2: Archivage bloqué (PO confirmed/sent/etc.)
-- TEST 3: Réactivation autorisée (toujours OK)
-- TEST 4: Recalcul totaux PO correct

-- Exemple test (à exécuter manuellement ou via script test):
/*
-- Setup test data
INSERT INTO purchase_orders (id, supplier_id, status, total_ht, total_ttc)
VALUES ('test-po-1', 'supplier-1', 'draft', 100, 120);

INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price_ht, sample_type)
VALUES ('test-item-1', 'test-po-1', 'product-1', 1, 50, 'customer');

-- TEST 1: Archive sur PO draft → OK
UPDATE purchase_order_items
SET archived_at = NOW()
WHERE id = 'test-item-1';
-- ✅ Expected: Success, PO total_ht = 50, total_ttc = 60

-- TEST 2: Archive sur PO validated → BLOCKED
UPDATE purchase_orders SET status = 'confirmed' WHERE id = 'test-po-1';
UPDATE purchase_order_items
SET archived_at = NOW()
WHERE id = 'test-item-1';
-- ✅ Expected: EXCEPTION "Impossible d'archiver..."

-- Cleanup
DELETE FROM purchase_order_items WHERE id = 'test-item-1';
DELETE FROM purchase_orders WHERE id = 'test-po-1';
*/

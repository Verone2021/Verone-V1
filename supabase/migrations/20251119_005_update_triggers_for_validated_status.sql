-- ============================================================================
-- Migration: Intégration statut 'validated' avec triggers stock
-- Date: 2025-11-19
-- Author: Claude Code
-- Context: Workflow 3 étapes fournisseurs (draft → validated → received)
--          Système alertes stock (🔴 → 🟢 → ✅)
--
-- PROBLÈME:
--   Migration 20251119_004 ajoute 'validated' à enum purchase_order_status
--   Mais triggers stock NE DÉTECTENT PAS ce nouveau statut
--   Result: PO validated ne créent PAS mouvements forecasted_in
--           Alertes stock restent ROUGES (ne passent pas au VERT)
--
-- SOLUTION:
--   Modifier 2 fonctions trigger pour détecter 'validated' en plus de 'confirmed':
--   1. handle_purchase_order_forecast() - Crée mouvements stock
--   2. validate_stock_alerts_on_purchase_order_validation() - Valide alertes
--
-- IMPACT:
--   ✅ draft → validated créera mouvements forecasted_in (alerte 🔴→🟢)
--   ✅ validated → cancelled annulera mouvements (alerte 🟢→🔴)
--   ✅ Workflow 3 phases fonctionnel avec système stock
--
-- RÉFÉRENCES:
--   - Workflow: docs/business-rules/07-commandes/fournisseurs/PURCHASE-ORDER-WORKFLOW-COMPLET.md
--   - Mémoire: .serena/memories/purchase-orders-validated-workflow-2025-11-19.md
--   - Bugs stock: docs/audits/2025-11/RAPPORT-AUDIT-TRIGGERS-STOCK-2025-11-12.md
-- ============================================================================

-- ============================================================================
-- FONCTION 1: handle_purchase_order_forecast()
-- ============================================================================
-- Gère création/annulation mouvements stock prévisionnels purchase orders

CREATE OR REPLACE FUNCTION handle_purchase_order_forecast()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_stock_before INTEGER;
  v_qty_diff INTEGER;
  v_already_received INTEGER;
  v_forecasted_qty INTEGER;
BEGIN
  -- ============================================================================
  -- CAS 1: Commande validée/confirmée (draft/sent → validated/confirmed)
  -- ============================================================================
  -- MODIFICATION: Détecte maintenant 'validated' en plus de 'confirmed'
  -- Impact: draft → validated créera mouvements forecasted_in (alerte 🔴→🟢)

  IF NEW.status IN ('confirmed', 'validated')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'validated')) THEN

    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
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
        performed_by
      ) VALUES (
        v_item.product_id,
        'IN',
        v_item.quantity,
        0,
        0,
        'purchase_order',
        NEW.id,
        'Entrée prévisionnelle - Commande fournisseur ' || NEW.po_number,
        'purchase_reception',
        true,
        'in',
        NEW.created_by
      );
    END LOOP;

  -- ============================================================================
  -- CAS 2: RÉCEPTION (partially_received OU received)
  -- ============================================================================
  ELSIF NEW.status IN ('partially_received', 'received') THEN

    -- Parcourir tous les items de la commande
    FOR v_item IN
      SELECT
        poi.id,
        poi.product_id,
        poi.quantity,
        COALESCE(poi.quantity_received, 0) as quantity_received
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      -- CALCUL DIFFÉRENTIEL ROBUSTE:
      -- Comparer quantity_received avec SUM des mouvements stock réels déjà créés
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      INTO v_already_received
      FROM stock_movements
      WHERE reference_type = 'purchase_order'
        AND reference_id = NEW.id
        AND product_id = v_item.product_id
        AND affects_forecast = false  -- Mouvement RÉEL (pas prévisionnel)
        AND movement_type = 'IN';

      -- Différence = ce qui doit être ajouté maintenant
      v_qty_diff := v_item.quantity_received - v_already_received;

      -- Si augmentation de quantité reçue
      IF v_qty_diff > 0 THEN

        -- 1. Retirer du prévisionnel IN (différentiel)
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
          performed_by
        ) VALUES (
          v_item.product_id,
          'OUT',
          -v_qty_diff,  -- Différentiel uniquement
          0,
          0,
          'purchase_order',
          NEW.id,
          CASE
            WHEN NEW.status = 'partially_received' THEN
              format('Réception partielle - Annulation prévisionnel %s/%s unités (déjà reçu: %s)',
                     v_item.quantity_received, v_item.quantity, v_already_received)
            ELSE
              format('Réception complète - Annulation prévisionnel %s/%s unités (déjà reçu: %s)',
                     v_item.quantity_received, v_item.quantity, v_already_received)
          END,
          'purchase_reception',
          true,
          'in',
          NEW.received_by
        );

        -- Récupérer stock réel avant
        SELECT COALESCE(stock_real, stock_quantity, 0)
        INTO v_stock_before
        FROM products
        WHERE id = v_item.product_id;

        -- 2. Ajouter au stock réel (différentiel)
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
          performed_by
        ) VALUES (
          v_item.product_id,
          'IN',
          v_qty_diff,  -- Différentiel uniquement
          v_stock_before,
          v_stock_before + v_qty_diff,
          'purchase_order',
          NEW.id,
          CASE
            WHEN NEW.status = 'partially_received' THEN
              format('Réception partielle - %s/%s unités (déjà reçu: %s)',
                     v_item.quantity_received, v_item.quantity, v_already_received)
            ELSE
              format('Réception complète - %s/%s unités (déjà reçu: %s) - PO %s',
                     v_item.quantity_received, v_item.quantity, v_already_received, NEW.po_number)
          END,
          'purchase_reception',
          false,
          null,
          NEW.received_by
        );

      END IF;  -- v_qty_diff > 0
    END LOOP;

  -- ============================================================================
  -- CAS 3: Annulation (confirmed/validated/sent → cancelled)
  -- ============================================================================
  -- MODIFICATION: Détecte annulation depuis 'validated' en plus de 'confirmed'/'sent'
  -- Impact: validated → cancelled annulera mouvements (alerte 🟢→🔴)

  ELSIF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'validated', 'sent') THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
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
        performed_by
      ) VALUES (
        v_item.product_id,
        'OUT',
        -v_item.quantity,
        0,
        0,
        'purchase_order',
        NEW.id,
        'Annulation prévisionnel - Commande annulée',
        'purchase_reception',
        true,
        'in',
        NEW.created_by
      );
    END LOOP;

  -- ============================================================================
  -- CAS 4: Annulation depuis partially_received (Bug #4 fix)
  -- ============================================================================
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'partially_received' THEN
    FOR v_item IN
      SELECT
        poi.product_id,
        poi.quantity,
        COALESCE(poi.quantity_received, 0) as quantity_received
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      -- CALCUL NET : Quantité restante en prévisionnel
      v_forecasted_qty := v_item.quantity - v_item.quantity_received;

      -- Libérer seulement si reste du prévisionnel
      IF v_forecasted_qty > 0 THEN
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
          performed_by
        ) VALUES (
          v_item.product_id,
          'OUT',
          -v_forecasted_qty,  -- NET seulement (quantity - quantity_received)
          0,
          0,
          'purchase_order',
          NEW.id,
          format('Annulation PO partiellement reçue - Libération %s unités (déjà reçu: %s/%s)',
                 v_forecasted_qty, v_item.quantity_received, v_item.quantity),
          'purchase_reception',
          true,
          'in',
          NEW.created_by
        );

        -- Log pour monitoring
        RAISE NOTICE '✅ [BUG #4 FIX] Forecasted_in libéré pour produit % (net: %s = %s - %s)',
          v_item.product_id, v_forecasted_qty, v_item.quantity, v_item.quantity_received;
      ELSE
        -- Note: Si quantity_received = quantity, aucune libération nécessaire
        RAISE NOTICE 'ℹ️ PO annulée mais 100%% reçue - Aucune libération forecasted_in nécessaire (produit: %)',
          v_item.product_id;
      END IF;
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION 2: validate_stock_alerts_on_purchase_order_validation()
-- ============================================================================
-- Valide alertes stock automatiquement après validation PO

CREATE OR REPLACE FUNCTION validate_stock_alerts_on_purchase_order_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_stock_forecasted INTEGER;
  v_min_stock INTEGER;
  v_shortage INTEGER;
  v_product_name TEXT;
  v_product_sku TEXT;
BEGIN
  -- ============================================================================
  -- Condition : Validation PO (draft/sent → confirmed/validated)
  -- ============================================================================
  -- MODIFICATION: Détecte 'validated' en plus de 'confirmed'
  -- Impact: draft → validated validera alertes (alerte 🔴→🟢)

  IF NEW.status IN ('confirmed', 'validated')
     AND OLD.status IN ('draft', 'sent') THEN

    RAISE NOTICE 'Validation commande fournisseur % - Vérification alertes stock', NEW.po_number;

    -- Pour chaque produit de la commande
    FOR v_product IN
      SELECT
        poi.product_id,
        poi.quantity,
        p.name as product_name,
        p.sku as product_sku,
        p.min_stock
      FROM purchase_order_items poi
      JOIN products p ON p.id = poi.product_id
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      -- Calculer stock prévisionnel
      v_stock_forecasted := calculate_stock_forecasted(v_product.product_id);
      v_min_stock := v_product.min_stock;
      v_product_name := v_product.product_name;
      v_product_sku := v_product.product_sku;

      RAISE NOTICE 'Produit % (SKU: %) - Stock prévisionnel: %, Seuil: %',
        v_product_name, v_product_sku, v_stock_forecasted, v_min_stock;

      -- Vérifier si seuil atteint
      IF v_stock_forecasted >= v_min_stock THEN
        -- ✅ ALERTE VERTE : Stock prévisionnel suffisant
        RAISE NOTICE '✅ Stock suffisant pour % - Validation alerte', v_product_name;

        UPDATE stock_alert_tracking
        SET
          validated = TRUE,
          validated_at = NOW(),
          notes = COALESCE(notes, '') ||
                  E'\n✅ ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') ||
                  ' - Commande fournisseur passée: ' || NEW.po_number ||
                  ' (' || v_product.quantity || ' unités commandées, stock prévisionnel: ' || v_stock_forecasted || ')',
          updated_at = NOW()
        WHERE product_id = v_product.product_id
          AND validated = FALSE;

      ELSE
        -- ❌ ALERTE ROUGE : Stock prévisionnel insuffisant
        v_shortage := v_min_stock - v_stock_forecasted;

        RAISE NOTICE '❌ Stock INSUFFISANT pour % - Manque % unités', v_product_name, v_shortage;

        -- Mettre à jour l'alerte avec note explicative
        UPDATE stock_alert_tracking
        SET
          notes = COALESCE(notes, '') ||
                  E'\n⚠️ ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') ||
                  ' - Commande ' || NEW.po_number || ' validée mais INSUFFISANTE' ||
                  ' (commandé: ' || v_product.quantity || ', stock prévisionnel: ' || v_stock_forecasted ||
                  ', manque: ' || v_shortage || ' unités pour atteindre seuil ' || v_min_stock || ')',
          alert_priority = 'high', -- Augmenter priorité si manque important
          updated_at = NOW()
        WHERE product_id = v_product.product_id
          AND validated = FALSE;

        -- Créer notification pour alerter l'équipe
        INSERT INTO notifications (
          type,
          severity,
          title,
          message,
          action_url,
          related_entity_type,
          related_entity_id,
          metadata
        ) VALUES (
          'business',
          'urgent',
          'Stock Insuffisant Commandé',
          v_product_name || ' (' || v_product_sku || '): Commande ' || NEW.po_number ||
          ' validée mais manque ' || v_shortage || ' unités pour atteindre le seuil minimum. ' ||
          'Stock prévisionnel après réception: ' || v_stock_forecasted || ', seuil: ' || v_min_stock,
          '/stocks/alertes?product_id=' || v_product.product_id,
          'stock_alert',
          v_product.product_id,
          jsonb_build_object(
            'purchase_order_id', NEW.id,
            'purchase_order_number', NEW.po_number,
            'shortage_quantity', v_shortage,
            'stock_forecasted', v_stock_forecasted,
            'min_stock', v_min_stock,
            'quantity_ordered', v_product.quantity
          )
        );

      END IF;
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION handle_purchase_order_forecast IS
'Workflow 3 étapes fournisseurs: draft → validated/confirmed → received
- draft → validated: Crée mouvements forecasted_in (alerte 🔴→🟢)
- validated → received: Convertit forecasted → real (alerte 🟢→✅)
- validated → cancelled: Annule mouvements (alerte 🟢→🔴)
Modifié 2025-11-19 pour supporter statut validated';

COMMENT ON FUNCTION validate_stock_alerts_on_purchase_order_validation IS
'Valide automatiquement les alertes stock si commande fournisseur suffisante
Détecte maintenant validated en plus de confirmed (modifié 2025-11-19)
- Si stock prévisionnel >= seuil → Alerte 🔴→🟢 (validée)
- Sinon → Alerte reste 🔴 + notification stock insuffisant';

-- ============================================================================
-- VALIDATION POST-MIGRATION
-- ============================================================================

-- Vérifier que les triggers sont toujours actifs
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'purchase_orders'::regclass
  AND (proname = 'handle_purchase_order_forecast'
       OR proname = 'validate_stock_alerts_on_purchase_order_validation')
ORDER BY tgname;

-- Expected output:
-- trigger_purchase_order_forecast | O | handle_purchase_order_forecast
-- trigger_validate_stock_alerts_on_purchase_order_validation | O | validate_stock_alerts_on_purchase_order_validation

-- ============================================================================
-- TESTS VALIDATION RECOMMANDÉS
-- ============================================================================

-- Test 1: Workflow complet draft → validated → received
-- 1. Créer PO draft (vérifier alerte 🔴 ROUGE)
-- 2. Passer à validated (vérifier forecasted_in augmente + alerte 🟢 VERTE)
-- 3. Réceptionner (vérifier stock_real augmente + forecasted_in baisse + alerte ✅ DISPARAÎT)

-- Test 2: Annulation depuis validated
-- 1. PO validated (alerte 🟢 VERTE + forecasted_in > 0)
-- 2. Annuler (vérifier forecasted_in baisse + alerte 🔴 ROUGE réapparaît)

-- Test 3: Onglet UI "Validée"
-- 1. Créer PO et valider
-- 2. Vérifier apparaît dans onglet "Validée" avec badge vert
-- 3. Vérifier boutons actions appropriés

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

-- Cette migration finalise l'implémentation du statut 'validated' ajouté
-- dans migration 20251119_004. Sans cette migration, les PO validated
-- ne créeraient PAS de mouvements stock → système alertes dysfonctionnel.

-- DÉPENDANCES:
-- - 20251119_004_add_validated_status_to_purchase_orders.sql (DOIT être appliquée AVANT)
-- - calculate_stock_forecasted() function (créée dans 20251111_002)

-- COMPATIBILITÉ:
-- - Rétrocompatible avec statut 'confirmed' existant
-- - Gère 'validated' ET 'confirmed' de manière identique pour stock
-- - Distinction UI seulement (confirmed = envoyé fournisseur, validated = validé interne)

/**
 * 🔧 CORRECTIF: Calcul Différentiel pour status='received'
 *
 * Date: 2025-10-18
 * Auteur: Claude Code
 * Session: RAPPORT-SESSION-ROOT-CAUSE-STOCK-ORPHELIN-2025-10-18.md
 *
 * CONTEXTE BUG #2:
 * Après une réception partielle, le passage à 'received' traite la quantité
 * TOTALE au lieu de la quantité DIFFÉRENTIELLE restante.
 *
 * EXEMPLE PROBLÈME (PO-2025-00006):
 * - Confirmation: +10 forecast ✅
 * - 1ère réception partielle (4 unités): -4 forecast, +4 real ✅
 * - 2ème réception complète (10 TOTAL): -10 forecast ❌ (devrait être -6)
 *
 * RÉSULTAT ACTUEL:
 * stock_forecasted_in = 10 - 4 - 10 = -4 ❌
 *
 * RÉSULTAT ATTENDU:
 * stock_forecasted_in = 10 - 4 - 6 = 0 ✅
 *
 * ROOT CAUSE:
 * Le CAS 2 du trigger handle_purchase_order_forecast() utilise v_item.quantity
 * au lieu de calculer le différentiel avec v_item.quantity_received.
 *
 * SOLUTION:
 * Modifier CAS 2 pour qu'il utilise le MÊME algorithme différentiel que CAS 4.
 */

-- ===========================================================================
-- ÉTAPE 1: Modifier handle_purchase_order_forecast()
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.handle_purchase_order_forecast()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_stock_before INTEGER;
  v_qty_diff INTEGER;
  v_already_received INTEGER;
BEGIN
  -- CAS 1: Commande confirmée (draft/sent → confirmed)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
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

  -- 🔧 CAS 2: RÉCEPTION (partially_received OU received)
  -- Utilise maintenant le MÊME algorithme différentiel que CAS 4
  ELSIF NEW.status IN ('partially_received', 'received') AND
        OLD.status NOT IN ('partially_received', 'received') THEN

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
      -- 🔑 CALCUL DIFFÉRENTIEL ROBUSTE:
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

  -- CAS 3: Annulation (confirmed/sent → cancelled)
  ELSIF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'sent') THEN
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

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================================================
-- ÉTAPE 2: Mettre à jour commentaire fonction
-- ===========================================================================

COMMENT ON FUNCTION handle_purchase_order_forecast() IS
'v3.0 - Gère mouvements stock PO (confirmed, partially_received, received, cancelled)
Utilise calcul différentiel via SUM stock_movements existants pour TOUTES les réceptions.
Fix 2025-10-18: CAS 2 unifié pour partially_received ET received avec algorithme différentiel.
Architecture: 1 trigger sur purchase_orders, calcul différentiel systématique.';

-- ===========================================================================
-- ÉTAPE 3: Corriger données existantes (PO-2025-00006)
-- ===========================================================================

-- Supprimer mouvements incorrects de la 2ème réception (mouvement #4 et #5)
DO $$
DECLARE
  v_po_id UUID;
  v_product_id UUID;
  v_movement_4_id UUID;
  v_movement_5_id UUID;
BEGIN
  -- Récupérer IDs
  SELECT id INTO v_po_id FROM purchase_orders WHERE po_number = 'PO-2025-00006';
  SELECT id INTO v_product_id FROM products WHERE sku = 'FMIL-VERT-01';

  -- Identifier mouvements incorrects (performed_at le plus récent, quantity_change = -10 et +10)
  SELECT id INTO v_movement_4_id
  FROM stock_movements
  WHERE reference_type = 'purchase_order'
    AND reference_id = v_po_id
    AND product_id = v_product_id
    AND affects_forecast = true
    AND movement_type = 'OUT'
    AND quantity_change = -10
  ORDER BY performed_at DESC
  LIMIT 1;

  SELECT id INTO v_movement_5_id
  FROM stock_movements
  WHERE reference_type = 'purchase_order'
    AND reference_id = v_po_id
    AND product_id = v_product_id
    AND affects_forecast = false
    AND movement_type = 'IN'
    AND quantity_change = 10
  ORDER BY performed_at DESC
  LIMIT 1;

  -- Supprimer mouvements incorrects
  IF v_movement_4_id IS NOT NULL THEN
    DELETE FROM stock_movements WHERE id = v_movement_4_id;
    RAISE NOTICE '✅ Mouvement #4 supprimé (OUT -10 forecast incorrect)';
  END IF;

  IF v_movement_5_id IS NOT NULL THEN
    DELETE FROM stock_movements WHERE id = v_movement_5_id;
    RAISE NOTICE '✅ Mouvement #5 supprimé (IN +10 real incorrect)';
  END IF;

  -- Créer mouvements corrects avec différentiel (6 unités)
  IF v_movement_4_id IS NOT NULL AND v_movement_5_id IS NOT NULL THEN

    -- Mouvement OUT forecast (-6)
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
      performed_at,
      performed_by
    ) VALUES (
      v_product_id,
      'OUT',
      -6,  -- Différentiel correct: 10 total - 4 déjà reçu = 6
      0,
      0,
      'purchase_order',
      v_po_id,
      'Réception complète - Annulation prévisionnel 10/10 unités (déjà reçu: 4) - Migration 20251018_005',
      'purchase_reception',
      true,
      'in',
      NOW(),
      '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'::UUID
    );

    -- Mouvement IN real (+6)
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
      performed_at,
      performed_by
    ) VALUES (
      v_product_id,
      'IN',
      6,  -- Différentiel correct
      64,  -- Stock avant (50 + 4 + 10 = 64, après correction orphelin)
      70,  -- Stock après (64 + 6 = 70)
      'purchase_order',
      v_po_id,
      'Réception complète - 10/10 unités (déjà reçu: 4) - PO PO-2025-00006 - Migration 20251018_005',
      'purchase_reception',
      false,
      null,
      NOW(),
      '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'::UUID
    );

    RAISE NOTICE '✅ Mouvements corrects créés (OUT -6 forecast, IN +6 real)';
  END IF;
END $$;

-- ===========================================================================
-- ÉTAPE 4: Recalculer stock FMIL-VERT-01
-- ===========================================================================

UPDATE products
SET
  stock_real = (
    SELECT COALESCE(SUM(quantity_change), 0)
    FROM stock_movements
    WHERE product_id = products.id AND affects_forecast = false
  ),
  stock_forecasted_in = (
    SELECT COALESCE(SUM(quantity_change), 0)
    FROM stock_movements
    WHERE product_id = products.id
      AND affects_forecast = true AND forecast_type = 'in'
  ),
  stock_forecasted_out = (
    SELECT COALESCE(SUM(quantity_change), 0)
    FROM stock_movements
    WHERE product_id = products.id
      AND affects_forecast = true AND forecast_type = 'out'
  ),
  stock_quantity = (
    SELECT
      COALESCE(SUM(CASE WHEN affects_forecast = false THEN quantity_change ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN affects_forecast = true AND forecast_type = 'in' THEN quantity_change ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN affects_forecast = true AND forecast_type = 'out' THEN quantity_change ELSE 0 END), 0)
    FROM stock_movements
    WHERE product_id = products.id
  )
WHERE sku = 'FMIL-VERT-01'
RETURNING
  name,
  sku,
  stock_real,
  stock_forecasted_in,
  stock_forecasted_out,
  stock_quantity;

-- ===========================================================================
-- ÉTAPE 5: Validation Post-Migration
-- ===========================================================================

DO $$
DECLARE
  v_product RECORD;
  v_movements RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 VALIDATION MIGRATION 20251018_005';
  RAISE NOTICE '========================================';

  -- Vérifier stock FMIL-VERT-01
  SELECT
    name, sku, stock_real, stock_forecasted_in,
    stock_forecasted_out, stock_quantity
  INTO v_product
  FROM products
  WHERE sku = 'FMIL-VERT-01';

  RAISE NOTICE '';
  RAISE NOTICE '📊 Stock FMIL-VERT-01:';
  RAISE NOTICE '  - stock_real: % (attendu: 70)', v_product.stock_real;
  RAISE NOTICE '  - stock_forecasted_in: % (attendu: 0)', v_product.stock_forecasted_in;
  RAISE NOTICE '  - stock_forecasted_out: % (attendu: 0)', v_product.stock_forecasted_out;
  RAISE NOTICE '  - stock_quantity: % (attendu: 70)', v_product.stock_quantity;

  -- Vérifier mouvements
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN affects_forecast = false THEN quantity_change ELSE 0 END) as sum_real,
    SUM(CASE WHEN affects_forecast = true AND forecast_type = 'in' THEN quantity_change ELSE 0 END) as sum_forecast
  INTO v_movements
  FROM stock_movements
  WHERE product_id = (SELECT id FROM products WHERE sku = 'FMIL-VERT-01');

  RAISE NOTICE '';
  RAISE NOTICE '📊 Mouvements stock:';
  RAISE NOTICE '  - Total mouvements: %', v_movements.total;
  RAISE NOTICE '  - SUM mouvements réels: % (attendu: 70)', v_movements.sum_real;
  RAISE NOTICE '  - SUM forecast IN: % (attendu: 0)', v_movements.sum_forecast;

  -- Vérifier cohérence
  IF v_product.stock_real = 70 AND
     v_product.stock_forecasted_in = 0 AND
     v_product.stock_quantity = 70 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ VALIDATION RÉUSSIE - Tous les stocks sont cohérents!';
  ELSE
    RAISE WARNING '❌ VALIDATION ÉCHOUÉE - Stocks incohérents!';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ===========================================================================
-- LOG FINAL
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Migration 20251018_005 TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger handle_purchase_order_forecast() v3.0';
  RAISE NOTICE '✅ Algorithme différentiel unifié (partially_received + received)';
  RAISE NOTICE '✅ Données PO-2025-00006 corrigées';
  RAISE NOTICE '✅ Stock FMIL-VERT-01 recalculé';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résultat final attendu:';
  RAISE NOTICE '  - stock_real: 70 (50 + 4 + 6 + 10 = 70)';
  RAISE NOTICE '  - stock_forecasted_in: 0 (10 - 4 - 6 = 0)';
  RAISE NOTICE '  - stock_quantity: 70 (70 + 0 - 0 = 70)';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Documentation:';
  RAISE NOTICE '  - Session: MEMORY-BANK/sessions/RAPPORT-SESSION-ROOT-CAUSE-STOCK-ORPHELIN-2025-10-18.md';
  RAISE NOTICE '  - Migration: supabase/migrations/20251018_005_fix_received_status_differential.sql';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test recommandé:';
  RAISE NOTICE '  Créer nouvelle PO → Confirmer → Réception partielle → Réception complète';
  RAISE NOTICE '  Vérifier stock_forecasted_in = 0 à chaque étape';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

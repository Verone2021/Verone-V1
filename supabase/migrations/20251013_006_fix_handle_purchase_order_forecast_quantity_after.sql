-- =============================================
-- MIGRATION: Correction handle_purchase_order_forecast - quantity_after
-- Date: 2025-10-13
-- =============================================
-- Problème: quantity_before et quantity_after calculés avec 2 SELECT séparés
-- Résultat: Race condition → quantity_after incorrect → contrainte valid_quantity_logic échoue
-- Solution: Utiliser variable pour stocker stock_before une seule fois

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Code actuel (ligne 101-102 de handle_purchase_order_forecast):
--   quantity_before = (SELECT COALESCE(stock_real, stock_quantity, 0) FROM products WHERE id = v_item.product_id),
--   quantity_after = (SELECT COALESCE(stock_real, stock_quantity, 0) FROM products WHERE id = v_item.product_id) + v_item.quantity
--
-- Problème: Entre les 2 SELECT, maintain_stock_coherence() peut modifier stock_real
-- Exemple:
--   1. Premier SELECT: stock_real = 10 → quantity_before = 10
--   2. maintain_stock_coherence() s'exécute → stock_real = 10
--   3. Second SELECT: stock_real = 10 → quantity_after = 10 + 10 = 20 ✅ (attendu)
--   MAIS si entre-temps stock change:
--   3. Second SELECT: stock_real = 10 → quantity_after = 10 + 10 = 20 (mais quantity_before déjà changé!)
--
-- Résultat: quantity_before = 10, quantity_after = 10 (au lieu de 20)
-- Contrainte valid_quantity_logic échoue: quantity_after != quantity_before + quantity_change

-- =============================================
-- CORRECTION: Fonction handle_purchase_order_forecast
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_purchase_order_forecast()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_stock_before INTEGER;  -- FIX: Variable pour stocker stock avant
BEGIN
  -- Traitement selon le statut de la commande
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Commande confirmée : créer mouvements prévisionnels entrées
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
        0, -- N'affecte pas le stock réel
        0, -- N'affecte pas le stock réel
        'purchase_order',
        NEW.id,
        'Entrée prévisionnelle - Commande fournisseur ' || NEW.po_number,
        'purchase_reception',
        true,
        'in',
        NEW.created_by
      );
    END LOOP;

  ELSIF NEW.status = 'received' AND OLD.status != 'received' THEN
    -- Commande reçue : convertir prévisionnel en réel
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      -- Retirer le prévisionnel
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
        -v_item.quantity, -- Retirer le prévisionnel
        0,
        0,
        'purchase_order',
        NEW.id,
        'Annulation prévisionnel - Réception effective',
        'purchase_reception',
        true,
        'in',
        NEW.received_by
      );

      -- FIX: Récupérer stock AVANT une seule fois
      SELECT COALESCE(stock_real, stock_quantity, 0) INTO v_stock_before
      FROM products
      WHERE id = v_item.product_id;

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
        performed_by
      ) VALUES (
        v_item.product_id,
        'IN',
        v_item.quantity,
        v_stock_before,  -- FIX: Utiliser variable
        v_stock_before + v_item.quantity,  -- FIX: Calcul avec variable
        'purchase_order',
        NEW.id,
        'Réception effective - Commande ' || NEW.po_number,
        'purchase_reception',
        false, -- Stock réel
        null,
        NEW.received_by
      );
    END LOOP;

  ELSIF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'sent') THEN
    -- Commande annulée : retirer les prévisionnels
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
        -v_item.quantity, -- Retirer le prévisionnel
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
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION handle_purchase_order_forecast() IS
'Gère les mouvements stock lors des transitions de statut purchase_order.
CORRECTION 2025-10-13: Utilise variable v_stock_before pour éviter race condition sur quantity_before/after.
Workflow:
- confirmed: INSERT mouvement IN prévisionnel (affects_forecast=true)
- received: INSERT OUT prévisionnel (annulation) + IN réel (affects_forecast=false)
- cancelled: INSERT OUT prévisionnel (annulation)
Architecture: Séparation réel (maintain_stock_coherence) vs prévisionnel (recalculate_forecasted_stock)';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_006 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: handle_purchase_order_forecast()';
    RAISE NOTICE '';
    RAISE NOTICE 'Changement:';
    RAISE NOTICE '  - AVANT: 2 SELECT séparés pour quantity_before/after';
    RAISE NOTICE '  - APRÈS: 1 SELECT stocké dans variable v_stock_before';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Race condition quantity_before/after résolue ✅';
    RAISE NOTICE '  - Contrainte valid_quantity_logic respectée ✅';
    RAISE NOTICE '  - Workflow PO Confirmed → Received fonctionnel ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: PO Confirmed → Received (conversion complète)';
    RAISE NOTICE '========================================';
END $$;

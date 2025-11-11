-- Migration: Validation alertes stock après validation commande fournisseur
-- Date: 2025-11-11
-- Description: Passer les alertes stock en VERT si commande fournisseur validée avec quantités suffisantes,
--              sinon créer notification ROUGE avec produits manquants

-- =====================================================
-- FONCTION: Calculer stock prévisionnel d'un produit
-- =====================================================
-- NOTE: Utilise les colonnes stock_forecasted_in/out déjà maintenues par maintain_stock_totals()

CREATE OR REPLACE FUNCTION calculate_stock_forecasted(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_stock_real INTEGER;
  v_stock_forecasted_in INTEGER;
  v_stock_forecasted_out INTEGER;
BEGIN
  -- Récupérer valeurs déjà calculées par maintain_stock_totals()
  SELECT
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out
  INTO
    v_stock_real,
    v_stock_forecasted_in,
    v_stock_forecasted_out
  FROM products
  WHERE id = p_product_id;

  -- Stock prévisionnel = stock_real + IN - OUT
  RETURN COALESCE(v_stock_real, 0) + COALESCE(v_stock_forecasted_in, 0) - COALESCE(v_stock_forecasted_out, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_stock_forecasted IS 'Retourne le stock prévisionnel (stock_real + stock_forecasted_in - stock_forecasted_out) depuis products';

-- =====================================================
-- FONCTION: Valider alertes stock après validation PO
-- =====================================================

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
  -- Condition : Validation PO (draft/sent → confirmed)
  IF NEW.status = 'confirmed' AND OLD.status IN ('draft', 'sent') THEN

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

COMMENT ON FUNCTION validate_stock_alerts_on_purchase_order_validation IS
  'Valide automatiquement les alertes stock si commande fournisseur suffisante, sinon crée notification produits manquants';

-- =====================================================
-- TRIGGER: Validation alertes après validation PO
-- =====================================================

DROP TRIGGER IF EXISTS trigger_validate_stock_alerts_on_purchase_order_validation ON purchase_orders;

CREATE TRIGGER trigger_validate_stock_alerts_on_purchase_order_validation
  AFTER UPDATE OF status ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_alerts_on_purchase_order_validation();

COMMENT ON TRIGGER trigger_validate_stock_alerts_on_purchase_order_validation ON purchase_orders IS
  'Déclenche la validation des alertes stock après validation d''une commande fournisseur (draft/sent → confirmed)';

-- =====================================================
-- NOTE: Revalidation alertes après réception
-- =====================================================
-- Le trigger existant sync_stock_alert_tracking gère déjà automatiquement
-- la recréation d'alertes après réception si le stock reste insuffisant.
-- Pas besoin de trigger supplémentaire.

-- =====================================================
-- INDEX: Optimisation performance
-- =====================================================
-- NOTE: Pas besoin d'index supplémentaires car la fonction calculate_stock_forecasted()
--       lit directement depuis products.stock_forecasted_in/out qui sont déjà indexées.

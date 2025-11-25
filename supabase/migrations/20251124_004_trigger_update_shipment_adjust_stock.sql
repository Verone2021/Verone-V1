-- Migration: Trigger UPDATE pour sales_order_shipments
-- Description: Ajuste automatiquement le stock réel quand on modifie la quantité d'une expédition
-- Date: 2025-11-24
-- Auteur: Claude Code

-- =====================================================
-- FONCTION: Gérer modification de quantité expédition
-- =====================================================
CREATE OR REPLACE FUNCTION handle_shipment_quantity_update()
RETURNS TRIGGER AS $$
DECLARE
    v_quantity_delta INTEGER;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Vérifier si la quantité a changé
    IF OLD.quantity_shipped = NEW.quantity_shipped THEN
        -- Pas de changement de quantité, ne rien faire
        RETURN NEW;
    END IF;

    -- Log pour debug
    RAISE NOTICE 'Modification expédition: shipment_id=%, product_id=%, old_qty=%, new_qty=%',
        NEW.id, NEW.product_id, OLD.quantity_shipped, NEW.quantity_shipped;

    -- Calculer le delta (négatif si augmentation car c'est une sortie, positif si diminution)
    v_quantity_delta := -(NEW.quantity_shipped - OLD.quantity_shipped);

    -- Récupérer le stock actuel
    SELECT stock_real INTO v_current_stock
    FROM products
    WHERE id = NEW.product_id;

    -- Calculer le nouveau stock
    v_new_stock := v_current_stock + v_quantity_delta;

    -- Vérifier que le stock ne devient pas négatif
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Stock ne peut pas devenir négatif: current=%, delta=%, new=%',
            v_current_stock, v_quantity_delta, v_new_stock;
    END IF;

    -- Mettre à jour le stock_real du produit
    UPDATE products
    SET
        stock_real = v_new_stock,
        updated_at = NOW()
    WHERE id = NEW.product_id;

    RAISE NOTICE 'Stock ajusté: % → % (delta: %)',
        v_current_stock, v_new_stock, v_quantity_delta;

    -- Mettre à jour le mouvement de stock associé
    UPDATE stock_movements
    SET
        quantity_change = quantity_change + v_quantity_delta,
        quantity_after = quantity_after + v_quantity_delta,
        notes = COALESCE(notes, '') || ' [Quantité modifiée: ' || OLD.quantity_shipped || ' → ' || NEW.quantity_shipped || ']',
        updated_at = NOW()
    WHERE reference_type = 'shipment'
      AND reference_id = NEW.id
      AND product_id = NEW.product_id;

    RAISE NOTICE 'Mouvement de stock mis à jour pour shipment_id=%', NEW.id;

    -- Permettre la mise à jour de continuer
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Avant mise à jour d'une expédition
-- =====================================================
DROP TRIGGER IF EXISTS trigger_before_update_shipment ON sales_order_shipments;

CREATE TRIGGER trigger_before_update_shipment
    BEFORE UPDATE ON sales_order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION handle_shipment_quantity_update();

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION handle_shipment_quantity_update() IS
'Ajuste automatiquement le stock réel et le mouvement de stock associé quand la quantité d''une expédition est modifiée.
Logique:
- Calcule le delta inversé (car sortie) : -(new_qty - old_qty)
- Stock réel += delta
- Met à jour le mouvement de stock correspondant
- Déclenche automatiquement le recalcul des alertes';

COMMENT ON TRIGGER trigger_before_update_shipment ON sales_order_shipments IS
'Déclenché AVANT la mise à jour d''une expédition pour ajuster le stock réel et le mouvement associé si la quantité change';

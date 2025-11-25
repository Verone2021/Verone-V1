-- Migration: Trigger UPDATE pour purchase_order_receptions
-- Description: Ajuste automatiquement le stock réel quand on modifie la quantité d'une réception
-- Date: 2025-11-24
-- Auteur: Claude Code

-- =====================================================
-- FONCTION: Gérer modification de quantité réception
-- =====================================================
CREATE OR REPLACE FUNCTION handle_reception_quantity_update()
RETURNS TRIGGER AS $$
DECLARE
    v_quantity_delta INTEGER;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Vérifier si la quantité a changé
    IF OLD.quantity_received = NEW.quantity_received THEN
        -- Pas de changement de quantité, ne rien faire
        RETURN NEW;
    END IF;

    -- Log pour debug
    RAISE NOTICE 'Modification réception: reception_id=%, product_id=%, old_qty=%, new_qty=%',
        NEW.id, NEW.product_id, OLD.quantity_received, NEW.quantity_received;

    -- Calculer le delta (positif si augmentation, négatif si diminution)
    v_quantity_delta := NEW.quantity_received - OLD.quantity_received;

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
        notes = COALESCE(notes, '') || ' [Quantité modifiée: ' || OLD.quantity_received || ' → ' || NEW.quantity_received || ']',
        updated_at = NOW()
    WHERE reference_type = 'reception'
      AND reference_id = NEW.id
      AND product_id = NEW.product_id;

    RAISE NOTICE 'Mouvement de stock mis à jour pour reception_id=%', NEW.id;

    -- Permettre la mise à jour de continuer
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Avant mise à jour d'une réception
-- =====================================================
DROP TRIGGER IF EXISTS trigger_before_update_reception ON purchase_order_receptions;

CREATE TRIGGER trigger_before_update_reception
    BEFORE UPDATE ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_reception_quantity_update();

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION handle_reception_quantity_update() IS
'Ajuste automatiquement le stock réel et le mouvement de stock associé quand la quantité d''une réception est modifiée.
Logique:
- Calcule le delta (new_qty - old_qty)
- Stock réel += delta
- Met à jour le mouvement de stock correspondant
- Déclenche automatiquement le recalcul des alertes';

COMMENT ON TRIGGER trigger_before_update_reception ON purchase_order_receptions IS
'Déclenché AVANT la mise à jour d''une réception pour ajuster le stock réel et le mouvement associé si la quantité change';

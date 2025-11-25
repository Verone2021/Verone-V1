-- Migration: Trigger DELETE pour purchase_order_receptions
-- Description: Annule automatiquement le mouvement de stock réel quand on supprime une réception
-- Date: 2025-11-24
-- Auteur: Claude Code

-- =====================================================
-- FONCTION: Gérer suppression d'une réception
-- =====================================================
CREATE OR REPLACE FUNCTION handle_reception_deletion()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_quantity_to_remove INTEGER;
BEGIN
    -- Log pour debug
    RAISE NOTICE 'Suppression réception: reception_id=%, product_id=%, quantity=%',
        OLD.id, OLD.product_id, OLD.quantity_received;

    -- Récupérer le stock actuel du produit
    SELECT stock_real INTO v_current_stock
    FROM products
    WHERE id = OLD.product_id;

    -- Calculer la quantité à retirer (négatif car on annule une entrée)
    v_quantity_to_remove := -OLD.quantity_received;

    -- Mettre à jour le stock_real du produit (le diminuer)
    UPDATE products
    SET
        stock_real = stock_real + v_quantity_to_remove,  -- Soustrait la quantité reçue
        updated_at = NOW()
    WHERE id = OLD.product_id;

    RAISE NOTICE 'Stock mis à jour: % → % (delta: %)',
        v_current_stock,
        v_current_stock + v_quantity_to_remove,
        v_quantity_to_remove;

    -- Supprimer le mouvement de stock associé à cette réception
    -- Note: Le mouvement a reference_type='reception' ET reference_id=reception_id (OLD.id)
    DELETE FROM stock_movements
    WHERE reference_type = 'reception'
      AND reference_id = OLD.id
      AND product_id = OLD.product_id;

    RAISE NOTICE 'Mouvement de stock supprimé pour reception_id=%', OLD.id;

    -- Permettre la suppression de continuer
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Avant suppression d'une réception
-- =====================================================
DROP TRIGGER IF EXISTS trigger_before_delete_reception ON purchase_order_receptions;

CREATE TRIGGER trigger_before_delete_reception
    BEFORE DELETE ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_reception_deletion();

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION handle_reception_deletion() IS
'Annule automatiquement le stock réel et supprime le mouvement de stock associé quand une réception est supprimée.
Logique:
- Stock réel -= quantité reçue
- Supprime le mouvement de stock lié
- Déclenche automatiquement le trigger de recalcul des alertes via la cascade';

COMMENT ON TRIGGER trigger_before_delete_reception ON purchase_order_receptions IS
'Déclenché AVANT la suppression d''une réception pour annuler le stock réel et le mouvement associé';

-- Migration: Trigger DELETE pour sales_order_shipments
-- Description: Annule automatiquement le mouvement de stock réel quand on supprime une expédition
-- Date: 2025-11-24
-- Auteur: Claude Code

-- =====================================================
-- FONCTION: Gérer suppression d'une expédition
-- =====================================================
CREATE OR REPLACE FUNCTION handle_shipment_deletion()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_quantity_to_restore INTEGER;
BEGIN
    -- Log pour debug
    RAISE NOTICE 'Suppression expédition: shipment_id=%, product_id=%, quantity=%',
        OLD.id, OLD.product_id, OLD.quantity_shipped;

    -- Récupérer le stock actuel du produit
    SELECT stock_real INTO v_current_stock
    FROM products
    WHERE id = OLD.product_id;

    -- Calculer la quantité à restaurer (positif car on annule une sortie)
    v_quantity_to_restore := OLD.quantity_shipped;

    -- Mettre à jour le stock_real du produit (l'augmenter)
    UPDATE products
    SET
        stock_real = stock_real + v_quantity_to_restore,  -- Restitue la quantité expédiée
        updated_at = NOW()
    WHERE id = OLD.product_id;

    RAISE NOTICE 'Stock mis à jour: % → % (delta: +%)',
        v_current_stock,
        v_current_stock + v_quantity_to_restore,
        v_quantity_to_restore;

    -- Supprimer le mouvement de stock associé à cette expédition
    -- Note: Le mouvement a reference_type='shipment' ET reference_id=shipment_id (OLD.id)
    DELETE FROM stock_movements
    WHERE reference_type = 'shipment'
      AND reference_id = OLD.id
      AND product_id = OLD.product_id;

    RAISE NOTICE 'Mouvement de stock supprimé pour shipment_id=%', OLD.id;

    -- Permettre la suppression de continuer
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Avant suppression d'une expédition
-- =====================================================
DROP TRIGGER IF EXISTS trigger_before_delete_shipment ON sales_order_shipments;

CREATE TRIGGER trigger_before_delete_shipment
    BEFORE DELETE ON sales_order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION handle_shipment_deletion();

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION handle_shipment_deletion() IS
'Annule automatiquement le stock réel et supprime le mouvement de stock associé quand une expédition est supprimée.
Logique:
- Stock réel += quantité expédiée (on restitue le stock)
- Supprime le mouvement de stock lié
- Déclenche automatiquement le trigger de recalcul des alertes via la cascade';

COMMENT ON TRIGGER trigger_before_delete_shipment ON sales_order_shipments IS
'Déclenché AVANT la suppression d''une expédition pour restituer le stock réel et supprimer le mouvement associé';

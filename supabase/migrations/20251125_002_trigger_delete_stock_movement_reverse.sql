-- ============================================================================
-- Migration: Trigger inversion stock apres suppression mouvement
-- Date: 2025-11-25
-- Description: Cree un trigger BEFORE DELETE sur stock_movements pour inverser
--              automatiquement products.stock_real lors de la suppression
--              d'un mouvement de stock manuel.
-- ============================================================================

-- Fonction pour inverser le stock apres suppression d'un mouvement
CREATE OR REPLACE FUNCTION reverse_stock_on_movement_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Inverser le quantity_change sur products.stock_real
    -- Si mouvement etait +10 (IN) -> stock -= 10
    -- Si mouvement etait -5 (OUT) -> stock -= (-5) = stock += 5
    UPDATE products
    SET stock_real = COALESCE(stock_real, 0) - OLD.quantity_change,
        updated_at = NOW()
    WHERE id = OLD.product_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Supprimer le trigger s'il existe deja (idempotent)
DROP TRIGGER IF EXISTS trg_reverse_stock_on_movement_delete ON stock_movements;

-- Creer le trigger BEFORE DELETE
CREATE TRIGGER trg_reverse_stock_on_movement_delete
    BEFORE DELETE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION reverse_stock_on_movement_delete();

-- Ajouter un commentaire explicatif
COMMENT ON TRIGGER trg_reverse_stock_on_movement_delete ON stock_movements IS
'Inverse automatiquement products.stock_real lors de la suppression d''un mouvement de stock.
Permet l''annulation correcte des mouvements manuels (manual_adjustment, manual_entry).';

-- Notification de succes
DO $$
BEGIN
    RAISE NOTICE 'Trigger trg_reverse_stock_on_movement_delete cree avec succes sur stock_movements';
END;
$$;

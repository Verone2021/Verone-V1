-- ============================================================================
-- Migration: Trigger sync stock après mouvements
-- Date: 2025-11-25
-- Description: Crée le trigger manquant pour synchroniser products.stock_real
--              après chaque INSERT dans stock_movements.
--              La fonction update_product_stock_after_movement() existe déjà.
-- ============================================================================

-- Vérifier que la fonction existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'update_product_stock_after_movement'
    ) THEN
        RAISE EXCEPTION 'La fonction update_product_stock_after_movement() n''existe pas. Migration annulée.';
    END IF;
END;
$$;

-- Supprimer le trigger s'il existe déjà (idempotent)
DROP TRIGGER IF EXISTS trg_sync_product_stock_after_movement ON stock_movements;

-- Créer le trigger pour synchroniser products.stock_real après INSERT
CREATE TRIGGER trg_sync_product_stock_after_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_after_movement();

-- Ajouter un commentaire explicatif
COMMENT ON TRIGGER trg_sync_product_stock_after_movement ON stock_movements IS
'Synchronise automatiquement products.stock_real avec quantity_after après chaque mouvement de stock.
Résout le problème du hook use-stock-movements.ts qui faisait un INSERT direct sans mise à jour du stock produit.';

-- Notification de succès
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger trg_sync_product_stock_after_movement créé avec succès sur stock_movements';
END;
$$;

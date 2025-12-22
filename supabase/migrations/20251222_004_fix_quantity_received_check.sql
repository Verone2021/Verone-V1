-- =====================================================
-- MIGRATION: Fix quantity_received CHECK constraint
-- Date: 2025-12-22
-- Description: Permet quantity_received = 0 pour les receptions en attente (pending)
-- =====================================================

-- Supprimer l'ancienne contrainte (> 0)
ALTER TABLE purchase_order_receptions
DROP CONSTRAINT IF EXISTS purchase_order_receptions_quantity_received_check;

-- Ajouter nouvelle contrainte (>= 0)
ALTER TABLE purchase_order_receptions
ADD CONSTRAINT purchase_order_receptions_quantity_received_check
CHECK (quantity_received >= 0);

-- Commentaire
COMMENT ON CONSTRAINT purchase_order_receptions_quantity_received_check ON purchase_order_receptions IS
'Quantite recue doit etre >= 0. 0 pour les receptions en attente (pending).';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

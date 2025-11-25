-- ============================================================================
-- Migration: Réactivation triggers Réception et Expédition
-- Date: 2025-11-25
-- Description: Réactive les triggers critiques pour le workflow stock
--              Phase 1: Réceptions (purchase_order_receptions)
--              Phase 2: Expéditions (sales_order_shipments)
-- Note: Déjà appliquée en cloud via MCP (20251125191743)
-- ============================================================================

-- ============================================================================
-- PHASE 1 : RÉCEPTIONS COMMANDES FOURNISSEUR
-- ============================================================================

-- Réactiver le trigger principal de mise à jour stock sur réception
ALTER TABLE public.purchase_order_receptions ENABLE TRIGGER trigger_reception_update_stock;

-- Réactiver le trigger de validation des réceptions
ALTER TABLE public.purchase_order_receptions ENABLE TRIGGER reception_validation_trigger;

-- ============================================================================
-- PHASE 2 : EXPÉDITIONS COMMANDES VENTES
-- ============================================================================

-- Réactiver le trigger principal de mise à jour stock sur expédition
ALTER TABLE public.sales_order_shipments ENABLE TRIGGER trigger_shipment_update_stock;

-- ============================================================================
-- NOTIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Triggers réactivés avec succès :';
    RAISE NOTICE '  - trigger_reception_update_stock (purchase_order_receptions)';
    RAISE NOTICE '  - reception_validation_trigger (purchase_order_receptions)';
    RAISE NOTICE '  - trigger_shipment_update_stock (sales_order_shipments)';
END;
$$;

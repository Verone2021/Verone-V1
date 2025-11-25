-- ============================================================================
-- Migration: Réactivation triggers Alertes Stock
-- Date: 2025-11-25
-- Description: Réactive les triggers pour la gestion automatique des alertes stock
--              Phase 3: Alertes stock (stock_movements, products)
-- Note: Déjà appliquée en cloud via MCP (20251125191824)
-- ============================================================================

-- ============================================================================
-- PHASE 3 : ALERTES STOCK
-- ============================================================================

-- Réactiver le trigger de mise à jour alertes sur stock_movements
-- Note: Ce trigger est essentiellement no-op car la vue se recalcule auto
ALTER TABLE public.stock_movements ENABLE TRIGGER trg_update_stock_alert;

-- Réactiver le trigger de sync alertes sur products
-- Ce trigger gère stock_alert_tracking quand stock_real/forecasted change
ALTER TABLE public.products ENABLE TRIGGER trigger_sync_stock_alert_tracking_v4;

-- ============================================================================
-- NOTIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Triggers alertes stock réactivés avec succès :';
    RAISE NOTICE '  - trg_update_stock_alert (stock_movements)';
    RAISE NOTICE '  - trigger_sync_stock_alert_tracking_v4 (products)';
END;
$$;

-- =====================================================
-- MIGRATION: Rollback ALL incorrect stock triggers
-- Date: 2025-11-20
-- =====================================================
-- RAISON: Supprimer triggers créés avec mauvaise structure (status inexistant)
-- SUITE: Migrations 001-002 restaurent colonnes status, puis 007 recrée triggers
-- =====================================================

-- Drop tous les triggers stock qui pourraient exister avec mauvaise signature
DROP TRIGGER IF EXISTS trigger_sync_stock_alert_tracking_v2 ON products CASCADE;
DROP TRIGGER IF EXISTS trigger_validate_stock_alerts_on_po ON purchase_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_po_update_forecasted_in ON purchase_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_po_cancellation_rollback ON purchase_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_reception_update_stock ON purchase_order_receptions CASCADE;
DROP TRIGGER IF EXISTS trigger_so_update_forecasted_out ON sales_orders CASCADE;
DROP TRIGGER IF EXISTS trigger_so_cancellation_rollback ON sales_orders CASCADE;
-- Note: sales_order_shipments sera créée dans Migration 163000
-- DROP TRIGGER IF EXISTS trigger_shipment_update_stock ON sales_order_shipments CASCADE;
DROP TRIGGER IF EXISTS trigger_create_notification_on_stock_alert_insert ON stock_alert_tracking CASCADE;
DROP TRIGGER IF EXISTS trigger_create_notification_on_stock_alert_update ON stock_alert_tracking CASCADE;

-- Drop fonctions associées
DROP FUNCTION IF EXISTS sync_stock_alert_tracking_v2() CASCADE;
DROP FUNCTION IF EXISTS validate_stock_alerts_on_po() CASCADE;
DROP FUNCTION IF EXISTS update_po_forecasted_in() CASCADE;
DROP FUNCTION IF EXISTS rollback_po_forecasted() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_reception() CASCADE;
DROP FUNCTION IF EXISTS update_so_forecasted_out() CASCADE;
DROP FUNCTION IF EXISTS rollback_so_forecasted() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_shipment() CASCADE;
DROP FUNCTION IF EXISTS create_notification_on_stock_alert() CASCADE;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Rollback triggers stock terminé - Prêt pour reconstruction';
END $$;

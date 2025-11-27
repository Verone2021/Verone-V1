-- ============================================
-- RÉACTIVATION TRIGGERS CRITIQUES
-- Migration: 20251127_002_reactivate_critical_triggers
-- Aligné sur bonnes pratiques Odoo/SAP
-- ============================================
--
-- Principe notification ERP:
-- 🔴 Urgent   → Action requise immédiate (dans cloche)
-- 🟠 Important → Information métier clé (dans cloche)
-- 🔵 Info     → Traçabilité (audit trail uniquement)
--
-- "Too many notifications kill the information" - Odoo
-- ============================================

-- ============================================
-- 1. TRIGGERS TECHNIQUES (Fonctionnement Core)
-- Ces triggers sont essentiels au bon fonctionnement
-- ============================================

-- Stock expédition (CRITIQUE pour commandes clients)
ALTER TABLE sales_order_shipments ENABLE TRIGGER trigger_shipment_update_stock;

-- Timestamp mise à jour automatique
ALTER TABLE purchase_orders ENABLE TRIGGER purchase_orders_updated_at;

-- Audit trail pour traçabilité
ALTER TABLE purchase_orders ENABLE TRIGGER audit_purchase_orders;
ALTER TABLE stock_movements ENABLE TRIGGER audit_stock_movements;

-- ============================================
-- 2. NOTIFICATIONS URGENTES (🔴)
-- Action requise immédiate - DANS LA CLOCHE
-- ============================================

-- Alerte stock critique (nouvelle alerte)
ALTER TABLE stock_alert_tracking ENABLE TRIGGER trigger_create_notification_on_stock_alert_insert;

-- PO en retard (relance fournisseur nécessaire)
ALTER TABLE purchase_orders ENABLE TRIGGER trigger_po_delayed_notification;

-- ============================================
-- 3. NOTIFICATIONS IMPORTANTES (🟠)
-- Information métier clé - DANS LA CLOCHE
-- ============================================

-- Réception complète PO (validation métier)
ALTER TABLE purchase_orders ENABLE TRIGGER trigger_po_received_notification;

-- Réception partielle PO (suivi reliquat)
ALTER TABLE purchase_orders ENABLE TRIGGER trigger_po_partial_received_notification;

-- Note: Les notifications Sales Orders sont déjà actives:
-- ✅ trigger_order_confirmed_notification
-- ✅ trigger_order_shipped_notification
-- ✅ trigger_payment_received_notification
-- ✅ trigger_order_cancelled_notification

-- ============================================
-- 4. NETTOYAGE DOUBLON
-- ============================================

-- Doublon avec purchase_orders_updated_at (même fonction)
DROP TRIGGER IF EXISTS trigger_purchase_orders_updated_at ON purchase_orders;

-- ============================================
-- 5. TRIGGERS À NE PAS ACTIVER (🔵 Info)
-- Ces triggers créent trop de bruit dans la cloche
-- L'info est déjà dans l'audit trail
-- ============================================

-- ❌ trigger_po_created_notification → Audit trail suffit
-- ❌ trigger_create_notification_on_stock_alert_update → Trop de bruit

-- ============================================
-- VÉRIFICATION
-- ============================================
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  -- Vérifier triggers réactivés
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname IN ('purchase_orders', 'sales_order_shipments', 'stock_alert_tracking', 'stock_movements')
    AND t.tgenabled = 'O'  -- 'O' = Origin = enabled
    AND t.tgname IN (
      'trigger_shipment_update_stock',
      'purchase_orders_updated_at',
      'audit_purchase_orders',
      'audit_stock_movements',
      'trigger_create_notification_on_stock_alert_insert',
      'trigger_po_delayed_notification',
      'trigger_po_received_notification',
      'trigger_po_partial_received_notification'
    );

  IF trigger_count < 8 THEN
    RAISE WARNING 'Seulement % triggers sur 8 sont activés. Vérifier les triggers manquants.', trigger_count;
  ELSE
    RAISE NOTICE '✅ % triggers critiques réactivés avec succès', trigger_count;
  END IF;
END $$;

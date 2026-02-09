-- ============================================================================
-- Migration: Backfill historique achats depuis purchase_order_items existants
-- Date: 2026-02-08
-- Contexte: Peupler product_purchase_history depuis PO reçus (status=received)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Backfill depuis purchase_order_items (PO reçus uniquement)
-- ============================================================================

INSERT INTO product_purchase_history (
  product_id,
  purchase_order_id,
  purchase_order_item_id,
  unit_price_ht,
  quantity,
  purchased_at
)
SELECT
  poi.product_id,
  poi.purchase_order_id,
  poi.id,
  poi.unit_price_ht,
  poi.quantity,
  COALESCE(po.received_at, po.updated_at) as purchased_at
FROM purchase_order_items poi
JOIN purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
  AND poi.product_id IS NOT NULL
ON CONFLICT (product_id, purchase_order_item_id) DO NOTHING;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM product_purchase_history;
  RAISE NOTICE '✅ Migration 20260208_005: Backfill complet (% records historique)', v_count;
END $$;

-- ============================================================================
-- Migration: Backfill stats PMP pour produits avec historique
-- Date: 2026-02-08
-- Contexte: Recalculer PMP depuis product_purchase_history
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Recalculer PMP pour tous les produits ayant un historique
-- ============================================================================

UPDATE products p
SET
  cost_price_avg = stats.avg_price,
  cost_price_min = stats.min_price,
  cost_price_max = stats.max_price,
  cost_price_last = stats.last_price,
  cost_price_count = stats.count_purchases,
  cost_price = stats.avg_price,  -- Phase 1: sync avec avg
  updated_at = NOW()
FROM (
  SELECT
    product_id,
    SUM(unit_price_ht * quantity) / NULLIF(SUM(quantity), 0) as avg_price,
    MIN(unit_price_ht) as min_price,
    MAX(unit_price_ht) as max_price,
    COUNT(*) as count_purchases,
    (ARRAY_AGG(unit_price_ht ORDER BY purchased_at DESC, created_at DESC))[1] as last_price
  FROM product_purchase_history
  GROUP BY product_id
) stats
WHERE p.id = stats.product_id;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ Migration 20260208_006: PMP Backfill (% products updated)', v_updated;
END $$;

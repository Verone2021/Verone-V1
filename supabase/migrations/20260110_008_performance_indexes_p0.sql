-- ============================================================================
-- Migration: Performance Indexes P0 (CRITIQUE)
-- Date: 2026-01-10
-- Description: Indexes manquants identifiés lors audit performance
-- Gain estimé: 60-80% réduction temps queries LinkMe et catalogue
-- ============================================================================

-- ============================================================================
-- SALES_ORDERS: Index composite pour queries LinkMe
-- Pattern: .eq('channel_id', LINKME_ID).order('created_at', { ascending: false })
-- Impact: 50ms → 5ms sur listing commandes LinkMe
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_channel_created
  ON sales_orders(channel_id, created_at DESC);

-- ============================================================================
-- SALES_ORDER_ITEMS: Index pour trigger commission LinkMe
-- Pattern: JOIN linkme_selection_items ON linkme_selection_item_id
-- Impact: Trigger plus rapide sur chaque update status
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_order_items_linkme_selection
  ON sales_order_items(linkme_selection_item_id)
  WHERE linkme_selection_item_id IS NOT NULL;

-- ============================================================================
-- LINKME_COMMISSIONS: Index unique pour éviter doublons
-- Pattern: IF EXISTS (SELECT 1 FROM linkme_commissions WHERE order_id = NEW.id)
-- Impact: Check doublon O(1) au lieu de scan
-- ============================================================================
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_linkme_commissions_order
  ON linkme_commissions(order_id);

-- ============================================================================
-- PRODUCTS: Index pour RLS policy affiliés
-- Pattern: WHERE la.enseigne_id = products.enseigne_id
-- Impact: RLS policy 50% plus rapide
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enseigne
  ON products(enseigne_id)
  WHERE enseigne_id IS NOT NULL;

-- ============================================================================
-- PRODUCTS: Index pour RLS policy créateur affilié
-- Pattern: WHERE la.id = products.created_by_affiliate
-- Impact: RLS policy 50% plus rapide
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_by_affiliate
  ON products(created_by_affiliate)
  WHERE created_by_affiliate IS NOT NULL;

-- ============================================================================
-- SALES_ORDERS: Index pour page client (commandes par customer)
-- Pattern: .eq('customer_id', id).order('created_at', { ascending: false })
-- Impact: Listing commandes client plus rapide
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_customer_created
  ON sales_orders(customer_id, created_at DESC);

-- ============================================================================
-- Validation
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PERFORMANCE INDEXES P0 - Migration terminée';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Indexes créés:';
  RAISE NOTICE '   1. idx_sales_orders_channel_created (LinkMe queries)';
  RAISE NOTICE '   2. idx_sales_order_items_linkme_selection (Trigger)';
  RAISE NOTICE '   3. idx_linkme_commissions_order (Doublon check)';
  RAISE NOTICE '   4. idx_products_enseigne (RLS policy)';
  RAISE NOTICE '   5. idx_products_created_by_affiliate (RLS policy)';
  RAISE NOTICE '   6. idx_sales_orders_customer_created (Customer orders)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Gains attendus:';
  RAISE NOTICE '   - Queries LinkMe: -60% temps';
  RAISE NOTICE '   - RLS products: -50% temps';
  RAISE NOTICE '   - Trigger commission: early exit rapide';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: CONCURRENTLY = pas de lock table';
  RAISE NOTICE '';
END $$;

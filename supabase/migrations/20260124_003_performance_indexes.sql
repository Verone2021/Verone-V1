-- ============================================================================
-- Performance Indexes - Back-Office Dashboard Optimization
-- ============================================================================
--
-- Objectif: Réduire les temps de chargement du dashboard et des pages analytiques
--
-- Tables ciblées:
-- - sales_orders: Filtres fréquents sur created_at + status
-- - invoices: Filtres fréquents sur created_at + status
-- - products: Filtres sur archived_at + stock
-- - stock_movements: Filtres sur created_at pour historique
--
-- Gains estimés: 300-500ms sur les requêtes dashboard
--
-- Date: 2026-01-24
-- ============================================================================

-- ============================================================================
-- Index 1: sales_orders - Filtres date + status (dashboard, analytics)
-- ============================================================================
-- Requêtes typiques:
-- .gte('created_at', startOfMonth).not('status', 'eq', 'cancelled')
-- .order('created_at', { ascending: false })

CREATE INDEX IF NOT EXISTS idx_sales_orders_created_status
  ON sales_orders(created_at DESC, status)
  WHERE status NOT IN ('cancelled', 'draft');

COMMENT ON INDEX idx_sales_orders_created_status IS
  'Performance: Dashboard KPIs - filtres date+status sur commandes actives';

-- ============================================================================
-- Index 2: invoices - Filtres date + status (analytics CA)
-- ============================================================================
-- Requêtes typiques:
-- .gte('created_at', startOfPrevMonth).neq('status', 'cancelled')

CREATE INDEX IF NOT EXISTS idx_invoices_created_status
  ON invoices(created_at DESC, status)
  WHERE status != 'cancelled';

COMMENT ON INDEX idx_invoices_created_status IS
  'Performance: Dashboard revenue - filtres date+status sur factures actives';

-- ============================================================================
-- Index 3: products - Filtres archived + stock (alertes stock)
-- ============================================================================
-- Requêtes typiques:
-- .select('id, stock_real, min_stock').is('archived_at', null)

CREATE INDEX IF NOT EXISTS idx_products_active_stock
  ON products(id, stock_real, min_stock)
  WHERE archived_at IS NULL;

COMMENT ON INDEX idx_products_active_stock IS
  'Performance: Alertes stock - produits actifs avec données stock';

-- ============================================================================
-- Index 4: stock_movements - Historique par date (graphiques)
-- ============================================================================
-- Requêtes typiques:
-- .gte('created_at', startDate).order('created_at', { ascending: true })

CREATE INDEX IF NOT EXISTS idx_stock_movements_created
  ON stock_movements(created_at DESC, product_id);

COMMENT ON INDEX idx_stock_movements_created IS
  'Performance: Graphiques mouvements stock - historique par date';

-- ============================================================================
-- Index 5: purchase_orders - Filtres date + status (analytics achats)
-- ============================================================================
-- Requêtes typiques:
-- .gte('created_at', startDate).not('status', 'eq', 'cancelled')

CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_status
  ON purchase_orders(created_at DESC, status)
  WHERE status NOT IN ('cancelled', 'draft');

COMMENT ON INDEX idx_purchase_orders_created_status IS
  'Performance: Dashboard achats - filtres date+status sur commandes actives';

-- ============================================================================
-- Index 6: linkme_commissions - Analytics commissions
-- ============================================================================
-- Requêtes typiques:
-- .select('id, order_amount_ht, affiliate_commission_ttc, created_at')

CREATE INDEX IF NOT EXISTS idx_linkme_commissions_created
  ON linkme_commissions(created_at DESC);

COMMENT ON INDEX idx_linkme_commissions_created IS
  'Performance: Dashboard LinkMe - historique commissions';

-- ============================================================================
-- Verification des indexes créés
-- ============================================================================

DO $$
DECLARE
  idx_count INT;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_sales_orders_created_status',
    'idx_invoices_created_status',
    'idx_products_active_stock',
    'idx_stock_movements_created',
    'idx_purchase_orders_created_status',
    'idx_linkme_commissions_created'
  );

  RAISE NOTICE 'Performance indexes created: % / 6', idx_count;
END $$;

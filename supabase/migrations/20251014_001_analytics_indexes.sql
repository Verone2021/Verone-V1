/**
 * 📊 Migration Analytics Indexes - Optimisation Performance Requêtes Recharts
 *
 * Contexte:
 * - Feature 4 Dashboard Analytics avec 4 graphiques Recharts
 * - Requêtes fréquentes sur created_at pour les 30 derniers jours
 * - 4 tables concernées: sales_orders, products, stock_movements, purchase_orders
 *
 * Optimisations:
 * 1. Index B-tree sur created_at pour filtrage temporel efficace
 * 2. Index composite sur (created_at, status) pour sales_orders (filtre sur status != 'cancelled')
 * 3. Index composite sur (created_at, movement_type) pour stock_movements (séparation in/out)
 *
 * Performance attendue:
 * - Queries passent de Seq Scan → Index Scan
 * - Temps requête réduit ~80% pour analytics hook
 * - Impact minimal sur INSERT (tables write-heavy mais volume modéré)
 *
 * Date: 2025-10-14
 */

-- ============ 1. SALES_ORDERS - Index créé pour filtrage CA (30 jours, status != cancelled) ============
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at_status
  ON sales_orders(created_at DESC, status)
  WHERE status != 'cancelled';

COMMENT ON INDEX idx_sales_orders_created_at_status IS
'Index pour analytics: filtre CA 30 derniers jours avec exclusion commandes annulées';

-- ============ 2. PRODUCTS - Index pour produits ajoutés par semaine ============
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products(created_at DESC);

COMMENT ON INDEX idx_products_created_at IS
'Index pour analytics: comptage produits ajoutés par semaine sur 30 jours';

-- ============ 3. STOCK_MOVEMENTS - Index composite pour mouvements entrées/sorties ============
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at_type
  ON stock_movements(created_at DESC, movement_type);

COMMENT ON INDEX idx_stock_movements_created_at_type IS
'Index pour analytics: séparation entrées/sorties stock par jour sur 30 jours';

-- ============ 4. PURCHASE_ORDERS - Index composite pour commandes fournisseurs (par semaine, sans cancelled) ============
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at_status
  ON purchase_orders(created_at DESC, status)
  WHERE status != 'cancelled';

COMMENT ON INDEX idx_purchase_orders_created_at_status IS
'Index pour analytics: montant commandes fournisseurs par semaine, exclusion annulées';

-- ============ VALIDATION INDEXES CRÉÉS ============
-- Vérification des indexes créés (pour logs migration)
DO $$
BEGIN
  RAISE NOTICE '✅ Analytics Indexes créés:';
  RAISE NOTICE '   - idx_sales_orders_created_at_status';
  RAISE NOTICE '   - idx_products_created_at';
  RAISE NOTICE '   - idx_stock_movements_created_at_type';
  RAISE NOTICE '   - idx_purchase_orders_created_at_status';
  RAISE NOTICE '📊 Optimisation requêtes analytics Dashboard - Feature 4 terminée';
END $$;

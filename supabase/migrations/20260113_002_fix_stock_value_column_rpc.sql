-- =====================================================
-- Migration: Fix get_dashboard_stock_orders_metrics RPC
-- Date: 2026-01-13
-- Description: Corrige le calcul stock_value pour utiliser stock_real au lieu de stock_quantity
-- Bug fix: Valeur stock incorrecte car stock_quantity != stock_real
-- =====================================================

-- Recreate function with correct column
CREATE OR REPLACE FUNCTION get_dashboard_stock_orders_metrics()
RETURNS TABLE (
  stock_value NUMERIC,
  purchase_orders_count INTEGER,
  month_revenue NUMERIC,
  products_to_source INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    -- Valeur stock: somme des (cost_price * stock_real) pour produits actifs avec stock
    COALESCE(
      (SELECT SUM(COALESCE(cost_price, 0) * COALESCE(stock_real, 0))
       FROM products
       WHERE stock_real > 0 AND archived_at IS NULL),
      0
    )::NUMERIC AS stock_value,

    -- Commandes fournisseurs: total commandes achat
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM purchase_orders),
      0
    ) AS purchase_orders_count,

    -- CA du mois: somme des commandes vente du mois en cours
    COALESCE(
      (SELECT SUM(COALESCE(total_ttc, 0))
       FROM sales_orders
       WHERE created_at >= date_trunc('month', CURRENT_DATE)
         AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'),
      0
    )::NUMERIC AS month_revenue,

    -- Produits à sourcer: produits pas encore actifs (draft, discontinued, preorder)
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM products
       WHERE (product_status != 'active' OR product_status IS NULL)
         AND archived_at IS NULL),
      0
    ) AS products_to_source;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stock_orders_metrics() TO authenticated;

-- Comment
COMMENT ON FUNCTION get_dashboard_stock_orders_metrics() IS
  'Calcule les métriques dashboard: valeur stock (stock_real), commandes achat, CA mois, produits à sourcer.';

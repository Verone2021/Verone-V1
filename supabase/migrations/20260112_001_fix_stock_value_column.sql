-- Migration: Fix stock_value calculation - use stock_real instead of stock_quantity
-- Date: 2026-01-12
-- Description: La fonction utilisait stock_quantity (colonne inexistante), corrigé vers stock_real

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
    -- Valeur stock: somme des (cost_price * stock_real) pour produits avec stock
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

    -- CA du mois: somme des FACTURES (pas des commandes)
    COALESCE(
      (SELECT SUM(COALESCE(total_ht, 0))
       FROM invoices
       WHERE created_at >= date_trunc('month', CURRENT_DATE)
         AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
         AND status NOT IN ('cancelled', 'draft')),
      0
    )::NUMERIC AS month_revenue,

    -- Produits à sourcer: produits pas encore actifs
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM products
       WHERE (product_status != 'active' OR product_status IS NULL)
         AND archived_at IS NULL),
      0
    ) AS products_to_source;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stock_orders_metrics() TO authenticated;

COMMENT ON FUNCTION get_dashboard_stock_orders_metrics() IS
  'Calcule les métriques dashboard: valeur stock (stock_real * cost_price), commandes achat, CA mois (factures), produits à sourcer. Fix 2026-01-12: stock_quantity→stock_real, sales_orders→invoices';

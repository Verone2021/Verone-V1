-- Migration: Créer fonction RPC get_dashboard_stock_orders_metrics
-- Date: 2025-12-12
-- Description: Calcule les métriques dashboard stock & commandes
-- Fix: Erreur 500 sur /dashboard car fonction RPC manquante

-- ============================================================================
-- FONCTION RPC: get_dashboard_stock_orders_metrics
-- ============================================================================
-- Retourne les métriques pour le dashboard principal:
-- - stock_value: Valeur totale du stock en € (cost_price * stock_quantity)
-- - purchase_orders_count: Nombre total de commandes fournisseurs
-- - month_revenue: CA du mois en cours en € (total_ttc des sales_orders)
-- - products_to_source: Nombre de produits pas encore actifs

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
    -- Valeur stock: somme des (cost_price * stock_quantity) pour produits avec stock
    COALESCE(
      (SELECT SUM(COALESCE(cost_price, 0) * COALESCE(stock_quantity, 0))
       FROM products
       WHERE stock_quantity > 0),
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
       WHERE product_status != 'active' OR product_status IS NULL),
      0
    ) AS products_to_source;
$$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Permettre aux utilisateurs authentifiés d'appeler cette fonction

GRANT EXECUTE ON FUNCTION get_dashboard_stock_orders_metrics() TO authenticated;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_dashboard_stock_orders_metrics() IS
  'Calcule les métriques dashboard: valeur stock, commandes achat, CA mois, produits à sourcer. Utilisé par /api/dashboard/stock-orders-metrics';

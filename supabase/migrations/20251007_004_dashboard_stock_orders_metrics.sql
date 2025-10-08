-- ============================================================================
-- Migration: Dashboard Stock & Orders Metrics Function
-- Date: 2025-10-07
-- Description: Fonction SQL pour calculer les métriques dashboard en une seule requête
-- ============================================================================

-- Fonction pour calculer toutes les métriques stock/commandes/sourcing
CREATE OR REPLACE FUNCTION get_dashboard_stock_orders_metrics()
RETURNS TABLE (
  stock_value numeric,
  purchase_orders_count integer,
  month_revenue numeric,
  products_to_source integer
) AS $$
DECLARE
  v_stock_value numeric;
  v_purchase_orders_count integer;
  v_month_revenue numeric;
  v_products_to_source integer;
  v_current_month integer;
  v_current_year integer;
BEGIN
  -- Récupérer mois et année actuels
  v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- 1. Valeur Stock : Somme (quantité × prix coût) pour produits non archivés
  SELECT COALESCE(SUM(stock_quantity * cost_price), 0)
  INTO v_stock_value
  FROM products
  WHERE archived_at IS NULL
    AND stock_quantity > 0
    AND cost_price IS NOT NULL;

  -- 2. Commandes Achat : Nombre de purchase_orders actives (non annulées)
  SELECT COUNT(*)
  INTO v_purchase_orders_count
  FROM purchase_orders
  WHERE status NOT IN ('cancelled');

  -- 3. CA du Mois : Somme total_ttc des sales_orders du mois en cours (hors brouillon/annulé)
  SELECT COALESCE(SUM(total_ttc), 0)
  INTO v_month_revenue
  FROM sales_orders
  WHERE EXTRACT(MONTH FROM created_at) = v_current_month
    AND EXTRACT(YEAR FROM created_at) = v_current_year
    AND status NOT IN ('draft', 'cancelled');

  -- 4. À Sourcer : Nombre de product_drafts en mode sourcing
  SELECT COUNT(*)
  INTO v_products_to_source
  FROM product_drafts
  WHERE creation_mode = 'sourcing';

  -- Retourner toutes les métriques en une seule ligne
  RETURN QUERY SELECT
    v_stock_value,
    v_purchase_orders_count,
    v_month_revenue,
    v_products_to_source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS RLS
-- ============================================================================

-- Grant execute à authenticated users (tous les utilisateurs connectés peuvent voir ces métriques)
GRANT EXECUTE ON FUNCTION get_dashboard_stock_orders_metrics() TO authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 004 - Dashboard Stock & Orders Metrics Function créée avec succès';
  RAISE NOTICE 'Fonction: get_dashboard_stock_orders_metrics()';
  RAISE NOTICE 'Métriques calculées: stock_value, purchase_orders_count, month_revenue, products_to_source';
  RAISE NOTICE 'Prêt pour intégration dashboard!';
END $$;

-- ============================================================================
-- Migration: Fix Dashboard Metrics - Table product_drafts non existante
-- Date: 2025-10-19
-- Bug: Erreur 500 sur /api/dashboard/stock-orders-metrics
-- ============================================================================
-- PROBLÈME:
--   La fonction get_dashboard_stock_orders_metrics() référence table product_drafts
--   qui n'existe pas encore (Phase 2 Sourcing)
--
-- SOLUTION:
--   Mettre v_products_to_source = 0 temporairement
--   Phase 2 restaurera la logique complète
-- ============================================================================

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

  -- 4. À Sourcer : Phase 2 Sourcing (table product_drafts pas encore créée)
  -- 🔧 FIX 2025-10-19: Mettre 0 temporairement (Phase 1)
  -- TODO Phase 2: Restaurer query product_drafts WHERE creation_mode = 'sourcing'
  v_products_to_source := 0;

  -- Retourner toutes les métriques en une seule ligne
  RETURN QUERY SELECT
    v_stock_value,
    v_purchase_orders_count,
    v_month_revenue,
    v_products_to_source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions inchangées
GRANT EXECUTE ON FUNCTION get_dashboard_stock_orders_metrics() TO authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_test_result RECORD;
BEGIN
  -- Tester fonction après fix
  SELECT * INTO v_test_result FROM get_dashboard_stock_orders_metrics();

  RAISE NOTICE '✅ Migration 20251019_004 appliquée avec succès';
  RAISE NOTICE 'Test fonction: stock_value=%, purchase_orders_count=%, month_revenue=%, products_to_source=%',
    v_test_result.stock_value,
    v_test_result.purchase_orders_count,
    v_test_result.month_revenue,
    v_test_result.products_to_source;
  RAISE NOTICE 'Dashboard metrics API devrait retourner 200 maintenant';
END $$;

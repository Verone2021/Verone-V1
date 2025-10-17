-- Migration: Dashboard Metrics Functions
-- Description: Fonctions PostgreSQL optimisées pour les calculs de métriques du dashboard
-- Performance: Conçu pour respecter SLO < 2s

-- ============================================================================
-- FONCTION: Statistiques produits
-- ============================================================================
CREATE OR REPLACE FUNCTION get_product_stats()
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  inactive_products BIGINT,
  draft_products BIGINT,
  trend_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH product_counts AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'in_stock') AS active,
      COUNT(*) FILTER (WHERE status IN ('out_of_stock', 'discontinued')) AS inactive,
      COUNT(*) FILTER (WHERE status IN ('coming_soon', 'preorder')) AS draft
    FROM products
  ),
  yesterday_count AS (
    SELECT COUNT(*) AS yesterday_total
    FROM products
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day'
  )
  SELECT
    pc.total,
    pc.active,
    pc.inactive,
    pc.draft,
    CASE
      WHEN yc.yesterday_total > 0 THEN
        ROUND(((pc.total - yc.yesterday_total)::NUMERIC / yc.yesterday_total) * 100, 1)
      ELSE 0
    END AS trend
  FROM product_counts pc, yesterday_count yc;
END;
$$;

-- ============================================================================
-- FONCTION: Alertes de stock
-- ============================================================================
CREATE OR REPLACE FUNCTION get_stock_alerts(limit_count INT DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  stock_level INT,
  alert_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    -- Simulation du stock basée sur le statut (à remplacer par vraie colonne stock_quantity)
    CASE
      WHEN p.status = 'out_of_stock' THEN 0
      WHEN p.status = 'discontinued' THEN 0
      WHEN p.status = 'preorder' THEN FLOOR(RANDOM() * 3)::INT
      ELSE FLOOR(RANDOM() * 10 + 1)::INT
    END AS stock_level,
    CASE
      WHEN p.status = 'out_of_stock' THEN 'rupture'
      WHEN p.status = 'discontinued' THEN 'rupture'
      WHEN p.status = 'preorder' THEN 'critique'
      ELSE 'faible'
    END AS alert_status
  FROM products p
  WHERE p.status IN ('out_of_stock', 'discontinued', 'preorder')
  ORDER BY
    CASE p.status
      WHEN 'out_of_stock' THEN 1
      WHEN 'discontinued' THEN 2
      WHEN 'preorder' THEN 3
      ELSE 4
    END
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- FONCTION: Activité journalière
-- ============================================================================
CREATE OR REPLACE FUNCTION get_daily_activity()
RETURNS TABLE (
  activity_today BIGINT,
  activity_yesterday BIGINT,
  trend_percentage NUMERIC,
  recent_actions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_start TIMESTAMP := CURRENT_DATE;
  yesterday_start TIMESTAMP := CURRENT_DATE - INTERVAL '1 day';
  yesterday_end TIMESTAMP := CURRENT_DATE;
BEGIN
  RETURN QUERY
  WITH activity_counts AS (
    -- Compte des activités sur les produits
    SELECT
      COUNT(*) FILTER (
        WHERE created_at >= today_start OR updated_at >= today_start
      ) AS today_count,
      COUNT(*) FILTER (
        WHERE created_at >= yesterday_start AND created_at < yesterday_end
      ) AS yesterday_count
    FROM products
  ),
  recent_product_actions AS (
    -- Actions récentes sur les produits
    SELECT
      jsonb_build_object(
        'type', CASE
          WHEN created_at >= today_start THEN 'product_created'
          ELSE 'product_updated'
        END,
        'description', CASE
          WHEN created_at >= today_start THEN 'Nouveau produit ajouté'
          ELSE 'Produit mis à jour'
        END,
        'timestamp', GREATEST(created_at, updated_at),
        'entity_id', id
      ) AS action
    FROM products
    WHERE created_at >= today_start OR updated_at >= today_start
    ORDER BY GREATEST(created_at, updated_at) DESC
    LIMIT 5
  )
  SELECT
    ac.today_count,
    ac.yesterday_count,
    CASE
      WHEN ac.yesterday_count > 0 THEN
        ROUND(((ac.today_count - ac.yesterday_count)::NUMERIC / ac.yesterday_count) * 100, 1)
      WHEN ac.today_count > 0 THEN 100
      ELSE 0
    END AS trend,
    COALESCE(
      jsonb_agg(rpa.action ORDER BY (rpa.action->>'timestamp')::TIMESTAMP DESC),
      '[]'::jsonb
    ) AS recent_actions
  FROM activity_counts ac
  LEFT JOIN recent_product_actions rpa ON true
  GROUP BY ac.today_count, ac.yesterday_count;
END;
$$;

-- ============================================================================
-- FONCTION: Statistiques utilisateurs
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  new_users BIGINT,
  admin_count BIGINT,
  catalog_manager_count BIGINT,
  sales_count BIGINT,
  partner_manager_count BIGINT,
  trend_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_counts AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (
        WHERE last_sign_in_at > CURRENT_DATE - INTERVAL '30 days'
      ) AS active,
      COUNT(*) FILTER (
        WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
      ) AS new,
      COUNT(*) FILTER (WHERE role = 'admin') AS admins,
      COUNT(*) FILTER (WHERE role = 'catalog_manager') AS catalog_managers,
      COUNT(*) FILTER (WHERE role = 'sales') AS sales,
      COUNT(*) FILTER (WHERE role = 'partner_manager') AS partner_managers
    FROM user_profiles
  )
  SELECT
    uc.total,
    uc.active,
    uc.new,
    uc.admins,
    uc.catalog_managers,
    uc.sales,
    uc.partner_managers,
    CASE
      WHEN uc.total > 0 THEN
        ROUND((uc.new::NUMERIC / uc.total) * 100, 1)
      ELSE 0
    END AS trend
  FROM user_counts uc;
END;
$$;

-- ============================================================================
-- FONCTION: Métriques globales du dashboard (fonction principale)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
  metrics JSONB,
  generated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_data RECORD;
  stock_data JSONB;
  activity_data RECORD;
  user_data RECORD;
BEGIN
  -- Récupération des statistiques produits
  SELECT * INTO product_data FROM get_product_stats();

  -- Récupération des alertes de stock
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', product_id,
      'name', product_name,
      'stock', stock_level,
      'status', alert_status
    )
  ) INTO stock_data
  FROM get_stock_alerts(5);

  -- Récupération de l'activité
  SELECT * INTO activity_data FROM get_daily_activity();

  -- Récupération des statistiques utilisateurs
  SELECT * INTO user_data FROM get_user_stats();

  RETURN QUERY
  SELECT
    jsonb_build_object(
      'products', jsonb_build_object(
        'total', product_data.total_products,
        'active', product_data.active_products,
        'inactive', product_data.inactive_products,
        'draft', product_data.draft_products,
        'trend', product_data.trend_percentage
      ),
      'stock', jsonb_build_object(
        'alerts', COALESCE(stock_data, '[]'::jsonb)
      ),
      'activity', jsonb_build_object(
        'today', activity_data.activity_today,
        'yesterday', activity_data.activity_yesterday,
        'trend', activity_data.trend_percentage,
        'recent', activity_data.recent_actions
      ),
      'users', jsonb_build_object(
        'total', user_data.total_users,
        'active', user_data.active_users,
        'new', user_data.new_users,
        'byRole', jsonb_build_object(
          'admin', user_data.admin_count,
          'catalog_manager', user_data.catalog_manager_count,
          'sales', user_data.sales_count,
          'partner_manager', user_data.partner_manager_count
        ),
        'trend', user_data.trend_percentage
      )
    ) AS metrics,
    NOW() AS generated_at;
END;
$$;

-- ============================================================================
-- INDEXES pour améliorer les performances
-- ============================================================================

-- Index sur le statut des produits pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Index sur les dates de création/modification pour les calculs de tendance
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- Index sur les profils utilisateurs
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_sign_in ON user_profiles(last_sign_in_at);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Permettre l'exécution des fonctions aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_product_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_alerts(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;

-- Commentaires pour documentation
COMMENT ON FUNCTION get_product_stats() IS 'Retourne les statistiques agrégées des produits pour le dashboard';
COMMENT ON FUNCTION get_stock_alerts(INT) IS 'Retourne les alertes de stock critiques';
COMMENT ON FUNCTION get_daily_activity() IS 'Retourne l''activité journalière et les actions récentes';
COMMENT ON FUNCTION get_user_stats() IS 'Retourne les statistiques des utilisateurs par rôle';
COMMENT ON FUNCTION get_dashboard_metrics() IS 'Fonction principale qui agrège toutes les métriques du dashboard';
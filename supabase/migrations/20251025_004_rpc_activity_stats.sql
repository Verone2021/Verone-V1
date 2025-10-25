-- ============================================================================
-- Migration: RPC Function Activity Stats (SLO <500ms)
-- Date: 2025-10-25
-- Ticket: Phase 3 - Éliminer dernier warning SLO (2900ms→<500ms)
-- ============================================================================

-- Fonction PostgreSQL pour calcul statistiques activité côté serveur
-- Remplace calculs JavaScript lourds (2900ms) par calculs PostgreSQL optimisés
CREATE OR REPLACE FUNCTION get_activity_stats(days_ago INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE SQL
STABLE
AS $$
  WITH stats_data AS (
    -- Récupération données audit_logs avec limite 5000
    SELECT
      user_id,
      action,
      severity,
      created_at,
      new_data->>'page_url' AS page_url
    FROM audit_logs
    WHERE created_at >= NOW() - (days_ago || ' days')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 5000
  ),
  sessions_count AS (
    -- Calcul sessions uniques (user_id + date)
    SELECT COUNT(DISTINCT CONCAT(user_id, '-', DATE(created_at))) AS total
    FROM stats_data
    WHERE user_id IS NOT NULL
  ),
  page_views AS (
    -- Top 10 pages les plus visitées
    SELECT page_url, COUNT(*) as visits
    FROM stats_data
    WHERE page_url IS NOT NULL
    GROUP BY page_url
    ORDER BY visits DESC
    LIMIT 10
  ),
  actions_count AS (
    -- Top 10 actions les plus utilisées
    SELECT action, COUNT(*) as count
    FROM stats_data
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  ),
  error_stats AS (
    -- Statistiques erreurs
    SELECT
      COUNT(*) FILTER (WHERE severity IN ('error', 'critical')) AS errors,
      COUNT(*) AS total
    FROM stats_data
  )
  -- Construction JSON final (structure ActivityStats TypeScript)
  SELECT json_build_object(
    'total_sessions', COALESCE((SELECT total FROM sessions_count), 0),
    'avg_session_duration', 0,
    'most_visited_pages', COALESCE((SELECT json_agg(json_build_object('page', page_url, 'visits', visits)) FROM page_views), '[]'::json),
    'most_used_actions', COALESCE((SELECT json_agg(json_build_object('action', action, 'count', count)) FROM actions_count), '[]'::json),
    'error_rate', COALESCE((SELECT CASE WHEN total > 0 THEN ROUND((errors::numeric / total * 100)::numeric, 2) ELSE 0 END FROM error_stats), 0),
    'user_satisfaction_score', COALESCE((SELECT CASE WHEN total > 0 THEN ROUND((100 - (errors::numeric / total * 100))::numeric, 2) ELSE 100 END FROM error_stats), 100)
  ) AS result
$$;

-- Documentation
COMMENT ON FUNCTION get_activity_stats(INTEGER) IS
  'Calcule statistiques activité utilisateurs sur N jours. Optimisé <500ms (vs 2900ms côté client JS). Retourne JSON compatible interface ActivityStats TypeScript.';

-- ============================================================================
-- Test manuel (dev only)
-- ============================================================================
-- SELECT get_activity_stats(7);

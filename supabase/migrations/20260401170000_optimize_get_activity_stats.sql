-- BO-PERF-001: Optimize get_activity_stats RPC
-- Problem: 485ms execution time on audit_logs (89k rows, 66MB), JSONB extraction without index
-- Solution: ANALYZE + JSONB index + rewrite RPC with MATERIALIZED CTE

-- Step 1: Refresh planner statistics (non-destructive)
ANALYZE audit_logs;

-- Step 2: Index for JSONB page_url extraction (used in RPC)
CREATE INDEX IF NOT EXISTS idx_audit_logs_page_url
  ON audit_logs ((new_data->>'page_url'))
  WHERE new_data->>'page_url' IS NOT NULL;

-- Step 3: Composite index for the main RPC query pattern (created_at filter + ORDER BY)
-- Already exists: idx_audit_logs_created_at_desc_user_id
-- No additional index needed

-- Step 4: Rewrite RPC with MATERIALIZED CTE (single scan instead of 4)
CREATE OR REPLACE FUNCTION get_activity_stats(days_ago int DEFAULT 30)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats_data AS MATERIALIZED (
    SELECT
      user_id,
      action,
      severity,
      created_at,
      new_data->>'page_url' AS page_url
    FROM audit_logs
    WHERE created_at >= NOW() - (days_ago || ' days')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 2000
  ),
  sessions_count AS (
    SELECT COUNT(DISTINCT CONCAT(user_id, '-', DATE(created_at))) AS total
    FROM stats_data
    WHERE user_id IS NOT NULL
  ),
  page_views AS (
    SELECT page_url, COUNT(*) as visits
    FROM stats_data
    WHERE page_url IS NOT NULL
    GROUP BY page_url
    ORDER BY visits DESC
    LIMIT 10
  ),
  actions_count AS (
    SELECT action, COUNT(*) as count
    FROM stats_data
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  ),
  error_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE severity IN ('error', 'critical')) AS errors,
      COUNT(*) AS total
    FROM stats_data
  )
  SELECT json_build_object(
    'total_sessions', COALESCE((SELECT total FROM sessions_count), 0),
    'avg_session_duration', 0,
    'most_visited_pages', COALESCE((SELECT json_agg(json_build_object('page', page_url, 'visits', visits)) FROM page_views), '[]'::json),
    'most_used_actions', COALESCE((SELECT json_agg(json_build_object('action', action, 'count', count)) FROM actions_count), '[]'::json),
    'error_rate', COALESCE((SELECT CASE WHEN total > 0 THEN ROUND((errors::numeric / total * 100)::numeric, 2) ELSE 0 END FROM error_stats), 0),
    'user_satisfaction_score', COALESCE((SELECT CASE WHEN total > 0 THEN ROUND((100 - (errors::numeric / total * 100))::numeric, 2) ELSE 100 END FROM error_stats), 100)
  ) AS result;
$$;

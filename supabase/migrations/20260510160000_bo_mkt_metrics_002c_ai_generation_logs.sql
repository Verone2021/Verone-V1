-- =============================================
-- BO-MKT-METRICS-002c : AI generation logs
--
-- Objectif :
--   Tracer chaque appel Gemini (image + texte) pour mesurer la latence,
--   les tokens consommes, l estimation cout, et le taux d'erreur. Permet
--   de detecter les abus, surveiller le cout mensuel, et identifier les
--   prompts qui consomment le plus.
--
-- Alimente par : le wrapper GeminiClient + les routes API marketing.
-- =============================================

CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  latency_ms INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_cents_estimated INTEGER,
  error_code TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_generation_logs_metadata_object_only
    CHECK (request_metadata IS NULL OR jsonb_typeof(request_metadata) = 'object')
);

COMMENT ON TABLE ai_generation_logs IS
  'Log de chaque appel Gemini (image + texte). Sert au monitoring cout, performance, taux erreur.';

CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_created_at
  ON ai_generation_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user_created
  ON ai_generation_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_endpoint_created
  ON ai_generation_logs (endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_errors
  ON ai_generation_logs (error_code, created_at DESC) WHERE error_code IS NOT NULL;

ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_access_ai_generation_logs" ON ai_generation_logs;
CREATE POLICY "staff_full_access_ai_generation_logs"
  ON ai_generation_logs FOR ALL TO authenticated
  USING (is_backoffice_user());

-- ============================================================
-- RPC : get_ai_usage_stats(period_days)
-- Retourne : total appels, total cost, latency moyenne, taux erreur
-- ============================================================

CREATE OR REPLACE FUNCTION get_ai_usage_stats(p_period_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_calls BIGINT,
  total_cost_cents BIGINT,
  total_tokens_input BIGINT,
  total_tokens_output BIGINT,
  avg_latency_ms NUMERIC,
  error_count BIGINT,
  error_rate NUMERIC,
  unique_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
BEGIN
  v_start := now() - (p_period_days * INTERVAL '1 day');

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(SUM(cost_cents_estimated), 0)::BIGINT,
    COALESCE(SUM(tokens_input), 0)::BIGINT,
    COALESCE(SUM(tokens_output), 0)::BIGINT,
    COALESCE(ROUND(AVG(latency_ms)::NUMERIC, 0), 0),
    COUNT(*) FILTER (WHERE error_code IS NOT NULL)::BIGINT,
    CASE
      WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE error_code IS NOT NULL)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END,
    COUNT(DISTINCT user_id)::BIGINT
  FROM ai_generation_logs
  WHERE created_at >= v_start;
END;
$$;

-- ============================================================
-- RPC : get_ai_usage_by_endpoint(period_days)
-- Breakdown par endpoint (image / hashtags / copy)
-- ============================================================

CREATE OR REPLACE FUNCTION get_ai_usage_by_endpoint(p_period_days INTEGER DEFAULT 30)
RETURNS TABLE (
  endpoint TEXT,
  total_calls BIGINT,
  total_cost_cents BIGINT,
  avg_latency_ms NUMERIC,
  error_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
BEGIN
  v_start := now() - (p_period_days * INTERVAL '1 day');

  RETURN QUERY
  SELECT
    l.endpoint,
    COUNT(*)::BIGINT,
    COALESCE(SUM(l.cost_cents_estimated), 0)::BIGINT,
    COALESCE(ROUND(AVG(l.latency_ms)::NUMERIC, 0), 0),
    COUNT(*) FILTER (WHERE l.error_code IS NOT NULL)::BIGINT
  FROM ai_generation_logs l
  WHERE l.created_at >= v_start
  GROUP BY l.endpoint
  ORDER BY COUNT(*) DESC;
END;
$$;

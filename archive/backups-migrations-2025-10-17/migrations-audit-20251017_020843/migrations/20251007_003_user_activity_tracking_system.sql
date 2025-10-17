-- =====================================================
-- Migration: Système de Tracking Activité Utilisateur
-- Date: 2025-10-07
-- Description: Tables pour tracking activité utilisateur
--              professionnel et métriques productivité
-- =====================================================

-- Table: user_activity_logs
-- Stocke chaque action utilisateur avec contexte complet
CREATE TABLE IF NOT EXISTS user_activity_logs (
  -- Identifiants
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,

  -- Action tracking
  action text NOT NULL, -- 'page_view', 'create_product', 'edit_order', etc.
  table_name text, -- Table concernée si action CRUD
  record_id text, -- ID enregistrement concerné

  -- Données action
  old_data jsonb, -- État avant (pour UPDATE/DELETE)
  new_data jsonb, -- État après (pour INSERT/UPDATE)

  -- Contexte technique
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  metadata jsonb DEFAULT '{}'::jsonb, -- Contexte additionnel flexible

  -- Contexte session
  session_id text, -- ID session utilisateur
  page_url text, -- URL page où action effectuée
  user_agent text, -- Browser utilisateur
  ip_address text, -- IP (anonymisée en prod)

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Table: user_sessions
-- Agrégation sessions utilisateur pour analytics rapides
CREATE TABLE IF NOT EXISTS user_sessions (
  -- Identifiants
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,

  -- Session metrics
  session_start timestamptz NOT NULL,
  session_end timestamptz,
  last_activity timestamptz NOT NULL,

  -- Activity metrics
  pages_visited int DEFAULT 0,
  actions_count int DEFAULT 0,

  -- Time per module (JSON: {"dashboard": 120, "catalogue": 300, ...})
  time_per_module jsonb DEFAULT '{}'::jsonb,

  -- Engagement metrics
  engagement_score int DEFAULT 0, -- Calculé: actions × temps × variété

  -- Technical context
  user_agent text,
  ip_address text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

-- Index primaires pour queries fréquentes
CREATE INDEX idx_activity_logs_user_date
  ON user_activity_logs(user_id, created_at DESC);

CREATE INDEX idx_activity_logs_organisation
  ON user_activity_logs(organisation_id, created_at DESC)
  WHERE organisation_id IS NOT NULL;

CREATE INDEX idx_activity_logs_action_type
  ON user_activity_logs(action, created_at DESC);

CREATE INDEX idx_activity_logs_severity
  ON user_activity_logs(severity, created_at DESC)
  WHERE severity IN ('error', 'critical');

-- Index sessions
CREATE INDEX idx_sessions_user_date
  ON user_sessions(user_id, session_start DESC);

CREATE INDEX idx_sessions_active
  ON user_sessions(user_id, last_activity DESC)
  WHERE session_end IS NULL;

CREATE INDEX idx_sessions_session_id
  ON user_sessions(session_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Owners peuvent voir toute l'activité
CREATE POLICY "owners_view_all_activity" ON user_activity_logs
  FOR SELECT USING (
    get_user_role() = 'owner'
  );

CREATE POLICY "owners_view_all_sessions" ON user_sessions
  FOR SELECT USING (
    get_user_role() = 'owner'
  );

-- Policy: Utilisateurs voient leur propre activité (transparence)
CREATE POLICY "users_view_own_activity" ON user_activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "users_view_own_sessions" ON user_sessions
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Policy: Service role peut insérer (pour API)
CREATE POLICY "service_insert_activity" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_manage_sessions" ON user_sessions
  FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS UTILITAIRES
-- =====================================================

-- Fonction: Mise à jour automatique session
CREATE OR REPLACE FUNCTION update_user_session()
RETURNS TRIGGER AS $$
DECLARE
  v_session_id text;
  v_user_id uuid;
  v_organisation_id uuid;
  v_page_url text;
  v_module text;
BEGIN
  -- Extraire infos de l'événement
  v_session_id := NEW.session_id;
  v_user_id := NEW.user_id;
  v_organisation_id := NEW.organisation_id;
  v_page_url := NEW.page_url;

  -- Détecter module depuis URL
  v_module := CASE
    WHEN v_page_url LIKE '%/dashboard%' THEN 'dashboard'
    WHEN v_page_url LIKE '%/catalogue%' THEN 'catalogue'
    WHEN v_page_url LIKE '%/stocks%' THEN 'stocks'
    WHEN v_page_url LIKE '%/sourcing%' THEN 'sourcing'
    WHEN v_page_url LIKE '%/commandes%' THEN 'commandes'
    WHEN v_page_url LIKE '%/interactions%' THEN 'interactions'
    WHEN v_page_url LIKE '%/organisation%' THEN 'organisation'
    WHEN v_page_url LIKE '%/admin%' THEN 'admin'
    ELSE 'other'
  END;

  -- Upsert session
  INSERT INTO user_sessions (
    session_id,
    user_id,
    organisation_id,
    session_start,
    last_activity,
    pages_visited,
    actions_count,
    time_per_module,
    user_agent,
    ip_address
  ) VALUES (
    v_session_id,
    v_user_id,
    v_organisation_id,
    now(),
    now(),
    1,
    1,
    jsonb_build_object(v_module, 0),
    NEW.user_agent,
    NEW.ip_address
  )
  ON CONFLICT (session_id) DO UPDATE SET
    last_activity = now(),
    pages_visited = user_sessions.pages_visited + CASE
      WHEN NEW.action = 'page_view' THEN 1
      ELSE 0
    END,
    actions_count = user_sessions.actions_count + 1,
    time_per_module = jsonb_set(
      user_sessions.time_per_module,
      ARRAY[v_module],
      to_jsonb(COALESCE((user_sessions.time_per_module->v_module)::int, 0) + 1)
    ),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Calcul engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_user_id uuid, p_days int DEFAULT 30)
RETURNS int AS $$
DECLARE
  v_score int;
  v_sessions_count int;
  v_actions_count int;
  v_modules_variety int;
BEGIN
  -- Compter sessions actives
  SELECT COUNT(*) INTO v_sessions_count
  FROM user_sessions
  WHERE user_id = p_user_id
    AND session_start >= now() - (p_days || ' days')::interval;

  -- Compter actions totales
  SELECT COUNT(*) INTO v_actions_count
  FROM user_activity_logs
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_days || ' days')::interval;

  -- Compter variété modules utilisés
  SELECT COUNT(DISTINCT module_key) INTO v_modules_variety
  FROM user_sessions,
    LATERAL jsonb_object_keys(time_per_module) as module_key
  WHERE user_id = p_user_id
    AND session_start >= now() - (p_days || ' days')::interval;

  -- Calcul score: (sessions × 10) + (actions × 2) + (modules × 5)
  v_score := (v_sessions_count * 10) + (v_actions_count * 2) + (v_modules_variety * 5);

  -- Normaliser sur 100
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Fonction: Obtenir dernières actions utilisateur
CREATE OR REPLACE FUNCTION get_user_recent_actions(p_user_id uuid, p_limit int DEFAULT 50)
RETURNS TABLE (
  action text,
  page_url text,
  table_name text,
  record_id text,
  severity text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.action,
    l.page_url,
    l.table_name,
    l.record_id,
    l.severity,
    l.created_at
  FROM user_activity_logs l
  WHERE l.user_id = p_user_id
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Stats activité utilisateur
CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id uuid, p_days int DEFAULT 30)
RETURNS TABLE (
  total_sessions int,
  total_actions int,
  avg_session_duration interval,
  most_used_module text,
  engagement_score int,
  last_activity timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.session_id)::int as total_sessions,
    SUM(s.actions_count)::int as total_actions,
    AVG(s.session_end - s.session_start)::interval as avg_session_duration,
    (
      SELECT module
      FROM (
        SELECT
          module_key as module,
          SUM((time_per_module->module_key)::text::int) as total_time
        FROM user_sessions,
          LATERAL jsonb_object_keys(time_per_module) as module_key
        WHERE user_id = p_user_id
          AND session_start >= now() - (p_days || ' days')::interval
        GROUP BY module_key
        ORDER BY total_time DESC
        LIMIT 1
      ) sub
    ) as most_used_module,
    calculate_engagement_score(p_user_id, p_days) as engagement_score,
    MAX(s.last_activity) as last_activity
  FROM user_sessions s
  WHERE s.user_id = p_user_id
    AND s.session_start >= now() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Auto-update session à chaque activité
CREATE TRIGGER trigger_update_session_on_activity
  AFTER INSERT ON user_activity_logs
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL AND NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION update_user_session();

-- Trigger: Updated_at automatique sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTAIRES DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_activity_logs IS 'Log complet activité utilisateur pour audit et analytics';
COMMENT ON TABLE user_sessions IS 'Agrégation sessions utilisateur pour métriques rapides';
COMMENT ON FUNCTION calculate_engagement_score IS 'Calcule score engagement basé sur sessions, actions et variété modules';
COMMENT ON FUNCTION get_user_recent_actions IS 'Retourne les N dernières actions d''un utilisateur';
COMMENT ON FUNCTION get_user_activity_stats IS 'Retourne statistiques activité utilisateur période donnée';

-- =====================================================
-- VALIDATION MIGRATION
-- =====================================================

DO $$
BEGIN
  -- Vérifier tables créées
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_activity_logs') THEN
    RAISE EXCEPTION 'Table user_activity_logs non créée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') THEN
    RAISE EXCEPTION 'Table user_sessions non créée';
  END IF;

  -- Vérifier fonctions créées
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_engagement_score') THEN
    RAISE EXCEPTION 'Fonction calculate_engagement_score non créée';
  END IF;

  RAISE NOTICE '✅ Migration user activity tracking system completed successfully';
  RAISE NOTICE '📊 Tables: user_activity_logs, user_sessions';
  RAISE NOTICE '🔧 Functions: calculate_engagement_score, get_user_recent_actions, get_user_activity_stats';
  RAISE NOTICE '🔒 RLS Policies: Owners view all, Users view own activity';
END;
$$;

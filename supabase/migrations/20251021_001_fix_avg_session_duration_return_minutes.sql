-- =====================================================
-- Migration: Fix avg_session_duration Return Type
-- Date: 2025-10-21
-- Description: Convertit le retour de avg_session_duration
--              de INTERVAL → INT (minutes)
-- =====================================================

-- Problème identifié:
-- La RPC get_user_activity_stats retournait un INTERVAL PostgreSQL
-- mais le code TypeScript s'attendait à un nombre de minutes.
-- Résultat: affichage incorrect "01:23:45min" au lieu de "83min"

-- =====================================================
-- Modification de la fonction get_user_activity_stats
-- =====================================================

-- ⚠️ Drop l'ancienne fonction car changement de type de retour
DROP FUNCTION IF EXISTS get_user_activity_stats(uuid, integer);

CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id uuid, p_days int DEFAULT 30)
RETURNS TABLE (
  total_sessions int,
  total_actions int,
  avg_session_duration int,  -- ✅ Changé de interval à int (minutes)
  most_used_module text,
  engagement_score int,
  last_activity timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.session_id)::int as total_sessions,
    SUM(s.actions_count)::int as total_actions,
    -- ✅ Convertir interval en minutes (nombre entier)
    -- EXTRACT(EPOCH FROM interval) retourne secondes
    -- Division par 60 pour obtenir minutes
    COALESCE(EXTRACT(EPOCH FROM AVG(s.session_end - s.session_start))::int / 60, 0) as avg_session_duration,
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
-- Mise à jour commentaire documentation
-- =====================================================

COMMENT ON FUNCTION get_user_activity_stats IS 'Retourne statistiques activité utilisateur période donnée (avg_session_duration en minutes)';

-- =====================================================
-- Validation migration
-- =====================================================

DO $$
DECLARE
  test_result RECORD;
  test_user_id uuid;
BEGIN
  -- Récupérer un utilisateur de test (premier owner trouvé)
  SELECT user_id INTO test_user_id
  FROM user_profiles
  WHERE role = 'owner'
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    -- Tester la fonction avec le user trouvé
    SELECT * INTO test_result
    FROM get_user_activity_stats(test_user_id, 30)
    LIMIT 1;

    -- Vérifier que avg_session_duration est bien un entier (pas interval)
    IF pg_typeof(test_result.avg_session_duration)::text = 'integer' THEN
      RAISE NOTICE '✅ Migration 20251021_001 completed successfully';
      RAISE NOTICE '📊 avg_session_duration now returns INTEGER (minutes) instead of INTERVAL';
      RAISE NOTICE '🔧 Test result: % minutes', test_result.avg_session_duration;
    ELSE
      RAISE EXCEPTION '❌ Type incorrect pour avg_session_duration: %', pg_typeof(test_result.avg_session_duration);
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Aucun owner trouvé pour tester la migration';
    RAISE NOTICE '✅ Migration 20251021_001 applied (non testé)';
  END IF;
END;
$$;

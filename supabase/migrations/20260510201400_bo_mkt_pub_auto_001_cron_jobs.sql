-- ============================================================================
-- [BO-MKT-PUB-AUTO-001] Cron jobs pg_cron pour Edge Functions marketing
-- ----------------------------------------------------------------------------
-- 1. Active pg_net (necessaire pour appeler les Edge Functions via HTTP)
-- 2. Programme 2 cron jobs :
--      - sync-meta-image-insights-daily : 04:00 UTC, pull Insights IG
--      - run-scheduled-publications-every-5min : */5 *, publie les
--        scheduled_publications echues
--
-- Pre-requis runtime (a configurer une seule fois sur le projet Supabase,
-- hors migration, car le service_role_key est secret et ne doit pas etre
-- commite) :
--      SELECT vault.create_secret('<service-role-key>', 'service_role_key');
--      SELECT vault.create_secret('https://aorroydfjsrygmosnzrl.supabase.co', 'project_url');
--
-- Si l'un des deux secrets est absent au moment ou le job s'execute, l'appel
-- HTTP echoue silencieusement (pg_net log l'erreur dans net.http_response).
-- ============================================================================

-- 1. Activer pg_net
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Helper : invoque une Edge Function avec le service_role_key depuis vault
CREATE OR REPLACE FUNCTION public.invoke_edge_function(p_function_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_project_url TEXT;
  v_service_key TEXT;
  v_request_id BIGINT;
BEGIN
  SELECT decrypted_secret INTO v_project_url
    FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF v_project_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'invoke_edge_function: missing vault secret (project_url or service_role_key). Skipping %.', p_function_name;
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_project_url || '/functions/v1/' || p_function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION public.invoke_edge_function(TEXT) IS
  '[BO-MKT-PUB-AUTO-001] Helper appele par pg_cron pour invoquer une Edge Function. Lit project_url + service_role_key depuis vault.decrypted_secrets. Retourne le request_id pg_net pour audit dans net.http_response.';

-- 3. Programmer les 2 cron jobs (idempotent : unschedule avant si existant)
DO $$
BEGIN
  -- sync Meta Insights : quotidien 04:00 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-meta-image-insights-daily') THEN
    PERFORM cron.unschedule('sync-meta-image-insights-daily');
  END IF;

  PERFORM cron.schedule(
    'sync-meta-image-insights-daily',
    '0 4 * * *',
    $cron$ SELECT public.invoke_edge_function('sync-meta-image-insights'); $cron$
  );

  -- run scheduled publications : toutes les 5 minutes
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'run-scheduled-publications-every-5min') THEN
    PERFORM cron.unschedule('run-scheduled-publications-every-5min');
  END IF;

  PERFORM cron.schedule(
    'run-scheduled-publications-every-5min',
    '*/5 * * * *',
    $cron$ SELECT public.invoke_edge_function('run-scheduled-publications'); $cron$
  );
END $$;

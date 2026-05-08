-- =============================================================================
-- ROLLBACK BO-RLS-PERF-002 + BO-RLS-PERF-003
-- =============================================================================
-- Date     : 2026-05-08
-- Contexte : les migrations BO-RLS-PERF-002 (2026-05-07) et BO-RLS-PERF-003
--            (2026-05-08) ont :
--              - wrappé ~64 policies RLS public.* avec (SELECT is_backoffice_user())
--              - droppé staff_full_access_matching_rules (depuis recréé)
--              - wrappé staff_read_addresses + users_own_addresses
--              - créé idx_user_app_roles_rls_backoffice
--              - alteré is_back_office_privileged() → STABLE
--
-- Effet observé en prod 2026-05-08 03:00 :
--              - SELECT FROM auth.users : 3955 ms (vs < 1 ms attendu)
--              - service Supabase Auth GoTrue : 504 sur tous les /token
--              - back-office prod down (impossible de se connecter)
--
-- Cause probable : le wrapping (SELECT helper()) sur 60+ policies a fait
--                  exploser le coût de planification Postgres pour toute
--                  query touchant ces tables, y compris les queries internes
--                  Supabase qui re-traversent pg_policies au planning.
--
-- Ce rollback :
--   1. Unwrap toutes les policies (SELECT is_backoffice_user()) → is_backoffice_user()
--   2. Unwrap (SELECT auth.uid()) → auth.uid() sur customer_addresses
--   3. DROP idx_user_app_roles_rls_backoffice
--
-- L'unwrap est idempotent : si une policy est déjà unwrap, le ALTER POLICY
-- est inoffensif. is_back_office_privileged reste STABLE (état neutre).
-- =============================================================================

-- 1) Unwrap toutes les policies (SELECT is_backoffice_user())
DO $$
DECLARE
  rec RECORD;
  alter_sql TEXT;
  count_done INT := 0;
BEGIN
  FOR rec IN
    SELECT
      schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual LIKE '%( SELECT is_backoffice_user()%'
        OR with_check LIKE '%( SELECT is_backoffice_user()%'
        OR qual LIKE '%(SELECT is_backoffice_user()%'
        OR with_check LIKE '%(SELECT is_backoffice_user()%'
      )
  LOOP
    IF rec.cmd = 'ALL' OR rec.cmd = 'UPDATE' THEN
      alter_sql := format(
        'ALTER POLICY %I ON %I.%I USING (is_backoffice_user()) WITH CHECK (is_backoffice_user())',
        rec.policyname, rec.schemaname, rec.tablename
      );
    ELSIF rec.cmd = 'SELECT' OR rec.cmd = 'DELETE' THEN
      alter_sql := format(
        'ALTER POLICY %I ON %I.%I USING (is_backoffice_user())',
        rec.policyname, rec.schemaname, rec.tablename
      );
    ELSIF rec.cmd = 'INSERT' THEN
      alter_sql := format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (is_backoffice_user())',
        rec.policyname, rec.schemaname, rec.tablename
      );
    ELSE
      CONTINUE;
    END IF;

    EXECUTE alter_sql;
    count_done := count_done + 1;
  END LOOP;

  RAISE NOTICE 'Rollback BO-RLS-PERF-002/003 — unwrapped % policies', count_done;
END $$;

-- 2) Unwrap users_own_addresses
ALTER POLICY users_own_addresses ON public.customer_addresses
  USING (auth.uid() = user_id);

-- 3) DROP index spécifique BO-RLS-PERF-002
DROP INDEX IF EXISTS public.idx_user_app_roles_rls_backoffice;

-- 4) Refresh stats
ANALYZE auth.users;
ANALYZE public.user_app_roles;

-- [BO-RLS-PERF-002] Phase 1 — Consolidation RLS risque zéro
--
-- Audit complet (perf-optimizer 2026-05-07) a révélé sur le projet:
--
-- 1. is_back_office_privileged() est déclarée VOLATILE alors que ses 3 sœurs
--    (is_backoffice_user, is_back_office_admin, is_back_office_owner) sont
--    STABLE. Une fonction VOLATILE force PostgreSQL à la réévaluer pour
--    CHAQUE row candidate au lieu d'une seule fois par statement.
--    user_app_roles présente 160M+ seq_scan sur 9 rows — cause directe.
--
-- 2. matching_rules a 2 policies FOR ALL fonctionnellement identiques:
--    - backoffice_full_access_matching_rules USING ((SELECT is_backoffice_user()))
--    - staff_full_access_matching_rules     USING (is_backoffice_user())
--    Les deux sont évaluées pour chaque row → coût RLS doublé (73.5% seq_scan).
--
-- 3. variant_groups a staff_read_variant_groups SELECT redondant avec
--    backoffice_full_access_variant_groups FOR ALL (qui couvre déjà SELECT).
--
-- 4. ~110 policies appellent is_backoffice_user() sans le wrapping (SELECT ...).
--    Sans wrapping, la fonction est réévaluée potentiellement à chaque ligne;
--    avec wrapping, PostgreSQL met le résultat en cache pour le statement.
--    Pattern recommandé par Supabase et la règle Verone .claude/rules/database.md.
--
-- Aucune donnée touchée. Aucun droit d'accès modifié. Migration purement
-- mécanique de cohérence et de cache.

BEGIN;

-- ============================================================================
-- 1. is_back_office_privileged() VOLATILE → STABLE
-- ============================================================================
ALTER FUNCTION public.is_back_office_privileged() STABLE;

-- ============================================================================
-- 2. Suppression policies redondantes
-- ============================================================================
-- matching_rules: doublon exact de backoffice_full_access_matching_rules
DROP POLICY IF EXISTS staff_full_access_matching_rules ON public.matching_rules;

-- variant_groups: SELECT redondant avec FOR ALL backoffice_full_access_variant_groups
DROP POLICY IF EXISTS staff_read_variant_groups ON public.variant_groups;

-- ============================================================================
-- 3. Wrapping is_backoffice_user() dans (SELECT ...) — toutes les policies
-- ============================================================================
-- On parcourt toutes les policies sur le schéma public dont USING ou WITH CHECK
-- est EXACTEMENT 'is_backoffice_user()' (pas les expressions composées avec
-- OR/AND qu'on traitera dans une phase ultérieure). On les remplace par
-- (SELECT is_backoffice_user()) pour activer le cache statement-level.
DO $$
DECLARE
  r RECORD;
  v_using_count INTEGER := 0;
  v_check_count INTEGER := 0;
BEGIN
  FOR r IN
    SELECT
      c.relname AS tablename,
      p.polname,
      pg_get_expr(p.polqual, p.polrelid) AS using_clause,
      pg_get_expr(p.polwithcheck, p.polrelid) AS check_clause
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    WHERE c.relnamespace = 'public'::regnamespace
      AND (
        pg_get_expr(p.polqual, p.polrelid) = 'is_backoffice_user()'
        OR pg_get_expr(p.polwithcheck, p.polrelid) = 'is_backoffice_user()'
      )
  LOOP
    IF r.using_clause = 'is_backoffice_user()' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING ((SELECT is_backoffice_user()))',
        r.polname, r.tablename
      );
      v_using_count := v_using_count + 1;
    END IF;

    IF r.check_clause = 'is_backoffice_user()' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I WITH CHECK ((SELECT is_backoffice_user()))',
        r.polname, r.tablename
      );
      v_check_count := v_check_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '[BO-RLS-PERF-002] % USING wrappés, % WITH CHECK wrappés',
    v_using_count, v_check_count;
END $$;

-- ============================================================================
-- 4. Index dédié RLS back-office sur user_app_roles
-- ============================================================================
-- L'index existant idx_user_app_roles_rls_linkme cible app='linkme'.
-- Les helpers is_backoffice_user/admin/owner/privileged cherchent app='back-office'
-- avec is_active=true — non couvert spécifiquement par les indexes existants.
-- Sans CONCURRENTLY car la table a 9 rows (lock négligeable, < 100 ms).
CREATE INDEX IF NOT EXISTS idx_user_app_roles_rls_backoffice
ON public.user_app_roles (user_id, app, is_active)
WHERE app = 'back-office';

COMMIT;

-- ============================================================================
-- Vérifications post-migration (read-only, dans un nouveau bloc)
-- ============================================================================
DO $$
DECLARE
  v_unwrapped INT;
  v_volatile INT;
  v_index_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_unwrapped
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  WHERE c.relnamespace = 'public'::regnamespace
    AND (
      pg_get_expr(p.polqual, p.polrelid) = 'is_backoffice_user()'
      OR pg_get_expr(p.polwithcheck, p.polrelid) = 'is_backoffice_user()'
    );

  SELECT COUNT(*) INTO v_volatile
  FROM pg_proc
  WHERE proname IN (
      'is_backoffice_user', 'is_back_office_admin',
      'is_back_office_owner', 'is_back_office_privileged'
    )
    AND provolatile = 'v';

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_user_app_roles_rls_backoffice'
  ) INTO v_index_exists;

  RAISE NOTICE '[BO-RLS-PERF-002] vérifications:';
  RAISE NOTICE '  - Policies is_backoffice_user() non wrappées restantes: %',
    v_unwrapped;
  RAISE NOTICE '  - Helpers staff encore VOLATILE: %', v_volatile;
  RAISE NOTICE '  - Index idx_user_app_roles_rls_backoffice présent: %',
    v_index_exists;

  IF v_volatile > 0 THEN
    RAISE WARNING '[BO-RLS-PERF-002] Au moins une helper staff est encore VOLATILE.';
  END IF;
  IF v_unwrapped > 0 THEN
    RAISE WARNING '[BO-RLS-PERF-002] Restent % policies non wrappées (à investiguer).',
      v_unwrapped;
  END IF;
  IF NOT v_index_exists THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002] Index user_app_roles_rls_backoffice absent — migration incomplète.';
  END IF;
END $$;

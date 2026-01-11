-- Migration: Fix Function Search Path (Security Advisor)
--
-- PROBLEME: 206 fonctions n'ont pas de search_path defini
-- Cela peut permettre des attaques par injection de schema
--
-- SOLUTION: Definir search_path = public pour toutes les fonctions
--
-- NOTE: Cette migration utilise une approche dynamique pour eviter
-- de lister manuellement 206 fonctions
--
-- @since 2026-01-11

-- ============================================================================
-- STEP 1: Creer une fonction helper pour appliquer search_path
-- ============================================================================
CREATE OR REPLACE FUNCTION fix_function_search_path()
RETURNS TABLE(function_name text, result text) AS $$
DECLARE
  rec RECORD;
  sql_stmt text;
BEGIN
  FOR rec IN
    SELECT
      n.nspname as schema_name,
      p.proname as func_name,
      pg_get_function_identity_arguments(p.oid) as func_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    LEFT JOIN pg_settings s ON s.name = 'search_path' AND s.source = 'function'
    WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- Only functions, not procedures
    AND p.proname NOT LIKE 'pg_%'  -- Exclude system functions
    AND p.proname NOT LIKE '_pg_%'
    AND NOT EXISTS (
      -- Skip functions that already have search_path set
      SELECT 1 FROM pg_proc p2
      WHERE p2.oid = p.oid
      AND p2.proconfig IS NOT NULL
      AND 'search_path=public' = ANY(p2.proconfig)
    )
  LOOP
    BEGIN
      sql_stmt := format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        rec.schema_name,
        rec.func_name,
        rec.func_args
      );
      EXECUTE sql_stmt;
      function_name := rec.schema_name || '.' || rec.func_name;
      result := 'OK';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      function_name := rec.schema_name || '.' || rec.func_name;
      result := 'ERROR: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- STEP 2: Executer le fix sur toutes les fonctions
-- ============================================================================
DO $$
DECLARE
  v_fixed integer := 0;
  v_errors integer := 0;
  rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM fix_function_search_path() LOOP
    IF rec.result = 'OK' THEN
      v_fixed := v_fixed + 1;
    ELSE
      v_errors := v_errors + 1;
      RAISE WARNING 'Failed to fix %: %', rec.function_name, rec.result;
    END IF;
  END LOOP;

  RAISE NOTICE 'search_path fix complete: % functions fixed, % errors', v_fixed, v_errors;
END $$;

-- ============================================================================
-- STEP 3: Cleanup - Supprimer la fonction helper
-- ============================================================================
DROP FUNCTION IF EXISTS fix_function_search_path();

-- ============================================================================
-- STEP 4: Verification manuelle des fonctions critiques
-- Les fonctions utilisees dans RLS doivent avoir search_path = public
-- ============================================================================

-- is_staff_user - utilisee dans RLS
ALTER FUNCTION IF EXISTS public.is_staff_user() SET search_path = public;

-- is_admin - utilisee dans RLS
ALTER FUNCTION IF EXISTS public.is_admin() SET search_path = public;

-- get_user_role - utilisee dans RLS
ALTER FUNCTION IF EXISTS public.get_user_role() SET search_path = public;

-- get_user_organisation_id - utilisee dans RLS
ALTER FUNCTION IF EXISTS public.get_user_organisation_id() SET search_path = public;

-- has_scope - utilisee dans RLS
ALTER FUNCTION IF EXISTS public.has_scope(text) SET search_path = public;

-- get_linkme_channel_id - utilisee dans LinkMe
ALTER FUNCTION IF EXISTS public.get_linkme_channel_id() SET search_path = public;

-- ============================================================================
-- VERIFICATION FINALE
-- ============================================================================
DO $$
DECLARE
  v_remaining integer;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname NOT LIKE 'pg_%'
  AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)));

  IF v_remaining > 0 THEN
    RAISE WARNING 'Still % functions without search_path=public', v_remaining;
  ELSE
    RAISE NOTICE 'All public functions now have search_path=public';
  END IF;
END $$;

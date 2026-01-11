-- Migration: Fix Remaining RLS Performance Issues
--
-- Fixes 114 policies by wrapping auth function calls in subqueries
-- to ensure they are evaluated once per query instead of per row.
--
-- Patterns fixed:
--   get_current_user_id() → (SELECT get_current_user_id())
--   get_user_role() → (SELECT get_user_role())
--   is_customer_user() → (SELECT is_customer_user())
--   auth.role() → (SELECT auth.role())
--   auth.uid() IN → (SELECT auth.uid()) IN
--
-- @since 2026-01-11

-- ============================================================================
-- DYNAMIC POLICY FIXER
-- Uses pg_policies to identify and recreate policies with optimized patterns
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
  new_qual TEXT;
  new_with_check TEXT;
  role_clause TEXT;
  fixed_count INTEGER := 0;
BEGIN
  -- Iterate through all policies that need fixing
  FOR pol IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
      -- Policies with unoptimized function calls
      (qual LIKE '%get_current_user_id()%' AND qual NOT LIKE '%SELECT get_current_user_id()%')
      OR (qual LIKE '%get_user_role()%' AND qual NOT LIKE '%SELECT get_user_role()%')
      OR (qual LIKE '%is_customer_user()%' AND qual NOT LIKE '%SELECT is_customer_user()%')
      OR (qual LIKE '%auth.role()%' AND qual NOT LIKE '%SELECT auth.role()%')
      OR (with_check LIKE '%get_current_user_id()%' AND with_check NOT LIKE '%SELECT get_current_user_id()%')
      OR (with_check LIKE '%get_user_role()%' AND with_check NOT LIKE '%SELECT get_user_role()%')
      OR (with_check LIKE '%is_customer_user()%' AND with_check NOT LIKE '%SELECT is_customer_user()%')
      OR (with_check LIKE '%auth.role()%' AND with_check NOT LIKE '%SELECT auth.role()%')
    )
  LOOP
    -- Apply replacements to qual
    new_qual := pol.qual;
    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, 'get_current_user_id\(\)', '(SELECT get_current_user_id())', 'g');
      new_qual := regexp_replace(new_qual, 'get_user_role\(\)', '(SELECT get_user_role())', 'g');
      new_qual := regexp_replace(new_qual, 'is_customer_user\(\)', '(SELECT is_customer_user())', 'g');
      new_qual := regexp_replace(new_qual, 'auth\.role\(\)', '(SELECT auth.role())', 'g');
    END IF;

    -- Apply replacements to with_check
    new_with_check := pol.with_check;
    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, 'get_current_user_id\(\)', '(SELECT get_current_user_id())', 'g');
      new_with_check := regexp_replace(new_with_check, 'get_user_role\(\)', '(SELECT get_user_role())', 'g');
      new_with_check := regexp_replace(new_with_check, 'is_customer_user\(\)', '(SELECT is_customer_user())', 'g');
      new_with_check := regexp_replace(new_with_check, 'auth\.role\(\)', '(SELECT auth.role())', 'g');
    END IF;

    -- Build role clause
    IF pol.roles = '{public}' THEN
      role_clause := '';
    ELSE
      role_clause := ' TO ' || array_to_string(pol.roles, ', ');
    END IF;

    -- Drop and recreate policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

    IF pol.cmd = 'ALL' THEN
      IF new_with_check IS NOT NULL THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR ALL%s USING (%s) WITH CHECK (%s)',
          pol.policyname, pol.schemaname, pol.tablename, role_clause, new_qual, new_with_check
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR ALL%s USING (%s)',
          pol.policyname, pol.schemaname, pol.tablename, role_clause, new_qual
        );
      END IF;
    ELSIF pol.cmd = 'SELECT' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR SELECT%s USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename, role_clause, new_qual
      );
    ELSIF pol.cmd = 'INSERT' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR INSERT%s WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename, role_clause, COALESCE(new_with_check, new_qual)
      );
    ELSIF pol.cmd = 'UPDATE' THEN
      IF new_with_check IS NOT NULL THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR UPDATE%s USING (%s) WITH CHECK (%s)',
          pol.policyname, pol.schemaname, pol.tablename, role_clause, new_qual, new_with_check
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR UPDATE%s USING (%s)',
          pol.policyname, pol.schemaname, pol.tablename, role_clause, new_qual
        );
      END IF;
    ELSIF pol.cmd = 'DELETE' THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR DELETE%s USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename, role_clause, new_qual
      );
    END IF;

    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed policy: %.%', pol.tablename, pol.policyname;
  END LOOP;

  RAISE NOTICE 'Total policies fixed: %', fixed_count;
END $$;

-- ============================================================================
-- FIX auth.uid() IN patterns (6 remaining)
-- These need special handling because the pattern is auth.uid() IN (SELECT...)
-- ============================================================================

-- linkme_affiliates_staff_all
DROP POLICY IF EXISTS "linkme_affiliates_staff_all" ON linkme_affiliates;
CREATE POLICY "linkme_affiliates_staff_all" ON linkme_affiliates
FOR ALL TO public
USING (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

-- linkme_commissions_staff_all
DROP POLICY IF EXISTS "linkme_commissions_staff_all" ON linkme_commissions;
CREATE POLICY "linkme_commissions_staff_all" ON linkme_commissions
FOR ALL TO public
USING (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

-- linkme_tracking_staff_all
DROP POLICY IF EXISTS "linkme_tracking_staff_all" ON linkme_tracking;
CREATE POLICY "linkme_tracking_staff_all" ON linkme_tracking
FOR ALL TO public
USING (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

-- Back-office staff can view all request items
DROP POLICY IF EXISTS "Back-office staff can view all request items" ON linkme_payment_request_items;
CREATE POLICY "Back-office staff can view all request items" ON linkme_payment_request_items
FOR SELECT TO public
USING (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

-- Back-office staff can create request items
DROP POLICY IF EXISTS "Back-office staff can create request items" ON linkme_payment_request_items;
CREATE POLICY "Back-office staff can create request items" ON linkme_payment_request_items
FOR INSERT TO public
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

-- Back-office staff can create payment requests
DROP POLICY IF EXISTS "Back-office staff can create payment requests" ON linkme_payment_requests;
CREATE POLICY "Back-office staff can create payment requests" ON linkme_payment_requests
FOR INSERT TO public
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Count remaining unoptimized policies
  SELECT COUNT(*) INTO v_remaining
  FROM pg_policies
  WHERE schemaname = 'public'
  AND (
    (qual LIKE '%get_current_user_id()%' AND qual NOT LIKE '%SELECT get_current_user_id()%')
    OR (qual LIKE '%get_user_role()%' AND qual NOT LIKE '%SELECT get_user_role()%')
    OR (qual LIKE '%is_customer_user()%' AND qual NOT LIKE '%SELECT is_customer_user()%')
    OR (qual LIKE '%auth.role()%' AND qual NOT LIKE '%SELECT auth.role()%')
    OR (qual LIKE '%auth.uid() IN%' AND qual NOT LIKE '%SELECT auth.uid()%')
  );

  RAISE NOTICE 'Remaining unoptimized policies: %', v_remaining;

  IF v_remaining > 0 THEN
    RAISE WARNING 'Some policies may still need manual attention!';
  ELSE
    RAISE NOTICE 'All policies optimized successfully!';
  END IF;
END $$;

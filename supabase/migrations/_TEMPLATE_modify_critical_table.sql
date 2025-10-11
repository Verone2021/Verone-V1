-- ====================================================================
-- 🔒 TEMPLATE: Safe Modification of Critical Table
-- ====================================================================
-- Table: user_profiles (or other critical auth-related table)
-- Date: YYYY-MM-DD (À REMPLIR)
-- Author: [Your name] (À REMPLIR)
-- Ticket/Issue: [Link if applicable] (À REMPLIR)
-- Description: [What you're modifying and why] (À REMPLIR)
-- ====================================================================

-- ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
-- 🚨 CRITICAL TABLE MODIFICATION CHECKLIST
-- ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
--
-- Before running this migration, verify ALL items below:
-- Replace [ ] with [x] when verified
--
-- [ ] 1. RLS will remain ENABLED after this change
--        → Check: No "ALTER TABLE ... DISABLE ROW LEVEL SECURITY"
--
-- [ ] 2. No modification to auth.users foreign key
--        → Check: No "ALTER TABLE ... DROP CONSTRAINT user_profiles_id_fkey"
--        → Check: No modification to "id" column
--
-- [ ] 3. New columns are OPTIONAL (nullable or have defaults)
--        → Check: All new columns have "NULL" or "DEFAULT value"
--        → Avoid: "ADD COLUMN foo TEXT NOT NULL" without default
--
-- [ ] 4. No DROP COLUMN on existing fields
--        → Check: No columns removed (only additions allowed)
--        → If must drop: Document why + senior review required
--
-- [ ] 5. CHECK constraints are non-breaking (allow existing data)
--        → Check: Constraints use "IS NULL OR ..." pattern
--        → Avoid: Constraints that fail on existing NULL values
--
-- [ ] 6. Triggers use "security definer" if cross-schema
--        → Check: Any trigger accessing auth.* has SECURITY DEFINER
--        → Example: "CREATE FUNCTION ... SECURITY DEFINER"
--
-- [ ] 7. Tested on local Supabase instance FIRST
--        → Check: Migration ran successfully locally
--        → Check: Auth flow tested (login, signup, profile edit)
--
-- [ ] 8. Rollback plan documented below
--        → Check: Section "ROLLBACK PLAN" is filled
--        → Check: Rollback steps are clear and tested
--
-- [ ] 9. No references to non-PK columns of auth.users
--        → Check: Only "auth.users(id)" is referenced
--        → Avoid: "auth.users.email", "auth.users.created_at", etc.
--
-- [ ] 10. Senior developer reviewed (if major change)
--         → Check: If altering types, dropping columns, or modifying FK
--         → Check: Code review completed + approved
--
-- ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️


-- ====================================================================
-- 📋 ROLLBACK PLAN
-- ====================================================================
-- If this migration fails or breaks authentication:
--
-- Step 1: [Describe first rollback action]
-- Example: DROP COLUMN IF EXISTS new_field;
--
-- Step 2: [Describe second rollback action]
-- Example: Remove CHECK constraint added
--
-- Step 3: Verify auth intact
-- Run: SELECT * FROM auth.users LIMIT 1;
-- Expected: Query succeeds without error
--
-- Step 4: Test login flow
-- Action: Attempt login via frontend
-- Expected: User can login successfully
--
-- Emergency contacts:
-- - Senior Dev: [Name/Email]
-- - Supabase Support: https://supabase.com/support
--
-- ====================================================================


-- ====================================================================
-- 🔧 MIGRATION START
-- ====================================================================

-- Example 1: Adding safe optional column
-- Uncomment and modify as needed:

/*
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS example_field TEXT;

COMMENT ON COLUMN user_profiles.example_field IS
'Description of new field

Type: TEXT
Nullable: YES
Safe to modify - Not used in authentication flow.

Added: YYYY-MM-DD
Purpose: [Explain why this field is needed]';
*/


-- Example 2: Adding non-breaking CHECK constraint
-- Uncomment and modify as needed:

/*
ALTER TABLE user_profiles
ADD CONSTRAINT check_example_field_format CHECK (
  example_field IS NULL OR -- Allow NULL (non-breaking)
  LENGTH(example_field) >= 3 AND LENGTH(example_field) <= 100
);
*/


-- Example 3: Creating performance index
-- Uncomment and modify as needed:

/*
CREATE INDEX IF NOT EXISTS idx_user_profiles_example_field
ON user_profiles(example_field)
WHERE example_field IS NOT NULL; -- Partial index for efficiency
*/


-- Example 4: Adding foreign key to another table (SAFE)
-- Uncomment and modify as needed:

/*
-- Adding relation to organisations table (future feature)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS organisation_id UUID
REFERENCES organisations(id) ON DELETE SET NULL; -- SET NULL preserves user_profiles

COMMENT ON COLUMN user_profiles.organisation_id IS
'Optional link to organisation

Type: UUID
Nullable: YES
Foreign Key: organisations(id) ON DELETE SET NULL

Safe operation:
• Does NOT affect auth.users link
• Optional field (NULL allowed)
• ON DELETE SET NULL preserves user profile if org deleted

Added: YYYY-MM-DD
Purpose: [Explain why organisation link is needed]';

CREATE INDEX IF NOT EXISTS idx_user_profiles_organisation_id
ON user_profiles(organisation_id)
WHERE organisation_id IS NOT NULL;
*/


-- Example 5: Creating SECURITY DEFINER trigger (if needed)
-- Uncomment and modify as needed:

/*
-- Function must be SECURITY DEFINER to access auth schema
CREATE OR REPLACE FUNCTION private.sync_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- REQUIRED for cross-schema access
SET search_path = public, auth
AS $$
BEGIN
  -- Example: Update auth.users metadata when profile changes
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'full_name', NEW.first_name || ' ' || NEW.last_name,
    'updated_at', NOW()
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger activates on profile update
CREATE TRIGGER on_user_profile_update
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_user_metadata();

COMMENT ON FUNCTION private.sync_user_metadata() IS
'Syncs user_profiles changes to auth.users metadata

SECURITY DEFINER: Required to update auth.users from public schema
Safe: Only updates metadata, not critical auth fields

Added: YYYY-MM-DD
Purpose: [Explain why sync is needed]';
*/


-- ====================================================================
-- ✅ VALIDATION TESTS (AUTOMATIC - DO NOT REMOVE)
-- ====================================================================
-- These tests run automatically after migration
-- If any test fails, migration is rolled back
-- ====================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  fk_exists BOOLEAN;
  id_column_type TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Running Critical Table Safety Checks...';
  RAISE NOTICE '';

  -- ================================================================
  -- TEST 1: RLS Still Enabled
  -- ================================================================
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE tablename = 'user_profiles' AND schemaname = 'public';

  IF NOT rls_enabled THEN
    RAISE EXCEPTION '❌ CRITICAL FAILURE: RLS is DISABLED on user_profiles!

    This is a CRITICAL security issue.

    Fix:
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

    Then re-run migration.';
  END IF;

  RAISE NOTICE '✅ Test 1/5 PASSED: RLS is ENABLED';


  -- ================================================================
  -- TEST 2: RLS Policies Still Active
  -- ================================================================
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_profiles';

  IF policy_count < 4 THEN
    RAISE EXCEPTION '❌ CRITICAL FAILURE: Only % RLS policies found (expected 4+)

    Missing policies will break authentication and authorization.

    Expected policies:
    - owners_can_manage_all_profiles
    - users_can_manage_own_profile
    - owners_can_view_all_user_details
    - users_can_view_profiles

    Check if migration accidentally dropped policies.', policy_count;
  END IF;

  RAISE NOTICE '✅ Test 2/5 PASSED: % RLS policies active', policy_count;


  -- ================================================================
  -- TEST 3: Foreign Key to auth.users Intact
  -- ================================================================
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'user_profiles'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'id'
      AND ccu.table_name = 'users' -- auth.users appears as 'users'
  ) INTO fk_exists;

  IF NOT fk_exists THEN
    RAISE EXCEPTION '❌ CRITICAL FAILURE: Foreign key to auth.users is BROKEN!

    This will break authentication completely.

    Fix:
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

    Then re-run migration.';
  END IF;

  RAISE NOTICE '✅ Test 3/5 PASSED: Foreign key auth.users(id) intact';


  -- ================================================================
  -- TEST 4: Primary Key Column Unchanged
  -- ================================================================
  SELECT data_type INTO id_column_type
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND column_name = 'id';

  IF id_column_type != 'uuid' THEN
    RAISE EXCEPTION '❌ CRITICAL FAILURE: Column "id" type changed from UUID to %

    This will break all auth references.

    Fix: Restore column to UUID type
    ALTER TABLE user_profiles ALTER COLUMN id TYPE UUID;

    Then re-run migration.', id_column_type;
  END IF;

  RAISE NOTICE '✅ Test 4/5 PASSED: Primary key "id" is UUID';


  -- ================================================================
  -- TEST 5: Table Still Exists and Accessible
  -- ================================================================
  PERFORM 1 FROM user_profiles LIMIT 1;

  RAISE NOTICE '✅ Test 5/5 PASSED: Table accessible';


  -- ================================================================
  -- ALL TESTS PASSED
  -- ================================================================
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ ALL SAFETY CHECKS PASSED ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration completed successfully.';
  RAISE NOTICE 'Authentication system integrity verified.';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Post-migration actions:';
  RAISE NOTICE '1. Test auth flow manually (login, signup, profile edit)';
  RAISE NOTICE '2. Monitor Sentry for auth-related errors';
  RAISE NOTICE '3. Update documentation if schema changed';
  RAISE NOTICE '4. Commit migration with descriptive message';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '❌❌❌ VALIDATION FAILED ❌❌❌';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE '🔄 ROLLBACK REQUIRED';
    RAISE NOTICE 'Follow rollback plan documented above.';
    RAISE NOTICE '';

    -- Re-raise exception to fail migration
    RAISE;
END $$;


-- ====================================================================
-- 📊 OPTIONAL: Display Current Table State
-- ====================================================================
-- Uncomment to see table structure after migration

/*
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
*/


-- ====================================================================
-- 🎯 MIGRATION COMPLETE
-- ====================================================================
-- Remember to:
-- 1. Test authentication flow thoroughly
-- 2. Monitor production for issues
-- 3. Document changes in CHANGELOG or PR description
-- 4. Update any affected frontend/backend code
-- ====================================================================

-- ====================================================================
-- CRITICAL TABLE PROTECTION: user_profiles
-- Date: 2025-10-12
-- Description: Marquage table user_profiles comme CRITIQUE pour auth
-- Best Practice 2025: SQL Comments visibles pour prévention erreurs
-- ====================================================================

-- ====================================================================
-- 🔒 COMMENT PRINCIPAL TABLE
-- ====================================================================

COMMENT ON TABLE user_profiles IS
'🔒 CRITICAL TABLE - Authentication Dependency

⚠️  DANGER ZONE - Read BEFORE modifying this table:

═══════════════════════════════════════════════════════════════════
🚨 RÈGLES ABSOLUES SUPABASE 2025
═══════════════════════════════════════════════════════════════════

1. ❌ NEVER modify auth schema (auth.users, auth.sessions, etc.)
2. ✅ ONLY reference auth.users(id) - Primary Key guaranteed stable
3. ✅ ALWAYS use "on delete cascade" for auth.users foreign keys
4. ✅ ALWAYS use "security definer" for cross-schema triggers
5. ✅ NEVER disable RLS on this table

═══════════════════════════════════════════════════════════════════
✅ OPÉRATIONS SÛRES
═══════════════════════════════════════════════════════════════════

• ADD COLUMN (champs optionnels uniquement)
• CREATE INDEX (optimisation performance)
• ADD CHECK constraint (validation non-breaking)

═══════════════════════════════════════════════════════════════════
❌ OPÉRATIONS DANGEREUSES (Require senior review)
═══════════════════════════════════════════════════════════════════

• ALTER COLUMN (type, nullability, default)
• DROP COLUMN (suppression champ)
• MODIFY foreign key vers auth.users
• DISABLE RLS (désactivation sécurité)

═══════════════════════════════════════════════════════════════════
📋 WORKFLOW MODIFICATION SÉCURISÉE
═══════════════════════════════════════════════════════════════════

1. Copier template: supabase/migrations/_TEMPLATE_modify_critical_table.sql
2. Remplir checklist 10 points
3. Tester sur instance locale AVANT production
4. Exécuter migration (validations auto)

═══════════════════════════════════════════════════════════════════
📚 DOCUMENTATION
═══════════════════════════════════════════════════════════════════

• Règles: manifests/database-standards/CRITICAL-TABLES-PROTECTION.md
• Template: supabase/migrations/_TEMPLATE_modify_critical_table.sql
• Checklist: TASKS/templates/CRITICAL-TABLE-MIGRATION-CHECKLIST.md
• Pattern: MEMORY-BANK/patterns/critical-table-protection-pattern.md

═══════════════════════════════════════════════════════════════════
🔍 ÉTAT ACTUEL (Verified: 2025-10-12)
═══════════════════════════════════════════════════════════════════

• RLS Status: ✅ ENABLED
• Policies: ✅ 4 policies active
• Foreign key: ✅ user_id → auth.users(id)
• Primary key: user_id (UUID)

Created: 2025-10-12
Framework: Critical Table Protection 2025
Maintainer: Vérone Dev Team';


-- ====================================================================
-- 🔒 COMMENTS COLONNES CRITIQUES
-- ====================================================================

COMMENT ON COLUMN user_profiles.user_id IS
'🔒 PRIMARY KEY - CRITICAL COLUMN

Type: UUID
Source: auth.users(id)
Relation: FOREIGN KEY with ON DELETE CASCADE

⚠️  DO NOT MODIFY - Breaking this = Breaking authentication

Reference: manifests/database-standards/CRITICAL-TABLES-PROTECTION.md';


COMMENT ON COLUMN user_profiles.role IS
'🔒 USER ROLE - AUTHORIZATION CRITICAL

Type: user_role_type ENUM
Values: owner | admin | staff | customer
Required: YES (NOT NULL)

⚠️  Changing affects authorization & RLS policies

Reference: manifests/database-standards/CRITICAL-TABLES-PROTECTION.md';


COMMENT ON COLUMN user_profiles.user_type IS
'🔒 USER TYPE - BUSINESS LOGIC CRITICAL

Type: user_type ENUM
Values: staff | customer
Default: staff

⚠️  Used in business logic & UI visibility

Reference: manifests/database-standards/CRITICAL-TABLES-PROTECTION.md';


COMMENT ON COLUMN user_profiles.first_name IS
'User first name (optional, max 50 chars)
Safe to modify - Not used in auth flow';


COMMENT ON COLUMN user_profiles.last_name IS
'User last name (optional, max 50 chars)
Safe to modify - Not used in auth flow';


COMMENT ON COLUMN user_profiles.phone IS
'French phone number (optional, validated)
Safe to modify - Not used in auth flow';


COMMENT ON COLUMN user_profiles.job_title IS
'Job title/position (optional, max 100 chars)
Safe to modify - Not used in auth flow';


-- ====================================================================
-- 📊 VALIDATION ÉTAT ACTUEL
-- ====================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  fk_exists BOOLEAN;
BEGIN
  -- Test 1: RLS activé
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE tablename = 'user_profiles' AND schemaname = 'public';

  IF NOT rls_enabled THEN
    RAISE EXCEPTION '❌ CRITICAL: RLS is DISABLED on user_profiles!';
  END IF;

  -- Test 2: Policies actives
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_profiles';

  IF policy_count < 4 THEN
    RAISE WARNING '⚠️  Only % policies on user_profiles (expected 4+)', policy_count;
  END IF;

  -- Test 3: Foreign key vers auth.users
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_user_id_fkey'
      AND contype = 'f'
  ) INTO fk_exists;

  IF NOT fk_exists THEN
    RAISE EXCEPTION '❌ CRITICAL: Foreign key to auth.users is MISSING!';
  END IF;

  -- Succès
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ CRITICAL TABLE PROTECTION APPLIED ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 user_profiles protection summary:';
  RAISE NOTICE '   ✅ RLS: ENABLED';
  RAISE NOTICE '   ✅ Policies: % active', policy_count;
  RAISE NOTICE '   ✅ Foreign Key: user_id → auth.users(id)';
  RAISE NOTICE '   ✅ SQL Comments: Visible in database';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Documentation available at:';
  RAISE NOTICE '   - manifests/database-standards/CRITICAL-TABLES-PROTECTION.md';
  RAISE NOTICE '   - supabase/migrations/_TEMPLATE_modify_critical_table.sql';
  RAISE NOTICE '   - TASKS/templates/CRITICAL-TABLE-MIGRATION-CHECKLIST.md';
  RAISE NOTICE '   - MEMORY-BANK/patterns/critical-table-protection-pattern.md';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Framework: Critical Table Protection 2025';
  RAISE NOTICE '   Simple > Complex | Documentation > Locking';
  RAISE NOTICE '';

END $$;

-- Script: Create Owner User for Vérone
-- Creates initial owner user: veronebyromeo@gmail.com
-- Must be run AFTER user is created in Supabase Auth

-- ========================================
-- OWNER USER SETUP
-- ========================================

-- Note: This assumes the user has already been created via Supabase Auth
-- with email: veronebyromeo@gmail.com and password: Abc123456

-- Get the Vérone organisation ID
DO $$
DECLARE
  verone_org_id UUID;
  owner_user_id UUID;
BEGIN
  -- Get Vérone organisation
  SELECT id INTO verone_org_id
  FROM organisations
  WHERE slug = 'verone';

  IF verone_org_id IS NULL THEN
    RAISE EXCEPTION 'Vérone organisation not found. Run migrations first.';
  END IF;

  -- Get the owner user ID (replace with actual UUID after user creation)
  -- This will need to be updated with the actual auth.users.id after Supabase Auth user creation
  SELECT id INTO owner_user_id
  FROM auth.users
  WHERE email = 'veronebyromeo@gmail.com';

  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Owner user not found in auth.users. Create user in Supabase Auth first.';
  END IF;

  -- Create user profile
  INSERT INTO user_profiles (user_id, role, scopes)
  VALUES (
    owner_user_id,
    'owner',
    ARRAY[
      'security:manage',
      'users:manage',
      'billing:manage',
      'system:configure',
      'data:delete_permanent',
      'backups:manage',
      'can_manage_rls',
      'can_manage_integrations',
      'can_delete_permanently',
      'can_view_audit_logs'
    ]
  ) ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    scopes = EXCLUDED.scopes,
    updated_at = NOW();

  -- Create organisation assignment
  INSERT INTO user_organisation_assignments (
    user_id,
    organisation_id,
    role,
    scopes,
    is_active
  ) VALUES (
    owner_user_id,
    verone_org_id,
    'owner',
    ARRAY[
      'security:manage',
      'users:manage',
      'billing:manage',
      'system:configure',
      'data:delete_permanent',
      'backups:manage'
    ],
    TRUE
  ) ON CONFLICT (user_id, organisation_id) DO UPDATE SET
    role = EXCLUDED.role,
    scopes = EXCLUDED.scopes,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  -- Update feed configs to assign to owner
  UPDATE feed_configs
  SET created_by = owner_user_id
  WHERE created_by IS NULL;

  RAISE NOTICE 'Owner user setup completed for: veronebyromeo@gmail.com';
  RAISE NOTICE 'User ID: %', owner_user_id;
  RAISE NOTICE 'Organisation: %', verone_org_id;

END $$;

-- ========================================
-- VALIDATION
-- ========================================

-- Test RLS functions work with the new owner
DO $$
DECLARE
  test_role TEXT;
  test_org_id UUID;
BEGIN
  -- This test assumes we can simulate the auth context
  -- In real usage, this would be tested through the application

  RAISE NOTICE 'Owner user created successfully. Test RLS manually through application.';

  -- Display current setup
  RAISE NOTICE 'Current users in system:';

  -- Note: This query might not work due to RLS, but shows the structure
  PERFORM email, role, org.name as organisation
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN user_organisation_assignments uoa ON u.id = uoa.user_id
  LEFT JOIN organisations org ON uoa.organisation_id = org.id
  WHERE u.email = 'veronebyromeo@gmail.com';

END $$;

-- ========================================
-- MANUAL VERIFICATION QUERIES
-- ========================================

-- These queries help verify the setup manually

-- 1. Check user profile exists
-- SELECT up.*, u.email
-- FROM user_profiles up
-- JOIN auth.users u ON up.user_id = u.id
-- WHERE u.email = 'veronebyromeo@gmail.com';

-- 2. Check organisation assignment
-- SELECT uoa.*, u.email, o.name as organisation
-- FROM user_organisation_assignments uoa
-- JOIN auth.users u ON uoa.user_id = u.id
-- JOIN organisations o ON uoa.organisation_id = o.id
-- WHERE u.email = 'veronebyromeo@gmail.com';

-- 3. Test RLS functions (run as the owner user)
-- SELECT get_user_role() as current_role;
-- SELECT get_user_organisation_id() as current_org;
-- SELECT has_scope('security:manage') as can_manage_security;

-- ========================================
-- NEXT STEPS
-- ========================================

/*
MANUAL STEPS REQUIRED:

1. Create user in Supabase Auth Dashboard:
   - Email: veronebyromeo@gmail.com
   - Password: Abc123456
   - Confirm email verification

2. Get the actual auth.users.id for the created user

3. Update this script with the real UUID if needed

4. Run this script to create profiles and assignments

5. Test login through the application

6. Verify RLS policies work correctly:
   - Owner can see all data
   - Create test users with other roles
   - Verify access restrictions work

7. Test feed configurations:
   - Generate test feeds
   - Verify access controls
   - Check performance

SECURITY NOTES:
- Change default password immediately after first login
- Enable 2FA for owner account
- Regular audit of permissions and access
- Monitor for suspicious activity
*/
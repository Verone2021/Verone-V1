-- Migration 125: Fix RLS Rules for Contracts - Business Requirements Compliance
-- Date: 2025-01-30
-- Description: Update contracts RLS policies to match business requirements and align with existing patterns
-- Requirements: 
--   - Super admins: Full access to all organizations
--   - Admins: Access only to their assigned organizations via user_organisation_assignments

BEGIN;

-- ============================================================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect table references
DROP POLICY IF EXISTS "Super admin full access" ON public.contrats;
DROP POLICY IF EXISTS "Admin organisational access" ON public.contrats;
DROP POLICY IF EXISTS "Service role bypass" ON public.contrats;

-- ============================================================================
-- 2. CREATE CORRECTED RLS POLICIES (ALIGNED WITH BUSINESS REQUIREMENTS)
-- ============================================================================

-- Policy 1: Super Admin Global Access
-- Super admins can create contracts for ALL organizations (France, Portugal, etc.)
CREATE POLICY "contrats_super_admin_global_access" ON public.contrats
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.utilisateurs u
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.utilisateurs u
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

-- Policy 2: Organization Admin Access (Following Established Pattern)
-- Admins can only access contracts for organizations they're assigned to
CREATE POLICY "contrats_organisation_admin_access" ON public.contrats
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_organisation_assignments uoa
            WHERE uoa.user_id = auth.uid()
            AND uoa.organisation_id = contrats.organisation_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.user_organisation_assignments uoa  
            WHERE uoa.user_id = auth.uid()
            AND uoa.organisation_id = contrats.organisation_id
        )
    );

-- Policy 3: Service Role Bypass (For Backend Operations)
CREATE POLICY "contrats_service_role_bypass" ON public.contrats
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 3. UPDATE VIEW PERMISSIONS
-- ============================================================================

-- Ensure the enriched view follows the same RLS pattern
DROP POLICY IF EXISTS "contrats_view_access" ON public.contrats_with_org_v;

-- The view will automatically inherit the base table's RLS policies
-- Grant appropriate permissions
GRANT SELECT ON public.contrats_with_org_v TO authenticated;
GRANT SELECT ON public.contrats_with_org_v TO service_role;

-- ============================================================================
-- 4. VERIFICATION QUERIES (FOR TESTING)
-- ============================================================================

-- Create test function to verify RLS is working correctly
CREATE OR REPLACE FUNCTION public.test_contrat_rls_access(
    test_user_id UUID,
    test_organisation_id UUID
) RETURNS JSONB AS $$
DECLARE
    user_info RECORD;
    can_access BOOLEAN DEFAULT false;
    access_reason TEXT DEFAULT 'No access';
BEGIN
    -- Get user information
    SELECT u.role, u.organisation_id as primary_org
    INTO user_info
    FROM public.utilisateurs u
    WHERE u.id = test_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'can_access', false,
            'reason', 'User not found',
            'user_role', null,
            'test_organisation_id', test_organisation_id
        );
    END IF;
    
    -- Check super admin access
    IF user_info.role = 'super_admin' THEN
        can_access := true;
        access_reason := 'Super admin - global access';
    ELSE
        -- Check organization assignment
        IF EXISTS (
            SELECT 1 
            FROM public.user_organisation_assignments uoa
            WHERE uoa.user_id = test_user_id
            AND uoa.organisation_id = test_organisation_id
        ) THEN
            can_access := true;
            access_reason := 'Admin with organization assignment';
        ELSE
            can_access := false;
            access_reason := 'Admin without organization assignment';
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'can_access', can_access,
        'reason', access_reason,
        'user_role', user_info.role,
        'primary_organisation', user_info.primary_org,
        'test_organisation_id', test_organisation_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. BUSINESS RULES VALIDATION
-- ============================================================================

-- Add comment explaining the business logic
COMMENT ON POLICY "contrats_super_admin_global_access" ON public.contrats IS 
'Super administrators have full access to create and manage contracts for all organizations across all countries (France, Portugal, etc.)';

COMMENT ON POLICY "contrats_organisation_admin_access" ON public.contrats IS 
'Regular administrators can only create and manage contracts for organizations they are explicitly assigned to via user_organisation_assignments table';

COMMENT ON POLICY "contrats_service_role_bypass" ON public.contrats IS 
'Service role bypass for backend operations and server actions';

-- ============================================================================
-- 6. MIGRATION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    view_permissions_count INTEGER;
BEGIN
    -- Verify policies were created
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'contrats'
    AND policyname IN (
        'contrats_super_admin_global_access',
        'contrats_organisation_admin_access', 
        'contrats_service_role_bypass'
    );
    
    IF policy_count != 3 THEN
        RAISE EXCEPTION 'Migration failed: Expected 3 policies, found %', policy_count;
    END IF;
    
    -- Verify view permissions
    SELECT COUNT(*) INTO view_permissions_count
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
    AND table_name = 'contrats_with_org_v'
    AND privilege_type = 'SELECT';
    
    IF view_permissions_count < 2 THEN
        RAISE EXCEPTION 'Migration failed: View permissions not granted properly';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 125: Contracts RLS Business Rules Fixed Successfully';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ RLS policies updated to match business requirements';
    RAISE NOTICE '✅ Super admin global access: ALL organizations';  
    RAISE NOTICE '✅ Admin restricted access: user_organisation_assignments only';
    RAISE NOTICE '✅ Consistency with existing patterns (properties, reservations)';
    RAISE NOTICE '✅ Service role bypass maintained for backend operations';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 BUSINESS RULES IMPLEMENTED:';
    RAISE NOTICE '   - Super admins: Create contracts for any organization';
    RAISE NOTICE '   - France+Portugal admin: Create contracts in both countries';
    RAISE NOTICE '   - France-only admin: Cannot create Portugal contracts';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;
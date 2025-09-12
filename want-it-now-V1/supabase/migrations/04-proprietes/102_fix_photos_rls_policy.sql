-- ============================================================================
-- Migration: Fix Photo Upload RLS Issues
-- Description: Disable RLS on propriete_photos as access is controlled at app level
-- Author: Romeo
-- Date: 2025-08-25
-- ============================================================================

-- 1. Disable RLS on propriete_photos table
-- Access control is managed at the application level through property access
ALTER TABLE public.propriete_photos DISABLE ROW LEVEL SECURITY;

-- 2. Grant necessary permissions
GRANT ALL ON public.propriete_photos TO authenticated;
GRANT ALL ON public.propriete_photos TO service_role;

-- 3. Ensure sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Add comment explaining the architecture
COMMENT ON TABLE public.propriete_photos IS 
'Table for property and unit photos. RLS disabled - access control managed at application level through property/unit permissions.';

-- ============================================================================
-- End of migration
-- ============================================================================
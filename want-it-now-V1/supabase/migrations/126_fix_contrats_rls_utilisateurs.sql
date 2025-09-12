-- Migration 126: Fix contrats RLS policies to use utilisateurs table
-- Date: 2025-01-30
-- Addresses the issue where RLS policies reference wrong tables

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admin full access" ON public.contrats;
DROP POLICY IF EXISTS "Admin organisational access" ON public.contrats;
DROP POLICY IF EXISTS "Service role bypass" ON public.contrats;
DROP POLICY IF EXISTS "contrats_super_admin_global_access" ON public.contrats;
DROP POLICY IF EXISTS "contrats_organisation_admin_access" ON public.contrats;
DROP POLICY IF EXISTS "contrats_service_role_bypass" ON public.contrats;

-- Create super admin policy (global access to all contracts)
CREATE POLICY "contrats_super_admin_global_access" ON public.contrats
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.utilisateurs u 
        WHERE u.id = auth.uid() 
        AND u.role = 'super_admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.utilisateurs u 
        WHERE u.id = auth.uid() 
        AND u.role = 'super_admin'
    ));

-- Create admin policy (organization-specific access via utilisateurs.organisation_id)  
CREATE POLICY "contrats_organisation_admin_access" ON public.contrats
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.utilisateurs u 
        WHERE u.id = auth.uid() 
        AND u.role = 'admin' 
        AND u.organisation_id = contrats.organisation_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.utilisateurs u 
        WHERE u.id = auth.uid() 
        AND u.role = 'admin' 
        AND u.organisation_id = contrats.organisation_id
    ));

-- Service role bypass for server actions
CREATE POLICY "contrats_service_role_bypass" ON public.contrats
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment for tracking
COMMENT ON TABLE public.contrats IS 'RLS policies updated to use utilisateurs table - Migration 126';
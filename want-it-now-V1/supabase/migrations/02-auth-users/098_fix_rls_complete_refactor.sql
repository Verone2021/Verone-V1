-- ============================================================================
-- REFACTORING COMPLET RLS - MEILLEURES PRATIQUES SUPABASE
-- ============================================================================
-- Résout le problème auth.uid() = NULL dans Server Actions
-- Simplifie toutes les politiques RLS selon documentation officielle
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: HELPER FUNCTIONS ROBUSTES AVEC SECURITY DEFINER
-- ============================================================================

-- 1. Function auth.user_id() avec fallback JWT claims
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
BEGIN
  -- Try auth.uid() first, fallback to JWT claims if NULL
  RETURN COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::json->>'sub')::UUID
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Function is_super_admin() simplifiée
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.user_id() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Function can_manage_organisation() pour admins et super_admins
CREATE OR REPLACE FUNCTION public.can_manage_organisation(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin can manage any organisation
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Admin can manage their own organisation
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.user_id() 
    AND organisation_id = org_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Function can_view_property() pour l'accès aux propriétés
CREATE OR REPLACE FUNCTION public.can_view_property(property_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prop_org_id UUID;
BEGIN
  -- Get the organisation_id of the property
  SELECT organisation_id INTO prop_org_id
  FROM public.proprietes
  WHERE id = property_id;
  
  IF prop_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Super admin can view any property
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- User with any role in the organisation can view
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.user_id() 
    AND organisation_id = prop_org_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Function can_manage_property() pour création/modification
CREATE OR REPLACE FUNCTION public.can_manage_property(property_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prop_org_id UUID;
BEGIN
  -- Get the organisation_id of the property
  SELECT organisation_id INTO prop_org_id
  FROM public.proprietes
  WHERE id = property_id;
  
  IF prop_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Super admin can manage any property
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Admin can manage properties in their organisation
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.user_id() 
    AND organisation_id = prop_org_id
    AND role IN ('admin', 'proprietaire')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. Function get_user_organisations() pour filtrage
CREATE OR REPLACE FUNCTION public.get_user_organisations()
RETURNS SETOF UUID AS $$
BEGIN
  -- Super admin sees all organisations
  IF is_super_admin() THEN
    RETURN QUERY SELECT id FROM public.organisations;
  ELSE
    -- Return organisations where user has a role
    RETURN QUERY 
    SELECT DISTINCT organisation_id 
    FROM public.user_roles 
    WHERE user_id = auth.user_id();
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 2: REFACTORING RLS POLICIES - TABLE PROPRIETES
-- ============================================================================

-- Drop all existing policies on proprietes
DROP POLICY IF EXISTS "proprietes_select_policy" ON public.proprietes;
DROP POLICY IF EXISTS "proprietes_insert_policy" ON public.proprietes;
DROP POLICY IF EXISTS "proprietes_update_policy" ON public.proprietes;
DROP POLICY IF EXISTS "proprietes_delete_policy" ON public.proprietes;
DROP POLICY IF EXISTS "service_role_all_proprietes" ON public.proprietes;

-- Enable RLS
ALTER TABLE public.proprietes ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view properties in their organisations
CREATE POLICY "proprietes_select" ON public.proprietes
FOR SELECT TO authenticated
USING (
  organisation_id IN (SELECT get_user_organisations())
);

-- INSERT: Super admins can create in any org, admins in their org
CREATE POLICY "proprietes_insert" ON public.proprietes
FOR INSERT TO authenticated
WITH CHECK (
  is_super_admin() OR 
  can_manage_organisation(organisation_id)
);

-- UPDATE: Can update if can manage the property
CREATE POLICY "proprietes_update" ON public.proprietes
FOR UPDATE TO authenticated
USING (can_manage_property(id))
WITH CHECK (can_manage_property(id));

-- DELETE: Only super admins can delete
CREATE POLICY "proprietes_delete" ON public.proprietes
FOR DELETE TO authenticated
USING (is_super_admin());

-- Service role bypass (for server actions)
CREATE POLICY "proprietes_service_role" ON public.proprietes
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ÉTAPE 3: REFACTORING RLS POLICIES - TABLE PROPRIETE_PHOTOS
-- ============================================================================

-- Drop all existing policies on propriete_photos
DROP POLICY IF EXISTS "propriete_photos_select" ON public.propriete_photos;
DROP POLICY IF EXISTS "propriete_photos_insert" ON public.propriete_photos;
DROP POLICY IF EXISTS "propriete_photos_update" ON public.propriete_photos;
DROP POLICY IF EXISTS "propriete_photos_delete" ON public.propriete_photos;
DROP POLICY IF EXISTS "propriete_photos_manage_admin" ON public.propriete_photos;
DROP POLICY IF EXISTS "service_role_all_photos" ON public.propriete_photos;

-- Enable RLS
ALTER TABLE public.propriete_photos ENABLE ROW LEVEL SECURITY;

-- SELECT: Can view photos if can view property
CREATE POLICY "photos_select" ON public.propriete_photos
FOR SELECT TO authenticated
USING (can_view_property(propriete_id));

-- INSERT: Can add photos if can manage property
CREATE POLICY "photos_insert" ON public.propriete_photos
FOR INSERT TO authenticated
WITH CHECK (can_manage_property(propriete_id));

-- UPDATE: Can update photos if can manage property
CREATE POLICY "photos_update" ON public.propriete_photos
FOR UPDATE TO authenticated
USING (can_manage_property(propriete_id))
WITH CHECK (can_manage_property(propriete_id));

-- DELETE: Can delete photos if can manage property
CREATE POLICY "photos_delete" ON public.propriete_photos
FOR DELETE TO authenticated
USING (can_manage_property(propriete_id));

-- Service role bypass
CREATE POLICY "photos_service_role" ON public.propriete_photos
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ÉTAPE 4: STORAGE BUCKET POLICIES
-- ============================================================================

-- Drop existing storage policies
DELETE FROM storage.policies WHERE bucket_id = 'propriete-photos';

-- Create simple storage policies

-- SELECT: Can view files if authenticated
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'propriete-photos',
  'authenticated_can_view',
  'authenticated'::text,
  'SELECT'::text
);

-- INSERT: Can upload if authenticated
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'propriete-photos',
  'authenticated_can_upload',
  'authenticated'::text,
  'INSERT'::text
);

-- UPDATE: Can update if authenticated
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'propriete-photos',
  'authenticated_can_update',
  'authenticated'::text,
  'UPDATE'::text
);

-- DELETE: Can delete if authenticated
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'propriete-photos',
  'authenticated_can_delete',
  'authenticated'::text,
  'DELETE'::text
);

-- ============================================================================
-- ÉTAPE 5: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_organisation(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_property(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_property(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_organisations() TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add verification comments
COMMENT ON FUNCTION auth.user_id() IS 'Returns current user ID with JWT fallback for Server Actions';
COMMENT ON FUNCTION public.is_super_admin() IS 'Checks if current user is super_admin';
COMMENT ON FUNCTION public.can_manage_organisation(UUID) IS 'Checks if user can manage specific organisation';
COMMENT ON FUNCTION public.can_view_property(UUID) IS 'Checks if user can view specific property';
COMMENT ON FUNCTION public.can_manage_property(UUID) IS 'Checks if user can manage specific property';
COMMENT ON FUNCTION public.get_user_organisations() IS 'Returns organisations accessible to current user';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Refactoring Complete!';
  RAISE NOTICE '✅ Helper functions created with SECURITY DEFINER';
  RAISE NOTICE '✅ Proprietes policies simplified';
  RAISE NOTICE '✅ Propriete_photos policies simplified';
  RAISE NOTICE '✅ Storage policies simplified';
  RAISE NOTICE '✅ Ready for testing!';
END $$;
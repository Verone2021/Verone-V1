-- =====================================================
-- Migration: Simplified Documents RLS Policies
-- Date: 2025-01-14
-- Description: Simple but effective RLS for documents table
-- Based on: Existing Vérone architecture
-- =====================================================

-- 1. Drop any existing policies first
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;

-- 2. Simple RLS policies based on roles and authentication

-- Policy 1: SELECT - Authenticated users with proper roles can view documents
CREATE POLICY "documents_select_policy" ON documents
  FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- Policy 2: INSERT - Authenticated users with proper roles can create documents
CREATE POLICY "documents_insert_policy" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
    AND user_id = (SELECT auth.uid())
  );

-- Policy 3: UPDATE - Document owner + admins can update
CREATE POLICY "documents_update_policy" ON documents
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR get_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR get_user_role() IN ('owner', 'admin')
  );

-- Policy 4: DELETE - Document owner + owners only
CREATE POLICY "documents_delete_policy" ON documents
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR get_user_role() = 'owner'
  );

-- 3. Comments for documentation
COMMENT ON POLICY "documents_select_policy" ON documents IS
'Owner/Admin/Catalog Manager roles can view all documents';

COMMENT ON POLICY "documents_insert_policy" ON documents IS
'Owner/Admin/Catalog Manager roles can create documents, user_id must match auth.uid()';

COMMENT ON POLICY "documents_update_policy" ON documents IS
'Document owners and admin roles can update documents';

COMMENT ON POLICY "documents_delete_policy" ON documents IS
'Document owners and system owners can delete documents';

-- 4. Verification message
DO $$
BEGIN
  RAISE NOTICE 'Simple Documents RLS policies created successfully';
  RAISE NOTICE 'Policies created: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE 'Based on get_user_role() and user ownership patterns';
END $$;
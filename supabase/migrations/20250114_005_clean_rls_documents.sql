-- =====================================================
-- Migration: Clean ALL RLS Policies for Documents
-- Date: 2025-01-14
-- Description: Remove all conflicting RLS policies and create ONE simple policy
-- =====================================================

-- 1. DROP ALL existing policies on documents table
DROP POLICY IF EXISTS "authenticated_users_can_upload_documents" ON documents;
DROP POLICY IF EXISTS "authenticated_users_can_view_documents" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "users_can_delete_own_documents" ON documents;
DROP POLICY IF EXISTS "users_can_update_own_documents" ON documents;

-- 2. Create ONE simple and effective INSERT policy
CREATE POLICY "documents_simple_insert" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- 3. Create simple SELECT policy (for reading documents)
CREATE POLICY "documents_simple_select" ON documents
  FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to view documents

-- 4. Create simple UPDATE policy
CREATE POLICY "documents_simple_update" ON documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Create simple DELETE policy
CREATE POLICY "documents_simple_delete" ON documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Comments for documentation
COMMENT ON POLICY "documents_simple_insert" ON documents IS
'Simple INSERT policy: authenticated users can insert documents with their user_id';

COMMENT ON POLICY "documents_simple_select" ON documents IS
'Simple SELECT policy: all authenticated users can view documents';

COMMENT ON POLICY "documents_simple_update" ON documents IS
'Simple UPDATE policy: users can only update their own documents';

COMMENT ON POLICY "documents_simple_delete" ON documents IS
'Simple DELETE policy: users can only delete their own documents';

-- 7. Final notice
DO $$
BEGIN
  RAISE NOTICE 'Documents RLS policies cleaned and simplified';
  RAISE NOTICE 'Removed 8 conflicting policies';
  RAISE NOTICE 'Created 4 simple and effective policies';
  RAISE NOTICE 'Policy focus: authenticated users only, user_id = auth.uid()';
END $$;
-- =====================================================
-- Migration: Fix Documents Table RLS Policies
-- Date: 2025-01-14
-- Description: Add missing columns and RLS policies for documents table
-- Based on: Official Supabase RLS best practices
-- =====================================================

-- 1. Add missing columns for RLS ownership
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;

-- Set defaults for existing rows (will be updated by application)
UPDATE documents SET
  user_id = (SELECT id FROM auth.users LIMIT 1),
  organisation_id = (SELECT id FROM organisations LIMIT 1)
WHERE user_id IS NULL OR organisation_id IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE documents
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN organisation_id SET NOT NULL;

-- 2. Create performance indexes for RLS policies
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_organisation_id ON documents(organisation_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_org ON documents(user_id, organisation_id);

-- 3. Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies based on Supabase official best practices

-- Policy 1: SELECT - Users can view documents from their organization + role-based access
CREATE POLICY "documents_select_policy" ON documents
  FOR SELECT
  TO authenticated
  USING (
    -- Own documents
    user_id = (SELECT auth.uid())
    OR
    -- Same organisation with appropriate roles
    (
      organisation_id IN (
        SELECT uoa.organisation_id
        FROM user_organisation_assignments uoa
        WHERE uoa.user_id = (SELECT auth.uid())
      )
      AND get_user_role() IN ('owner', 'admin', 'catalog_manager')
    )
    OR
    -- Public documents (if access_level = 'public')
    access_level = 'public'
  );

-- Policy 2: INSERT - Authenticated users with proper roles can create documents
CREATE POLICY "documents_insert_policy" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated
    (SELECT auth.uid()) IS NOT NULL
    AND
    -- User must have appropriate role
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
    AND
    -- User must belong to the target organisation
    organisation_id IN (
      SELECT uoa.organisation_id
      FROM user_organisation_assignments uoa
      WHERE uoa.user_id = (SELECT auth.uid())
    )
    AND
    -- User_id must match authenticated user
    user_id = (SELECT auth.uid())
  );

-- Policy 3: UPDATE - Document owner + admins can update
CREATE POLICY "documents_update_policy" ON documents
  FOR UPDATE
  TO authenticated
  USING (
    -- Document owner
    user_id = (SELECT auth.uid())
    OR
    -- Organisation admins/owners
    (
      organisation_id IN (
        SELECT uoa.organisation_id
        FROM user_organisation_assignments uoa
        WHERE uoa.user_id = (SELECT auth.uid())
      )
      AND get_user_role() IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    user_id = (SELECT auth.uid())
    OR
    (
      organisation_id IN (
        SELECT uoa.organisation_id
        FROM user_organisation_assignments uoa
        WHERE uoa.user_id = (SELECT auth.uid())
      )
      AND get_user_role() IN ('owner', 'admin')
    )
  );

-- Policy 4: DELETE - Document owner + organisation owners only
CREATE POLICY "documents_delete_policy" ON documents
  FOR DELETE
  TO authenticated
  USING (
    -- Document owner
    user_id = (SELECT auth.uid())
    OR
    -- Organisation owners only (more restrictive for delete)
    (
      organisation_id IN (
        SELECT uoa.organisation_id
        FROM user_organisation_assignments uoa
        WHERE uoa.user_id = (SELECT auth.uid())
      )
      AND get_user_role() = 'owner'
    )
  );

-- 5. Update document_permissions and document_versions tables for consistency
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Policy for document_permissions (inherit from documents)
CREATE POLICY "document_permissions_policy" ON document_permissions
  FOR ALL
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents
      WHERE user_id = (SELECT auth.uid())
      OR get_user_role() IN ('owner', 'admin')
    )
  );

-- Policy for document_versions (inherit from documents)
CREATE POLICY "document_versions_policy" ON document_versions
  FOR ALL
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents
      WHERE user_id = (SELECT auth.uid())
      OR get_user_role() IN ('owner', 'admin', 'catalog_manager')
    )
  );

-- 6. Comments and documentation
COMMENT ON COLUMN documents.user_id IS 'Owner of the document - references auth.users(id)';
COMMENT ON COLUMN documents.organisation_id IS 'Organisation owning the document - references organisations(id)';

COMMENT ON POLICY "documents_select_policy" ON documents IS
'Users can view: own documents, organisation documents (with proper roles), public documents';

COMMENT ON POLICY "documents_insert_policy" ON documents IS
'Authenticated users with owner/admin/catalog_manager roles can create documents in their organisation';

COMMENT ON POLICY "documents_update_policy" ON documents IS
'Document owners and organisation admins/owners can update documents';

COMMENT ON POLICY "documents_delete_policy" ON documents IS
'Document owners and organisation owners can delete documents';

-- 7. Final verification
DO $$
BEGIN
  RAISE NOTICE 'Documents RLS policies created successfully';
  RAISE NOTICE 'Added columns: user_id, organisation_id';
  RAISE NOTICE 'Added indexes for performance optimization';
  RAISE NOTICE 'Created 4 RLS policies following Supabase best practices';
END $$;
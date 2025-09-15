-- =====================================================
-- Migration: Temporary RLS Bypass for Development
-- Date: 2025-01-14
-- Description: Allow document upload without authentication for testing
-- TEMPORARY SOLUTION - TO BE REMOVED IN PRODUCTION
-- =====================================================

-- 1. Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "documents_simple_insert" ON documents;

-- 2. Create a BYPASS policy for development
CREATE POLICY "documents_development_bypass" ON documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true); -- Allow all inserts temporarily

-- 3. Comment for documentation
COMMENT ON POLICY "documents_development_bypass" ON documents IS
'TEMPORARY BYPASS POLICY - Allow all document uploads for development testing. REMOVE IN PRODUCTION!';

-- 4. Notice
DO $$
BEGIN
  RAISE NOTICE 'TEMPORARY RLS BYPASS ENABLED FOR DOCUMENTS';
  RAISE NOTICE 'This policy allows all document uploads for development';
  RAISE NOTICE 'REMEMBER TO REMOVE THIS POLICY IN PRODUCTION!';
END $$;
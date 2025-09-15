-- =====================================================
-- Migration: Cleanup Simple Image Management
-- Date: 2025-01-14
-- Description: Remove complex document management system, keep only simple image upload to storage buckets
-- =====================================================

-- 1. DROP COMPLEX DOCUMENT TABLES
-- ========================================

-- Drop dependent tables first (foreign key constraints)
DROP TABLE IF EXISTS document_downloads CASCADE;
DROP TABLE IF EXISTS document_permissions CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;

-- Drop main documents table
DROP TABLE IF EXISTS documents CASCADE;

-- 2. DROP DOCUMENT-RELATED ENUMS
-- ========================================

DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_category CASCADE;

-- 3. DROP DOCUMENT-RELATED FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS classify_document_type(text) CASCADE;
DROP FUNCTION IF EXISTS validate_document_filters(jsonb) CASCADE;

-- 4. DROP DOCUMENT-RELATED VIEWS
-- ========================================

DROP VIEW IF EXISTS active_documents CASCADE;
DROP VIEW IF EXISTS document_storage_summary CASCADE;

-- 5. COMMENT ON REMAINING SIMPLE STRUCTURE
-- ========================================

COMMENT ON TABLE families IS 'Familles produits avec image_url simple pour photos';
COMMENT ON COLUMN families.image_url IS 'URL directe vers image stockée dans bucket family-images';

COMMENT ON TABLE categories IS 'Catégories avec image_url simple pour photos';
COMMENT ON COLUMN categories.image_url IS 'URL directe vers image stockée dans bucket category-images';

COMMENT ON TABLE subcategories IS 'Sous-catégories avec image_url simple pour photos';
COMMENT ON COLUMN subcategories.image_url IS 'URL directe vers image stockée dans bucket category-images';

-- 6. VALIDATION - ENSURE STORAGE BUCKETS EXIST
-- ========================================

-- Verify buckets exist (should already be created by previous migrations)
DO $$
BEGIN
  -- Check if buckets exist in storage.buckets
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'family-images') THEN
    RAISE NOTICE 'WARNING: Bucket family-images does not exist. Run 20250114_001_create_image_storage.sql first';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'category-images') THEN
    RAISE NOTICE 'WARNING: Bucket category-images does not exist. Run 20250114_001_create_image_storage.sql first';
  END IF;

  RAISE NOTICE 'Simple image management cleanup completed successfully';
  RAISE NOTICE 'Architecture: Upload → Storage Bucket → Public URL → families.image_url';
END $$;
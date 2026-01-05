-- ============================================================================
-- Migration: Cleanup broken LinkMe showcase RPCs
-- ============================================================================
-- These RPCs reference tables that don't exist in production:
-- - linkme_showcase_collections
-- - linkme_showcase_collection_items
--
-- The tables were created in local migration but never applied to production.
-- The RPCs are dead code that will error if called.
-- ============================================================================

-- Drop broken RPCs that reference non-existent tables
DROP FUNCTION IF EXISTS get_linkme_showcase_products();
DROP FUNCTION IF EXISTS get_linkme_showcase_collections_with_products();

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

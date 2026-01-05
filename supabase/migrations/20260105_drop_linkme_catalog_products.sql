-- ============================================================================
-- Migration: Drop obsolete linkme_catalog_products table and RPC
-- ============================================================================
-- The linkme_catalog_products table is OBSOLETE since 2025-12-02
-- All catalog data now comes from channel_pricing table
--
-- This migration removes:
-- 1. RPC get_linkme_catalog_products_for_affiliate() - no longer used in code
-- 2. Table linkme_catalog_products - 352 useless duplicate products
-- ============================================================================

-- 1. Drop the obsolete RPC (queries the obsolete table)
DROP FUNCTION IF EXISTS get_linkme_catalog_products_for_affiliate(UUID);
DROP FUNCTION IF EXISTS get_linkme_catalog_products_for_affiliate();

-- 2. Drop the obsolete RPC that adds products to the obsolete catalog
DROP FUNCTION IF EXISTS add_products_to_linkme_catalog(UUID[]);

-- 3. Drop the obsolete table
DROP TABLE IF EXISTS linkme_catalog_products CASCADE;

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

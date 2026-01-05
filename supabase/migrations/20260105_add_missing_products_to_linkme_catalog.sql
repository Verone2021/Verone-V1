-- ============================================================================
-- Migration: Add missing products to LinkMe catalog
-- ============================================================================
-- Les produits generaux (non sur-mesure, non client-specific) doivent etre
-- dans le catalogue LinkMe pour etre selectionnables par les affilies.
--
-- Criteres d'inclusion:
-- - Pas un produit sur-mesure enseigne (enseigne_id IS NULL)
-- - Pas un produit client specifique (assigned_client_id IS NULL)
-- ============================================================================

-- Insert missing products into linkme_catalog_products
INSERT INTO linkme_catalog_products (product_id, is_enabled, is_public_showcase)
SELECT
    p.id,
    true,   -- is_enabled = true (visible dans les selections)
    true    -- is_public_showcase = true (visible dans le catalogue public)
FROM products p
WHERE p.id NOT IN (SELECT product_id FROM linkme_catalog_products)
  AND p.enseigne_id IS NULL
  AND p.assigned_client_id IS NULL
ON CONFLICT (product_id) DO NOTHING;

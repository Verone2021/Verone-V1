-- ============================================================================
-- Migration: Correction RPC LinkMe - Utiliser selling_price_ht
-- Date: 2025-12-02
-- Description: Corrige les RPC pour utiliser lcp.selling_price_ht au lieu de
--              p.price_ht (qui n'existe pas) ou p.cost_price (prix d'achat)
--              Le selling_price_ht est le prix de vente minimum modifiable
--              Fallback sur cost_price si selling_price_ht est NULL
--
-- Colonnes vérifiées:
--   - products: sku, name, cost_price, stock_real (INTEGER), subcategory_id
--   - product_images: public_url (pas image_url)
--   - Pas de family_id dans products, seulement subcategory_id
-- ============================================================================

-- ============================================================================
-- 1. DROP les fonctions existantes
-- ============================================================================

DROP FUNCTION IF EXISTS get_linkme_catalog_products_for_affiliate(UUID);
DROP FUNCTION IF EXISTS get_linkme_showcase_products();
DROP FUNCTION IF EXISTS get_linkme_showcase_collections_with_products();

-- ============================================================================
-- 2. RECREATE: get_linkme_catalog_products_for_affiliate
-- Utilise lcp.selling_price_ht au lieu de p.price_ht
-- ============================================================================

CREATE OR REPLACE FUNCTION get_linkme_catalog_products_for_affiliate(p_affiliate_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  is_enabled BOOLEAN,
  is_public_showcase BOOLEAN,
  max_margin_rate NUMERIC,
  min_margin_rate NUMERIC,
  suggested_margin_rate NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  custom_selling_points TEXT[],
  linkme_commission_rate NUMERIC,
  views_count INTEGER,
  selections_count INTEGER,
  display_order INTEGER,
  is_featured BOOLEAN,
  -- Product fields
  product_name TEXT,
  product_reference TEXT,
  product_price_ht NUMERIC,
  product_image_url TEXT,
  product_stock_real NUMERIC,
  product_is_active BOOLEAN,
  product_family_name TEXT,
  product_category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lcp.id,
    lcp.product_id,
    lcp.is_enabled,
    lcp.is_public_showcase,
    lcp.max_margin_rate,
    lcp.min_margin_rate,
    lcp.suggested_margin_rate,
    lcp.custom_title,
    lcp.custom_description,
    lcp.custom_selling_points,
    lcp.linkme_commission_rate,
    lcp.views_count,
    lcp.selections_count,
    lcp.display_order,
    lcp.is_featured,
    p.name AS product_name,
    p.sku AS product_reference,
    COALESCE(lcp.selling_price_ht, p.cost_price, 0) AS product_price_ht,
    (
      SELECT pi.image_url
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = true
      LIMIT 1
    ) AS product_image_url,
    p.stock_real AS product_stock_real,
    (p.product_status = 'active') AS product_is_active,
    f.name AS product_family_name,
    sc.name AS product_category_name
  FROM linkme_catalog_products lcp
  JOIN products p ON p.id = lcp.product_id
  LEFT JOIN families f ON f.id = p.family_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE lcp.is_enabled = true
    AND p.product_status = 'active'
    AND p.stock_real > 0
  ORDER BY lcp.is_featured DESC, lcp.display_order ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. RECREATE: get_linkme_showcase_products
-- Utilise lcp.selling_price_ht au lieu de p.price_ht
-- ============================================================================

CREATE OR REPLACE FUNCTION get_linkme_showcase_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  max_margin_rate NUMERIC,
  suggested_margin_rate NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  custom_selling_points TEXT[],
  display_order INTEGER,
  is_featured BOOLEAN,
  -- Product fields
  product_name TEXT,
  product_reference TEXT,
  product_price_ht NUMERIC,
  product_image_url TEXT,
  product_family_name TEXT,
  product_category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lcp.id,
    lcp.product_id,
    lcp.max_margin_rate,
    lcp.suggested_margin_rate,
    lcp.custom_title,
    lcp.custom_description,
    lcp.custom_selling_points,
    lcp.display_order,
    lcp.is_featured,
    p.name AS product_name,
    p.sku AS product_reference,
    COALESCE(lcp.selling_price_ht, p.cost_price, 0) AS product_price_ht,
    (
      SELECT pi.image_url
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = true
      LIMIT 1
    ) AS product_image_url,
    f.name AS product_family_name,
    sc.name AS product_category_name
  FROM linkme_catalog_products lcp
  JOIN products p ON p.id = lcp.product_id
  LEFT JOIN families f ON f.id = p.family_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE lcp.is_public_showcase = true
    AND lcp.is_enabled = true
    AND p.product_status = 'active'
    AND p.stock_real > 0
  ORDER BY lcp.is_featured DESC, lcp.display_order ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. RECREATE: get_linkme_showcase_collections_with_products
-- Utilise lcp.selling_price_ht au lieu de p.price_ht
-- ============================================================================

CREATE OR REPLACE FUNCTION get_linkme_showcase_collections_with_products()
RETURNS TABLE (
  collection_id UUID,
  collection_name TEXT,
  collection_slug TEXT,
  collection_description TEXT,
  collection_image_url TEXT,
  collection_layout_type TEXT,
  collection_display_order INTEGER,
  products JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS collection_id,
    c.name AS collection_name,
    c.slug AS collection_slug,
    c.description AS collection_description,
    c.image_url AS collection_image_url,
    c.layout_type AS collection_layout_type,
    c.display_order AS collection_display_order,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', COALESCE(lcp.custom_title, p.name),
          'reference', p.sku,
          'price_ht', COALESCE(lcp.selling_price_ht, p.cost_price, 0),
          'image_url', (
            SELECT pi.image_url
            FROM product_images pi
            WHERE pi.product_id = p.id AND pi.is_primary = true
            LIMIT 1
          ),
          'max_margin_rate', lcp.max_margin_rate,
          'suggested_margin_rate', lcp.suggested_margin_rate,
          'display_order', ci.display_order
        ) ORDER BY ci.display_order
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) AS products
  FROM linkme_showcase_collections c
  LEFT JOIN linkme_showcase_collection_items ci ON ci.collection_id = c.id
  LEFT JOIN products p ON p.id = ci.product_id AND p.product_status = 'active' AND p.stock_real > 0
  LEFT JOIN linkme_catalog_products lcp ON lcp.product_id = p.id AND lcp.is_enabled = true
  WHERE c.is_active = true
  GROUP BY c.id, c.name, c.slug, c.description, c.image_url, c.layout_type, c.display_order
  ORDER BY c.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_linkme_catalog_products_for_affiliate(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_showcase_products() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_showcase_collections_with_products() TO anon, authenticated;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_linkme_catalog_products_for_affiliate(UUID) IS
'Récupère les produits du catalogue LinkMe pour affiliés.
Utilise lcp.selling_price_ht (prix de vente minimum modifiable) au lieu de p.cost_price (prix d''achat).
Fallback sur cost_price si selling_price_ht est NULL.
Corrigé: 2025-12-02';

COMMENT ON FUNCTION get_linkme_showcase_products() IS
'Récupère les produits vitrine pour visiteurs non connectés.
Utilise lcp.selling_price_ht pour le prix affiché.
Corrigé: 2025-12-02';

COMMENT ON FUNCTION get_linkme_showcase_collections_with_products() IS
'Récupère les collections vitrines avec leurs produits.
Utilise lcp.selling_price_ht pour le prix affiché.
Corrigé: 2025-12-02';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

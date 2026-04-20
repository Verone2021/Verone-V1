-- ============================================================================
-- Migration: SI-DESC-001 (1/2) — LinkMe RPC lit depuis products directement
-- Date: 2026-04-21
-- Description:
--   get_linkme_catalog_products_for_affiliate retournait les colonnes
--   channel_pricing.custom_{title,description,selling_points} qui sont à
--   0 % d'usage en prod (49 lignes LinkMe, 0 non-NULL). L'affilié voyait
--   des champs vides au lieu des données produit mère.
--
--   On remplace par une lecture directe de products.name / .description /
--   .selling_points pour fournir la seule source de vérité, conforme aux
--   best practices PIM (audit 2026-04-20).
--
--   Les colonnes custom_* de channel_pricing seront DROP dans la 2e migration
--   du sprint (20260421000002). Cette 1re migration sert à libérer la RPC
--   pour que le DROP soit sans risque.
-- ============================================================================

DROP FUNCTION IF EXISTS get_linkme_catalog_products_for_affiliate(UUID);

CREATE OR REPLACE FUNCTION get_linkme_catalog_products_for_affiliate(
  p_affiliate_id UUID DEFAULT NULL
)
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
  product_name TEXT,
  product_reference TEXT,
  product_price_ht NUMERIC,
  product_image_url TEXT,
  product_stock_real NUMERIC,
  product_is_active BOOLEAN,
  product_family_name TEXT,
  product_category_name TEXT
) AS $$
DECLARE
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.product_id,
    cp.is_active AS is_enabled,
    cp.is_public_showcase,
    cp.max_margin_rate,
    cp.min_margin_rate,
    cp.suggested_margin_rate,
    -- SI-DESC-001 : lire depuis products directement, plus de custom_* vides
    p.name::TEXT AS custom_title,
    p.description::TEXT AS custom_description,
    COALESCE(
      CASE
        WHEN p.selling_points IS NOT NULL AND jsonb_typeof(p.selling_points) = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p.selling_points))
        ELSE NULL
      END,
      ARRAY[]::TEXT[]
    ) AS custom_selling_points,
    cp.channel_commission_rate AS linkme_commission_rate,
    COALESCE(cp.views_count, 0) AS views_count,
    COALESCE(cp.selections_count, 0) AS selections_count,
    COALESCE(cp.display_order, 0) AS display_order,
    COALESCE(cp.is_featured, false) AS is_featured,
    p.name::TEXT AS product_name,
    p.sku::TEXT AS product_reference,
    COALESCE(cp.custom_price_ht, cp.public_price_ht, p.cost_price, 0) AS product_price_ht,
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = true
      LIMIT 1
    ) AS product_image_url,
    COALESCE(p.stock_real, 0)::NUMERIC AS product_stock_real,
    (p.product_status = 'active') AS product_is_active,
    NULL::TEXT AS product_family_name,
    sc.name::TEXT AS product_category_name
  FROM channel_pricing cp
  JOIN products p ON p.id = cp.product_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE cp.channel_id = v_linkme_channel_id
    AND cp.is_active = true
    AND p.product_status = 'active'
  ORDER BY
    COALESCE(cp.is_featured, false) DESC,
    COALESCE(cp.display_order, 999) ASC,
    p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_linkme_catalog_products_for_affiliate(UUID)
  TO anon, authenticated;

COMMENT ON FUNCTION get_linkme_catalog_products_for_affiliate(UUID) IS
'Récupère les produits du catalogue LinkMe pour affiliés.
SI-DESC-001 (2026-04-21) : RPC lit désormais products.name / .description /
.selling_points directement au lieu de channel_pricing.custom_* (0 % usage).
Single source of truth conforme best practices PIM.';

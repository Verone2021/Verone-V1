-- ============================================================================
-- Migration: SI-DESC-001 (2/3) — Site-internet RPC lit depuis products
-- Date: 2026-04-21
-- Description:
--   get_site_internet_products utilisait des COALESCE sur
--   channel_product_metadata.custom_{title,description,description_long,
--   technical_description,brand,selling_points} — tous à 0 % d'usage en prod
--   (21 lignes cpm, 0 non-NULL).
--
--   On remplace par une lecture directe de products.* pour :
--   - seo_title ← p.meta_title
--   - seo_meta_description ← p.meta_description (fallback LEFT(p.description, 160))
--   - description ← p.description
--   - technical_description ← p.technical_description
--   - brand ← p.brand
--   - selling_points ← p.selling_points
--
--   Le LEFT JOIN sur channel_product_metadata reste (pour lire cpm.metadata
--   JSONB qui peut servir à stocker des seo_title/seo_meta_description
--   spécifiques site via le JSONB libre).
-- ============================================================================

DROP FUNCTION IF EXISTS get_site_internet_products();

CREATE OR REPLACE FUNCTION get_site_internet_products()
RETURNS TABLE(
  product_id UUID, sku TEXT, name TEXT, slug TEXT, status TEXT,
  stock_status TEXT,
  seo_title TEXT, seo_meta_description TEXT, metadata JSONB,
  price_ht NUMERIC, price_ttc NUMERIC, price_source TEXT, discount_rate NUMERIC,
  primary_image_url TEXT, image_urls TEXT[],
  is_published BOOLEAN, publication_date TIMESTAMPTZ,
  has_variants BOOLEAN, variants_count INTEGER, variant_group_id UUID,
  eligible_variants_count INTEGER, is_eligible BOOLEAN, ineligibility_reasons TEXT[],
  description TEXT, technical_description TEXT, brand TEXT, selling_points TEXT[],
  dimensions JSONB, weight NUMERIC, suitable_rooms TEXT[],
  subcategory_id UUID, subcategory_name TEXT, product_type TEXT, video_url TEXT, supplier_moq INTEGER,
  eco_participation_amount NUMERIC, requires_assembly BOOLEAN, assembly_price NUMERIC,
  delivery_delay_weeks_min INTEGER, delivery_delay_weeks_max INTEGER,
  style TEXT, color TEXT,
  cost_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id, p.sku::TEXT, p.name::TEXT, p.slug::TEXT, p.product_status::TEXT AS status,
    p.stock_status::TEXT,
    -- SI-DESC-001 : seo_title / meta_description lus depuis products (fallback metadata JSONB)
    COALESCE(cpm.metadata->>'seo_title', p.meta_title::TEXT, p.name::TEXT) AS seo_title,
    COALESCE(cpm.metadata->>'seo_meta_description', p.meta_description, LEFT(p.description, 160)) AS seo_meta_description,
    COALESCE(cpm.metadata, '{}'::JSONB) AS metadata,
    COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) AS price_ht,
    COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) * 1.20 AS price_ttc,
    CASE WHEN cp.custom_price_ht IS NOT NULL THEN 'channel_pricing' ELSE 'base_price' END AS price_source,
    cp.discount_rate,
    (SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1) AS primary_image_url,
    ARRAY(SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC) AS image_urls,
    p.is_published_online, p.publication_date,
    (p.variant_group_id IS NOT NULL) AS has_variants,
    CASE WHEN p.variant_group_id IS NOT NULL THEN (SELECT COUNT(*)::INTEGER FROM products pv_all WHERE pv_all.variant_group_id = p.variant_group_id) ELSE 0 END AS variants_count,
    p.variant_group_id,
    CASE WHEN p.variant_group_id IS NOT NULL THEN (SELECT COUNT(*)::INTEGER FROM products pv_sub LEFT JOIN channel_pricing cp_sub ON cp_sub.product_id = pv_sub.id AND cp_sub.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet') AND cp_sub.is_active = TRUE WHERE pv_sub.variant_group_id = p.variant_group_id AND pv_sub.product_status = 'active' AND pv_sub.is_published_online = TRUE AND pv_sub.slug IS NOT NULL AND COALESCE(cp_sub.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = pv_sub.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0 AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = pv_sub.id)) ELSE 0 END AS eligible_variants_count,
    (p.product_status = 'active' AND p.is_published_online = TRUE AND p.slug IS NOT NULL AND COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0 AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)) AS is_eligible,
    ARRAY(SELECT reason FROM (SELECT 'Produit inactif' AS reason WHERE p.product_status != 'active' UNION ALL SELECT 'Non publie en ligne' WHERE p.is_published_online = FALSE UNION ALL SELECT 'Slug manquant' WHERE p.slug IS NULL UNION ALL SELECT 'Prix manquant ou invalide' WHERE COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) IS NULL OR COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) <= 0 UNION ALL SELECT 'Aucune image' WHERE NOT EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)) reasons) AS ineligibility_reasons,
    -- SI-DESC-001 : description / technical / brand / selling_points depuis products
    p.description AS description,
    p.technical_description AS technical_description,
    p.brand::TEXT AS brand,
    COALESCE(
      (SELECT ARRAY(SELECT jsonb_array_elements_text(p.selling_points)) WHERE p.selling_points IS NOT NULL AND jsonb_typeof(p.selling_points) = 'array'),
      ARRAY[]::TEXT[]
    ) AS selling_points,
    p.dimensions, p.weight,
    ARRAY(SELECT unnest(p.suitable_rooms)::TEXT) AS suitable_rooms,
    p.subcategory_id, sc.name::TEXT AS subcategory_name, p.product_type::TEXT, p.video_url, p.supplier_moq,
    COALESCE(cp.eco_participation_amount, 0.00) AS eco_participation_amount,
    COALESCE(cp.requires_assembly, FALSE) AS requires_assembly,
    COALESCE(cp.assembly_price, 0.00) AS assembly_price,
    cp.delivery_delay_weeks_min, cp.delivery_delay_weeks_max,
    p.style::TEXT,
    COALESCE(p.variant_attributes->>'color', p.variant_attributes->>'couleur')::TEXT AS color,
    p.cost_price
  FROM products p
  LEFT JOIN channel_product_metadata cpm ON cpm.product_id = p.id AND cpm.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
  LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet') AND cp.is_active = TRUE
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE p.product_status = 'active' AND p.is_published_online = TRUE AND p.slug IS NOT NULL
    AND COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0
    AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
  ORDER BY p.name ASC;
END;
$$;

COMMENT ON FUNCTION get_site_internet_products() IS
'Liste les produits éligibles site-internet (feed XML + page produit).
SI-DESC-001 (2026-04-21) : lit désormais products.description / .technical_description /
.brand / .selling_points / .meta_title / .meta_description directement au lieu
de channel_product_metadata.custom_* (0 % usage). Single source of truth.
cpm.metadata JSONB reste pour overrides seo_title/seo_meta_description.';

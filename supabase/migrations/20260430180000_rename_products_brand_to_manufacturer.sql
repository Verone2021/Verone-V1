-- ============================================================
-- Migration [BO-BRAND-001] — Rename products.brand → manufacturer
-- ============================================================
-- Refactoring atomique. La colonne contient des libellés fabricants
-- (OPJET, atmosphera, Five, HOME DECO FACTORY, Nordik Living,
-- Florissima, Vérone Collections) — pas des marques internes.
-- Renommage préventif AVANT introduction de la table 'brands'
-- (marques internes Vérone/Boêmia/Solar/Flos) en BO-BRAND-002.
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Rename de la colonne products.brand → products.manufacturer
-- ----------------------------------------------------------------
ALTER TABLE products RENAME COLUMN brand TO manufacturer;

-- ----------------------------------------------------------------
-- 2. Recréer get_site_internet_products() avec manufacturer
-- ----------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_site_internet_products();

CREATE OR REPLACE FUNCTION public.get_site_internet_products()
 RETURNS TABLE(product_id uuid, sku text, name text, slug text, status text, stock_status text, seo_title text, seo_meta_description text, metadata jsonb, price_ht numeric, price_ttc numeric, price_source text, discount_rate numeric, primary_image_url text, image_urls text[], is_published boolean, publication_date timestamp with time zone, has_variants boolean, variants_count integer, variant_group_id uuid, eligible_variants_count integer, is_eligible boolean, ineligibility_reasons text[], description text, technical_description text, manufacturer text, selling_points text[], dimensions jsonb, weight numeric, suitable_rooms text[], subcategory_id uuid, subcategory_name text, product_type text, video_url text, supplier_moq integer, eco_participation_amount numeric, requires_assembly boolean, assembly_price numeric, delivery_delay_weeks_min integer, delivery_delay_weeks_max integer, style text, color text, cost_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.sku::TEXT, p.name::TEXT, p.slug::TEXT, p.product_status::TEXT,
    p.stock_status::TEXT,
    COALESCE(cpm.metadata->>'seo_title', p.meta_title::TEXT, p.name::TEXT),
    COALESCE(cpm.metadata->>'seo_meta_description', p.meta_description, LEFT(p.description, 160)),
    COALESCE(cpm.metadata, '{}'::JSONB),
    COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)),
    COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) * 1.20,
    CASE WHEN cp.custom_price_ht IS NOT NULL THEN 'channel_pricing' ELSE 'base_price' END,
    cp.discount_rate,
    (SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1),
    ARRAY(SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC),
    p.is_published_online, p.publication_date,
    (p.variant_group_id IS NOT NULL),
    CASE WHEN p.variant_group_id IS NOT NULL THEN (SELECT COUNT(*)::INTEGER FROM products pv_all WHERE pv_all.variant_group_id = p.variant_group_id) ELSE 0 END,
    p.variant_group_id,
    CASE WHEN p.variant_group_id IS NOT NULL THEN (SELECT COUNT(*)::INTEGER FROM products pv_sub LEFT JOIN channel_pricing cp_sub ON cp_sub.product_id = pv_sub.id AND cp_sub.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet') AND cp_sub.is_active = TRUE WHERE pv_sub.variant_group_id = p.variant_group_id AND pv_sub.product_status = 'active' AND pv_sub.is_published_online = TRUE AND pv_sub.slug IS NOT NULL AND COALESCE(cp_sub.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = pv_sub.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0 AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = pv_sub.id)) ELSE 0 END,
    (p.product_status = 'active' AND p.is_published_online = TRUE AND p.slug IS NOT NULL AND COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0 AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)),
    ARRAY(SELECT reason FROM (SELECT 'Produit inactif' AS reason WHERE p.product_status != 'active' UNION ALL SELECT 'Non publie en ligne' WHERE p.is_published_online = FALSE UNION ALL SELECT 'Slug manquant' WHERE p.slug IS NULL UNION ALL SELECT 'Prix manquant ou invalide' WHERE COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) IS NULL OR COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) <= 0 UNION ALL SELECT 'Aucune image' WHERE NOT EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)) reasons),
    p.description, p.technical_description, p.manufacturer::TEXT,
    COALESCE((SELECT ARRAY(SELECT jsonb_array_elements_text(p.selling_points)) WHERE p.selling_points IS NOT NULL AND jsonb_typeof(p.selling_points) = 'array'), ARRAY[]::TEXT[]),
    p.dimensions, p.weight,
    ARRAY(SELECT unnest(p.suitable_rooms)::TEXT),
    p.subcategory_id, sc.name::TEXT, p.product_type::TEXT, p.video_url, p.supplier_moq,
    COALESCE(cp.eco_participation_amount, 0.00),
    COALESCE(cp.requires_assembly, FALSE),
    COALESCE(cp.assembly_price, 0.00),
    cp.delivery_delay_weeks_min, cp.delivery_delay_weeks_max,
    p.style::TEXT,
    COALESCE(p.variant_attributes->>'color', p.variant_attributes->>'couleur')::TEXT,
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
$function$;

GRANT EXECUTE ON FUNCTION public.get_site_internet_products() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------
-- 3. Recréer get_google_merchant_eligible_products() avec manufacturer
-- ----------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_google_merchant_eligible_products();

CREATE OR REPLACE FUNCTION public.get_google_merchant_eligible_products()
 RETURNS TABLE(id uuid, sku character varying, name character varying, description text, price_ht_cents integer, price_ttc_cents integer, tva_rate numeric, image_url text, stock_status text, product_status text, gtin character varying, manufacturer character varying)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.sku,
    p.name,
    p.description,

    -- Prix calculé depuis cost_price + margin_percentage
    -- prix_vente_ht = cost_price * (1 + margin_percentage/100)
    COALESCE(ROUND(p.cost_price * (1 + p.margin_percentage/100) * 100)::INTEGER, 0) AS price_ht_cents,
    -- TTC = HT * 1.20 (TVA 20%)
    COALESCE(ROUND(p.cost_price * (1 + p.margin_percentage/100) * 100 * 1.20)::INTEGER, 0) AS price_ttc_cents,
    20.00 AS tva_rate,

    -- Image primaire
    COALESCE(
      (SELECT public_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
      '/images/product-placeholder.png'
    ) AS image_url,

    -- Stock status depuis colonne directe
    COALESCE(p.stock_status::TEXT, 'out_of_stock') AS stock_status,

    -- Product status
    COALESCE(p.product_status::TEXT, 'draft') AS product_status,

    -- GTIN (optionnel, peut être NULL)
    p.gtin,

    -- Manufacturer (anciennement brand — renommé BO-BRAND-001, contient libellés fabricants)
    p.manufacturer

  FROM products p
  WHERE
    -- Produits actifs uniquement
    p.product_status = 'active'
    -- Pas déjà synchronisés
    AND NOT EXISTS (
      SELECT 1 FROM google_merchant_syncs
      WHERE product_id = p.id
    )
  ORDER BY p.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_google_merchant_eligible_products() TO authenticated, service_role;

-- ----------------------------------------------------------------
-- 4. Mettre à jour get_product_detail_public(uuid, uuid)
--    Retour jsonb : on renomme la clé 'brand' → 'manufacturer' dans le JSON
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_product_detail_public(p_product_id uuid, p_selection_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product RECORD;
  v_images JSONB;
BEGIN
  -- Verify product belongs to a published, non-archived selection with active affiliate
  SELECT
    p.id,
    p.name,
    p.sku,
    p.manufacturer,
    p.style,
    p.dimensions,
    p.weight,
    p.suitable_rooms,
    p.description,
    cat.name AS category_name,
    sc.name AS subcategory_name,
    lsi.selling_price_ht,
    lsi.selling_price_ht * 1.2 AS selling_price_ttc
  INTO v_product
  FROM linkme_selection_items lsi
  JOIN products p ON p.id = lsi.product_id
  JOIN linkme_selections ls ON ls.id = lsi.selection_id
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  LEFT JOIN categories cat ON cat.id = sc.category_id
  WHERE lsi.product_id = p_product_id
    AND lsi.selection_id = p_selection_id
    AND ls.published_at IS NOT NULL
    AND ls.archived_at IS NULL
    AND la.status = 'active';

  IF v_product IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product not found in this published selection'
    );
  END IF;

  -- Get all images sorted by display_order
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'public_url', pi.public_url,
      'is_primary', pi.is_primary,
      'display_order', pi.display_order
    ) ORDER BY pi.display_order ASC
  ), '[]'::jsonb)
  INTO v_images
  FROM product_images pi
  WHERE pi.product_id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product', jsonb_build_object(
      'manufacturer', v_product.manufacturer,
      'style', v_product.style,
      'dimensions', v_product.dimensions,
      'weight', v_product.weight,
      'suitable_rooms', v_product.suitable_rooms,
      'description', v_product.description,
      'category_name', v_product.category_name,
      'subcategory_name', v_product.subcategory_name,
      'selling_price_ht', v_product.selling_price_ht,
      'selling_price_ttc', v_product.selling_price_ttc,
      'images', v_images
    )
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_product_detail_public(uuid, uuid) TO anon, authenticated, service_role;

COMMIT;

-- =====================================================================
-- [BO-CHANNELS-P7-001] Règle « vendable » — site internet
-- =====================================================================
-- get_site_internet_products : `product_status = 'active'` → product_is_sellable
-- dans le filtre, le décompte des variantes éligibles, is_eligible et le motif
-- d'inéligibilité (« Produit non vendable » remplace « Produit inactif »).
-- Le site excluait déjà les brouillons mais pas les produits retirés.
-- get_site_internet_collection_detail : même règle sur les produits d'une collection.
-- Publication, prix, images, marque : conditions inchangées.
-- Dépend de 20260914020000. Application : execute_sql après accord de Roméo.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.get_site_internet_products(p_brand_slug text DEFAULT NULL::text)
 RETURNS TABLE(product_id uuid, sku text, name text, slug text, status text, stock_status text, seo_title text, seo_meta_description text, metadata jsonb, price_ht numeric, price_ttc numeric, price_source text, discount_rate numeric, primary_image_url text, primary_cloudflare_image_id text, image_urls text[], is_published boolean, publication_date timestamp with time zone, has_variants boolean, variants_count integer, variant_group_id uuid, eligible_variants_count integer, is_eligible boolean, ineligibility_reasons text[], description text, technical_description text, manufacturer text, selling_points text[], dimensions jsonb, weight numeric, suitable_rooms text[], subcategory_id uuid, subcategory_name text, product_type text, video_url text, supplier_moq integer, eco_participation_amount numeric, requires_assembly boolean, assembly_price numeric, delivery_delay_weeks_min integer, delivery_delay_weeks_max integer, style text, color text, cost_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
DECLARE
  v_brand_id uuid;
BEGIN
  IF p_brand_slug IS NOT NULL THEN
    SELECT b.id INTO v_brand_id FROM brands b WHERE b.slug = p_brand_slug AND b.is_active = TRUE;
    IF v_brand_id IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive brand_slug: %', p_brand_slug;
    END IF;
  END IF;

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
    (SELECT pi.cloudflare_image_id::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1),
    ARRAY(SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC),
    p.is_published_online, p.publication_date,
    (p.variant_group_id IS NOT NULL),
    CASE WHEN p.variant_group_id IS NOT NULL THEN (SELECT COUNT(*)::INTEGER FROM products pv_all WHERE pv_all.variant_group_id = p.variant_group_id) ELSE 0 END,
    p.variant_group_id,
    CASE WHEN p.variant_group_id IS NOT NULL THEN (SELECT COUNT(*)::INTEGER FROM products pv_sub LEFT JOIN channel_pricing cp_sub ON cp_sub.product_id = pv_sub.id AND cp_sub.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet') AND cp_sub.is_active = TRUE WHERE pv_sub.variant_group_id = p.variant_group_id AND public.product_is_sellable(pv_sub.archived_at, pv_sub.product_status, pv_sub.creation_mode) AND pv_sub.is_published_online = TRUE AND pv_sub.slug IS NOT NULL AND COALESCE(cp_sub.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = pv_sub.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0 AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = pv_sub.id)) ELSE 0 END,
    (public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode) AND p.is_published_online = TRUE AND p.slug IS NOT NULL AND COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0 AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)),
    ARRAY(SELECT reason FROM (SELECT 'Produit non vendable' AS reason WHERE NOT public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode) UNION ALL SELECT 'Non publie en ligne' WHERE p.is_published_online = FALSE UNION ALL SELECT 'Slug manquant' WHERE p.slug IS NULL UNION ALL SELECT 'Prix manquant ou invalide' WHERE COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) IS NULL OR COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) <= 0 UNION ALL SELECT 'Aucune image' WHERE NOT EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)) reasons),
    COALESCE(NULLIF(TRIM(p.description), ''), p.description_long, p.description_short), p.technical_description, p.manufacturer::TEXT,
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
  WHERE public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode) AND p.is_published_online = TRUE AND p.slug IS NOT NULL
    AND COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0
    AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
    AND (v_brand_id IS NULL OR v_brand_id = ANY(p.brand_ids))
  ORDER BY p.name ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_site_internet_collection_detail(p_slug text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSON;
  v_channel_id UUID;
BEGIN
  SELECT id INTO v_channel_id FROM sales_channels WHERE code = 'site_internet';

  SELECT json_build_object(
    'collection', (
      SELECT json_build_object(
        'id', c.id, 'name', c.name, 'slug', c.slug,
        'description', c.description, 'description_long', c.description_long,
        'selling_points', c.selling_points,
        'cover_image_url', ci.public_url, 'cover_image_alt', ci.alt_text,
        'brand', json_build_object('id', b.id, 'name', b.name, 'logo_url', b.logo_url),
        'season', c.season, 'event_tags', c.event_tags,
        'product_count', c.product_count,
        'meta_title', c.meta_title, 'meta_description', c.meta_description
      )
      FROM collections c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN collection_images ci ON c.id = ci.collection_id AND ci.is_primary = true
      WHERE c.slug = p_slug AND c.is_published_online = TRUE AND c.is_active = TRUE
    ),
    'products', (
      SELECT json_agg(
        json_build_object(
          'id', p.id, 'sku', p.sku, 'name', p.name, 'slug', p.slug,
          'primary_image_url', (
            SELECT pi.url FROM product_images pi
            WHERE pi.product_id = p.id AND pi.is_primary = TRUE
            ORDER BY pi.display_order ASC LIMIT 1
          ),
          'price_ht', COALESCE(cp.custom_price_ht,
            (SELECT pli.price_ht FROM price_list_items pli
             JOIN price_lists pl ON pl.id = pli.price_list_id
             WHERE pli.product_id = p.id AND pli.is_active = TRUE
               AND pl.is_active = TRUE AND pl.list_type = 'base'
             ORDER BY pl.priority ASC LIMIT 1)),
          'price_ttc', COALESCE(cp.custom_price_ht,
            (SELECT pli.price_ht FROM price_list_items pli
             JOIN price_lists pl ON pl.id = pli.price_list_id
             WHERE pli.product_id = p.id AND pli.is_active = TRUE
               AND pl.is_active = TRUE AND pl.list_type = 'base'
             ORDER BY pl.priority ASC LIMIT 1)) * 1.20,
          'discount_rate', cp.discount_rate,
          'position', colp.position
        ) ORDER BY colp.position ASC
      )
      FROM collection_products colp
      JOIN products p ON p.id = colp.product_id
      LEFT JOIN channel_pricing cp ON cp.product_id = p.id
        AND cp.channel_id = v_channel_id AND cp.is_active = TRUE
      WHERE colp.collection_id = (SELECT id FROM collections WHERE slug = p_slug)
        AND public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

COMMIT;

-- RETOUR ARRIÈRE : ré-exécuter les définitions du 14/09 (filtre product_status = 'active'),
-- reproduites dans docs/scratchpad/dev-report-2026-09-14-BO-CHANNELS-P7-001.md.

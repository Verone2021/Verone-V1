-- INFRA-IMG-006
-- Ajoute primary_cloudflare_image_id au RETURNS de get_site_internet_products
-- pour que site-internet serve les images via Cloudflare Images au lieu de
-- Supabase Storage réoptimisé par Vercel.
--
-- DROP requis car PostgreSQL n'autorise pas le changement de type de retour
-- d'une fonction existante via CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.get_site_internet_products();

CREATE FUNCTION public.get_site_internet_products()
 RETURNS TABLE(
   product_id uuid,
   sku text,
   name text,
   slug text,
   status text,
   stock_status text,
   seo_title text,
   seo_meta_description text,
   metadata jsonb,
   price_ht numeric,
   price_ttc numeric,
   price_source text,
   discount_rate numeric,
   primary_image_url text,
   primary_cloudflare_image_id text,
   image_urls text[],
   is_published boolean,
   publication_date timestamp with time zone,
   has_variants boolean,
   variants_count integer,
   variant_group_id uuid,
   eligible_variants_count integer,
   is_eligible boolean,
   ineligibility_reasons text[],
   description text,
   technical_description text,
   manufacturer text,
   selling_points text[],
   dimensions jsonb,
   weight numeric,
   suitable_rooms text[],
   subcategory_id uuid,
   subcategory_name text,
   product_type text,
   video_url text,
   supplier_moq integer,
   eco_participation_amount numeric,
   requires_assembly boolean,
   assembly_price numeric,
   delivery_delay_weeks_min integer,
   delivery_delay_weeks_max integer,
   style text,
   color text,
   cost_price numeric
 )
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
    (SELECT pi.cloudflare_image_id::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1),
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

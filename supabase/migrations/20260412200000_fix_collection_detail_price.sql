-- Fix: get_site_internet_collection_detail() was exposing cost_price (supplier price)
-- instead of the channel selling price. Now uses channel_pricing.custom_price_ht
-- with fallback to base price list, matching get_site_internet_products() logic.

CREATE OR REPLACE FUNCTION get_site_internet_collection_detail(p_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_channel_id UUID;
BEGIN
  -- Get site-internet channel ID
  SELECT id INTO v_channel_id FROM sales_channels WHERE code = 'site_internet';

  SELECT json_build_object(
    'collection', (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'description', c.description,
        'description_long', c.description_long,
        'selling_points', c.selling_points,
        'cover_image_url', ci.public_url,
        'cover_image_alt', ci.alt_text,
        'brand', json_build_object('id', b.id, 'name', b.name, 'logo_url', b.logo_url),
        'season', c.season,
        'event_tags', c.event_tags,
        'product_count', c.product_count,
        'meta_title', c.meta_title,
        'meta_description', c.meta_description
      )
      FROM collections c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN collection_images ci ON c.id = ci.collection_id AND ci.is_primary = true
      WHERE c.slug = p_slug
        AND c.is_published_online = TRUE
        AND c.is_active = TRUE
    ),
    'products', (
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'sku', p.sku,
          'name', p.name,
          'slug', p.slug,
          'primary_image_url', (
            SELECT pi.url
            FROM product_images pi
            WHERE pi.product_id = p.id AND pi.is_primary = TRUE
            ORDER BY pi.display_order ASC
            LIMIT 1
          ),
          'price_ht', COALESCE(
            cp.custom_price_ht,
            (SELECT pli.price_ht
             FROM price_list_items pli
             JOIN price_lists pl ON pl.id = pli.price_list_id
             WHERE pli.product_id = p.id
               AND pli.is_active = TRUE
               AND pl.is_active = TRUE
               AND pl.list_type = 'base'
             ORDER BY pl.priority ASC
             LIMIT 1)
          ),
          'price_ttc', COALESCE(
            cp.custom_price_ht,
            (SELECT pli.price_ht
             FROM price_list_items pli
             JOIN price_lists pl ON pl.id = pli.price_list_id
             WHERE pli.product_id = p.id
               AND pli.is_active = TRUE
               AND pl.is_active = TRUE
               AND pl.list_type = 'base'
             ORDER BY pl.priority ASC
             LIMIT 1)
          ) * 1.20,
          'discount_rate', cp.discount_rate,
          'position', colp.position
        )
        ORDER BY colp.position ASC
      )
      FROM collection_products colp
      JOIN products p ON p.id = colp.product_id
      LEFT JOIN channel_pricing cp ON cp.product_id = p.id
        AND cp.channel_id = v_channel_id
        AND cp.is_active = TRUE
      WHERE colp.collection_id = (SELECT id FROM collections WHERE slug = p_slug)
        AND p.product_status = 'active'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

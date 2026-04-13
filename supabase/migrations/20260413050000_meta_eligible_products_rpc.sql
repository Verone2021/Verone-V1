-- RPC: get eligible products for Meta Commerce
-- Returns products published on site-internet, not yet in meta_commerce_syncs

CREATE OR REPLACE FUNCTION get_meta_eligible_products()
RETURNS TABLE(
  id UUID, name TEXT, sku TEXT, slug TEXT,
  cost_price NUMERIC, site_price_ht NUMERIC,
  stock_status TEXT, stock_quantity INTEGER,
  primary_image_url TEXT, image_count BIGINT,
  is_published_online BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name::TEXT, p.sku::TEXT, p.slug::TEXT,
    p.cost_price,
    cp_site.custom_price_ht AS site_price_ht,
    p.stock_status::TEXT, p.stock_quantity,
    (SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1) AS primary_image_url,
    (SELECT COUNT(*) FROM product_images pi2 WHERE pi2.product_id = p.id) AS image_count,
    p.is_published_online
  FROM products p
  LEFT JOIN channel_pricing cp_site ON cp_site.product_id = p.id
    AND cp_site.channel_id = (SELECT sc.id FROM sales_channels sc WHERE sc.code = 'site_internet')
    AND cp_site.is_active = TRUE
  WHERE p.is_published_online = TRUE
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM meta_commerce_syncs mcs
      WHERE mcs.product_id = p.id AND mcs.sync_status != 'deleted'
    )
  ORDER BY p.name;
END;
$$;

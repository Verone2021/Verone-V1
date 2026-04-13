-- Fix: update_meta_sync_status must also update meta_status_checked_at
-- Bug: meta_status_checked_at was never set, making it impossible to know when statuses were last checked

CREATE OR REPLACE FUNCTION update_meta_sync_status(
  p_sync_id UUID,
  p_meta_product_id TEXT,
  p_meta_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE meta_commerce_syncs
  SET
    meta_product_id = p_meta_product_id,
    meta_status = p_meta_status,
    meta_status_checked_at = NOW(),
    synced_at = NOW(),
    updated_at = NOW()
  WHERE id = p_sync_id;
END;
$$;

-- Fix: get_meta_commerce_products must expose meta_status_checked_at, meta_status_detail, image_count
-- Also include channel_pricing inactive products (so toggle reactivate works)

DROP FUNCTION IF EXISTS get_meta_commerce_products();

CREATE OR REPLACE FUNCTION get_meta_commerce_products()
RETURNS TABLE(
  id UUID, product_id UUID, sku TEXT, product_name TEXT,
  primary_image_url TEXT, cost_price NUMERIC, custom_price_ht NUMERIC,
  custom_title TEXT, custom_description TEXT, description TEXT,
  catalog_id TEXT, meta_product_id TEXT, sync_status TEXT, meta_status TEXT,
  meta_status_detail JSONB, meta_status_checked_at TIMESTAMPTZ,
  impressions INTEGER, clicks INTEGER, conversions INTEGER, revenue_ht NUMERIC,
  synced_at TIMESTAMPTZ, error_message TEXT, image_count BIGINT, is_channel_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT mcs.id, mcs.product_id, p.sku::TEXT, p.name::TEXT AS product_name,
    (SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1),
    p.cost_price, cp.custom_price_ht, cp.custom_title::TEXT, cp.custom_description::TEXT, p.description::TEXT,
    mcs.catalog_id, mcs.meta_product_id, mcs.sync_status, mcs.meta_status,
    mcs.meta_status_detail, mcs.meta_status_checked_at,
    mcs.impressions, mcs.clicks, mcs.conversions, mcs.revenue_ht, mcs.synced_at, mcs.error_message,
    (SELECT COUNT(*) FROM product_images pi2 WHERE pi2.product_id = p.id) AS image_count,
    COALESCE(cp.is_active, FALSE) AS is_channel_active
  FROM meta_commerce_syncs mcs
  JOIN products p ON p.id = mcs.product_id
  LEFT JOIN channel_pricing cp ON cp.product_id = p.id
    AND cp.channel_id = (SELECT sc.id FROM sales_channels sc WHERE sc.code = 'meta_commerce')
  WHERE mcs.sync_status != 'deleted'
  ORDER BY mcs.synced_at DESC;
END;
$$;

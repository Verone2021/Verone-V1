-- =============================================
-- Meta Commerce Channel Integration
-- Canal de vente Meta (Facebook/Instagram/WhatsApp)
-- Pattern identique a Google Merchant
-- =============================================

-- 1. Insert canal meta_commerce dans sales_channels
INSERT INTO sales_channels (code, name, description, is_active, display_order, domain_url, site_name, icon_name)
VALUES (
  'meta_commerce',
  'Meta Commerce',
  'Facebook Shop, Instagram Shopping, WhatsApp Catalog',
  true,
  5,
  'https://business.facebook.com/commerce',
  'Verone Collections',
  'facebook'
)
ON CONFLICT (code) DO NOTHING;

-- 2. Table meta_commerce_syncs (meme structure que google_merchant_syncs)
CREATE TABLE IF NOT EXISTS meta_commerce_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  catalog_id TEXT NOT NULL DEFAULT '1223749196006844',
  meta_product_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  sync_operation TEXT NOT NULL DEFAULT 'insert',
  meta_status TEXT DEFAULT 'pending',
  meta_status_detail JSONB,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_ht NUMERIC DEFAULT 0,
  meta_status_checked_at TIMESTAMPTZ,
  error_message TEXT,
  response_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_meta_commerce_syncs_product_id ON meta_commerce_syncs(product_id);
CREATE INDEX IF NOT EXISTS idx_meta_commerce_syncs_sync_status ON meta_commerce_syncs(sync_status);
CREATE INDEX IF NOT EXISTS idx_meta_commerce_syncs_meta_status ON meta_commerce_syncs(meta_status);

-- 3. RLS
ALTER TABLE meta_commerce_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_meta_commerce_syncs"
  ON meta_commerce_syncs FOR ALL TO authenticated
  USING (is_backoffice_user());

-- 4. Trigger updated_at
CREATE OR REPLACE TRIGGER set_meta_commerce_syncs_updated_at
  BEFORE UPDATE ON meta_commerce_syncs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. RPC: get_meta_commerce_products()
CREATE OR REPLACE FUNCTION get_meta_commerce_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  sku TEXT,
  product_name TEXT,
  primary_image_url TEXT,
  cost_price NUMERIC,
  custom_price_ht NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  description TEXT,
  catalog_id TEXT,
  meta_product_id TEXT,
  sync_status TEXT,
  meta_status TEXT,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_ht NUMERIC,
  synced_at TIMESTAMPTZ,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mcs.id,
    mcs.product_id,
    p.sku::TEXT,
    p.name::TEXT AS product_name,
    (SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1) AS primary_image_url,
    p.cost_price,
    cp.custom_price_ht,
    cp.custom_title::TEXT,
    cp.custom_description::TEXT,
    p.description::TEXT,
    mcs.catalog_id,
    mcs.meta_product_id,
    mcs.sync_status,
    mcs.meta_status,
    mcs.impressions,
    mcs.clicks,
    mcs.conversions,
    mcs.revenue_ht,
    mcs.synced_at,
    mcs.error_message
  FROM meta_commerce_syncs mcs
  JOIN products p ON p.id = mcs.product_id
  LEFT JOIN channel_pricing cp ON cp.product_id = p.id
    AND cp.channel_id = (SELECT sc.id FROM sales_channels sc WHERE sc.code = 'meta_commerce')
    AND cp.is_active = TRUE
  WHERE mcs.sync_status != 'deleted'
  ORDER BY mcs.synced_at DESC;
END;
$$;

-- 6. RPC: get_meta_commerce_stats()
CREATE OR REPLACE FUNCTION get_meta_commerce_stats()
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT,
  error_products BIGINT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  conversion_rate NUMERIC,
  last_sync_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_products,
    COUNT(*) FILTER (WHERE mcs.meta_status = 'active')::BIGINT AS active_products,
    COUNT(*) FILTER (WHERE mcs.meta_status = 'pending')::BIGINT AS pending_products,
    COUNT(*) FILTER (WHERE mcs.meta_status = 'rejected')::BIGINT AS rejected_products,
    COUNT(*) FILTER (WHERE mcs.sync_status = 'error')::BIGINT AS error_products,
    COALESCE(SUM(mcs.impressions), 0)::BIGINT AS total_impressions,
    COALESCE(SUM(mcs.clicks), 0)::BIGINT AS total_clicks,
    COALESCE(SUM(mcs.conversions), 0)::BIGINT AS total_conversions,
    CASE WHEN SUM(mcs.clicks) > 0 THEN ROUND((SUM(mcs.conversions)::NUMERIC / SUM(mcs.clicks)::NUMERIC) * 100, 2) ELSE 0 END AS conversion_rate,
    MAX(mcs.synced_at) AS last_sync_at
  FROM meta_commerce_syncs mcs
  WHERE mcs.sync_status != 'deleted';
END;
$$;

-- 7. RPC: batch_add_meta_commerce_products()
CREATE OR REPLACE FUNCTION batch_add_meta_commerce_products(
  p_product_ids UUID[],
  p_catalog_id TEXT DEFAULT '1223749196006844'
)
RETURNS TABLE (
  total_processed INTEGER,
  success_count INTEGER,
  error_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_id UUID;
  v_total INTEGER := array_length(p_product_ids, 1);
  v_success INTEGER := 0;
  v_error INTEGER := 0;
  v_product_id UUID;
BEGIN
  -- Get meta_commerce channel id
  SELECT id INTO v_channel_id FROM sales_channels WHERE code = 'meta_commerce';

  FOREACH v_product_id IN ARRAY p_product_ids
  LOOP
    BEGIN
      -- Upsert channel_pricing (activate product for meta channel)
      INSERT INTO channel_pricing (product_id, channel_id, is_active, custom_price_ht)
      SELECT v_product_id, v_channel_id, TRUE,
        COALESCE(
          (SELECT pli.price_ht FROM price_list_items pli
           JOIN price_lists pl ON pl.id = pli.price_list_id
           WHERE pli.product_id = v_product_id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base'
           ORDER BY pl.priority ASC LIMIT 1),
          p.cost_price * 2.5
        )
      FROM products p WHERE p.id = v_product_id
      ON CONFLICT (product_id, channel_id) DO UPDATE SET is_active = TRUE, updated_at = now();

      -- Upsert meta_commerce_syncs
      INSERT INTO meta_commerce_syncs (product_id, catalog_id, sync_status, sync_operation, meta_status)
      VALUES (v_product_id, p_catalog_id, 'synced', 'insert', 'pending')
      ON CONFLICT (product_id) DO UPDATE SET
        sync_status = 'synced',
        sync_operation = 'insert',
        meta_status = 'pending',
        synced_at = now(),
        updated_at = now(),
        error_message = NULL;

      v_success := v_success + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error := v_error + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_total, v_success, v_error;
END;
$$;

-- 8. RPC: toggle_meta_commerce_visibility()
CREATE OR REPLACE FUNCTION toggle_meta_commerce_visibility(
  p_product_id UUID,
  p_visible BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  SELECT id INTO v_channel_id FROM sales_channels WHERE code = 'meta_commerce';

  UPDATE channel_pricing
  SET is_active = p_visible, updated_at = now()
  WHERE product_id = p_product_id AND channel_id = v_channel_id;

  IF p_visible THEN
    UPDATE meta_commerce_syncs
    SET sync_status = 'synced', sync_operation = 'update', updated_at = now()
    WHERE product_id = p_product_id;
  ELSE
    UPDATE meta_commerce_syncs
    SET sync_status = 'deleted', sync_operation = 'delete', updated_at = now()
    WHERE product_id = p_product_id;
  END IF;
END;
$$;

-- 9. RPC: remove_from_meta_commerce()
CREATE OR REPLACE FUNCTION remove_from_meta_commerce(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  SELECT id INTO v_channel_id FROM sales_channels WHERE code = 'meta_commerce';

  UPDATE channel_pricing
  SET is_active = FALSE, updated_at = now()
  WHERE product_id = p_product_id AND channel_id = v_channel_id;

  UPDATE meta_commerce_syncs
  SET sync_status = 'deleted', sync_operation = 'delete', updated_at = now()
  WHERE product_id = p_product_id;
END;
$$;

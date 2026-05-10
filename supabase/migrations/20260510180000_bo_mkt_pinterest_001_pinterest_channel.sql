-- =============================================
-- BO-MKT-PINTEREST-001 : Pinterest channel + pin syncs
--
-- Branche Pinterest comme canal de vente avec sa table de sync similaire
-- a meta_commerce_syncs, ses RPCs de stats et son entree dans
-- sales_channels.
-- =============================================

-- 1. Insert canal pinterest dans sales_channels (idempotent)
INSERT INTO sales_channels (code, name, description, is_active, display_order, domain_url, site_name, icon_name)
VALUES (
  'pinterest',
  'Pinterest',
  'Pinterest Business Account + Pin Analytics + Trends',
  true,
  6,
  'https://business.pinterest.com',
  'Verone Pinterest',
  'pinterest'
)
ON CONFLICT (code) DO NOTHING;

-- 2. Table pinterest_pin_syncs (1 ligne par produit Verone -> pin Pinterest)
CREATE TABLE IF NOT EXISTS pinterest_pin_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pinterest_pin_id TEXT,
  pinterest_board_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'error', 'deleted')),
  pinterest_status TEXT,
  pinterest_status_detail JSONB,
  impressions INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  pin_clicks INTEGER NOT NULL DEFAULT 0,
  outbound_clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue_ht NUMERIC NOT NULL DEFAULT 0,
  pinterest_status_checked_at TIMESTAMPTZ,
  error_message TEXT,
  response_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id),
  CONSTRAINT pinterest_pin_syncs_status_detail_object_only
    CHECK (pinterest_status_detail IS NULL OR jsonb_typeof(pinterest_status_detail) = 'object'),
  CONSTRAINT pinterest_pin_syncs_response_data_object_only
    CHECK (response_data IS NULL OR jsonb_typeof(response_data) = 'object')
);

COMMENT ON TABLE pinterest_pin_syncs IS
  'Sync produits Verone vers epingles Pinterest + Pin Analytics. Pattern identique a meta_commerce_syncs avec saves comme metrique distinctive Pinterest.';

CREATE INDEX IF NOT EXISTS idx_pinterest_pin_syncs_product_id ON pinterest_pin_syncs(product_id);
CREATE INDEX IF NOT EXISTS idx_pinterest_pin_syncs_sync_status ON pinterest_pin_syncs(sync_status);
CREATE INDEX IF NOT EXISTS idx_pinterest_pin_syncs_pinterest_status ON pinterest_pin_syncs(pinterest_status);

-- 3. RLS staff
ALTER TABLE pinterest_pin_syncs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_access_pinterest_pin_syncs" ON pinterest_pin_syncs;
CREATE POLICY "staff_full_access_pinterest_pin_syncs"
  ON pinterest_pin_syncs FOR ALL TO authenticated
  USING (is_backoffice_user());

-- 4. Trigger updated_at
CREATE OR REPLACE TRIGGER set_pinterest_pin_syncs_updated_at
  BEFORE UPDATE ON pinterest_pin_syncs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. RPC : get_pinterest_pin_products()
CREATE OR REPLACE FUNCTION get_pinterest_pin_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  sku TEXT,
  product_name TEXT,
  primary_image_url TEXT,
  pinterest_pin_id TEXT,
  pinterest_board_id TEXT,
  sync_status TEXT,
  pinterest_status TEXT,
  impressions INTEGER,
  saves INTEGER,
  pin_clicks INTEGER,
  outbound_clicks INTEGER,
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
    pps.id,
    pps.product_id,
    p.sku::TEXT,
    p.name::TEXT,
    (
      SELECT pi.public_url::TEXT FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = TRUE
      ORDER BY pi.display_order ASC LIMIT 1
    ),
    pps.pinterest_pin_id,
    pps.pinterest_board_id,
    pps.sync_status,
    pps.pinterest_status,
    pps.impressions,
    pps.saves,
    pps.pin_clicks,
    pps.outbound_clicks,
    pps.conversions,
    pps.revenue_ht,
    pps.synced_at,
    pps.error_message
  FROM pinterest_pin_syncs pps
  JOIN products p ON p.id = pps.product_id
  WHERE pps.sync_status != 'deleted'
  ORDER BY pps.synced_at DESC;
END;
$$;

-- 6. RPC : get_pinterest_pin_stats()
CREATE OR REPLACE FUNCTION get_pinterest_pin_stats()
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT,
  error_products BIGINT,
  total_impressions BIGINT,
  total_saves BIGINT,
  total_pin_clicks BIGINT,
  total_outbound_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue_ht NUMERIC,
  conversion_rate NUMERIC,
  save_rate NUMERIC,
  last_sync_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE pinterest_status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE pinterest_status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE pinterest_status = 'rejected')::BIGINT,
    COUNT(*) FILTER (WHERE sync_status = 'error')::BIGINT,
    COALESCE(SUM(impressions), 0)::BIGINT,
    COALESCE(SUM(saves), 0)::BIGINT,
    COALESCE(SUM(pin_clicks), 0)::BIGINT,
    COALESCE(SUM(outbound_clicks), 0)::BIGINT,
    COALESCE(SUM(conversions), 0)::BIGINT,
    COALESCE(SUM(revenue_ht), 0),
    CASE
      WHEN SUM(outbound_clicks) > 0
      THEN ROUND((SUM(conversions)::NUMERIC / SUM(outbound_clicks)::NUMERIC) * 100, 2)
      ELSE 0
    END,
    CASE
      WHEN SUM(impressions) > 0
      THEN ROUND((SUM(saves)::NUMERIC / SUM(impressions)::NUMERIC) * 100, 2)
      ELSE 0
    END,
    MAX(synced_at)
  FROM pinterest_pin_syncs
  WHERE sync_status != 'deleted';
END;
$$;

-- =============================================
-- BO-MKT-METRICS-001b: RPC get_site_top_products
--
-- Objectif:
--   Retourner les top produits vendus sur un canal de type "site"
--   (site_internet, site_boemia, site_solar, site_flos) sur une periode
--   donnee, classes par revenu HT decroissant.
--
-- Source : sales_orders + sales_order_items joints sur products.
-- Exclusions : commandes 'draft' et 'cancelled'.
-- =============================================

CREATE OR REPLACE FUNCTION get_site_top_products(
  p_channel_code TEXT,
  p_period_days INTEGER DEFAULT 90,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  primary_image_url TEXT,
  total_quantity BIGINT,
  total_revenue_ht NUMERIC,
  order_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_id UUID;
  v_start_date TIMESTAMPTZ;
BEGIN
  SELECT id INTO v_channel_id FROM sales_channels WHERE code = p_channel_code;

  IF v_channel_id IS NULL THEN
    RETURN;
  END IF;

  v_start_date := now() - (p_period_days * INTERVAL '1 day');

  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name::TEXT AS product_name,
    p.sku::TEXT AS sku,
    (
      SELECT pi.public_url::TEXT
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = TRUE
      ORDER BY pi.display_order ASC
      LIMIT 1
    ) AS primary_image_url,
    SUM(soi.quantity)::BIGINT AS total_quantity,
    SUM(soi.quantity * soi.unit_price_ht)::NUMERIC AS total_revenue_ht,
    COUNT(DISTINCT so.id)::BIGINT AS order_count
  FROM sales_orders so
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  JOIN products p ON p.id = soi.product_id
  WHERE so.channel_id = v_channel_id
    AND so.created_at >= v_start_date
    AND so.status NOT IN ('cancelled', 'draft')
  GROUP BY p.id, p.name, p.sku
  ORDER BY total_revenue_ht DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_site_top_products IS
  'Top N produits vendus sur un canal site (site_internet / site_boemia / site_solar / site_flos) sur les N derniers jours, classes par revenu HT decroissant. Source : sales_orders + sales_order_items.';

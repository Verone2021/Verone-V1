-- Migration: Fix get_google_merchant_products avec waterfall pricing
-- Created: 2025-11-06
-- Description: Ajouter colonnes prix (price_ht_cents, price_ttc_cents) au RPC get_google_merchant_products
--              Waterfall: channel_product_pricing → price_list_items (Prix B2C) → 0
--              Fix: Produits affichent 0.00 € car RPC ne retourne pas les prix

-- Drop existing function first
DROP FUNCTION IF EXISTS get_google_merchant_products();

-- RPC: Récupérer produits synchronisés Google Merchant (FIXED avec prix)
CREATE OR REPLACE FUNCTION get_google_merchant_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  sku VARCHAR(100),
  product_name VARCHAR(255),
  google_product_id TEXT,
  sync_status TEXT,
  google_status TEXT,
  google_status_detail JSONB,

  -- Prix ajoutés (waterfall: channel → base)
  price_ht_cents INTEGER,
  price_ttc_cents INTEGER,
  tva_rate DECIMAL,
  price_source TEXT, -- 'channel_custom' ou 'base_product'

  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_ht NUMERIC,
  synced_at TIMESTAMPTZ,
  google_status_checked_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gms.id,
    gms.product_id,
    p.sku,
    p.name AS product_name,
    gms.google_product_id,
    gms.sync_status,
    gms.google_status,
    gms.google_status_detail,

    -- Waterfall pricing: channel_product_pricing → price_list_items → cost_price
    COALESCE(
      cpp.price_ht_cents, -- 1. Prix custom Google Merchant (priorité)
      ROUND(pli.price_ht * 100)::INTEGER, -- 2. Prix B2C (conversion euros → centimes)
      ROUND(p.cost_price * (1 + p.margin_percentage/100) * 100)::INTEGER, -- 3. Prix calculé depuis cost_price
      0 -- Fallback si aucun prix
    ) AS price_ht_cents,

    -- TTC calculé dynamiquement
    COALESCE(
      calculate_price_ttc_cents(
        COALESCE(
          cpp.price_ht_cents,
          ROUND(pli.price_ht * 100)::INTEGER,
          ROUND(p.cost_price * (1 + p.margin_percentage/100) * 100)::INTEGER,
          0
        ),
        COALESCE(cpp.tva_rate, 20.00)
      ),
      0
    ) AS price_ttc_cents,

    COALESCE(cpp.tva_rate, 20.00) AS tva_rate,

    -- Source prix (pour debug)
    CASE
      WHEN cpp.price_ht_cents IS NOT NULL THEN 'channel_custom'
      WHEN pli.price_ht IS NOT NULL THEN 'base_product_b2c'
      WHEN p.cost_price IS NOT NULL THEN 'calculated_from_cost'
      ELSE 'none'
    END AS price_source,

    gms.impressions,
    gms.clicks,
    gms.conversions,
    gms.revenue_ht,
    gms.synced_at,
    gms.google_status_checked_at,
    gms.error_message

  FROM google_merchant_syncs gms

  -- Join products
  INNER JOIN products p ON p.id = gms.product_id

  -- Left join prix custom Google Merchant (prioritaire)
  LEFT JOIN channel_product_pricing cpp ON cpp.product_id = gms.product_id
    AND cpp.channel = 'google_merchant'

  -- Left join prix B2C base (fallback)
  LEFT JOIN price_list_items pli ON pli.product_id = gms.product_id
    AND pli.price_list_id = (
      SELECT pl.id FROM price_lists pl WHERE pl.name = 'Prix B2C' LIMIT 1
    )

  WHERE gms.sync_status != 'deleted'

  ORDER BY gms.synced_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_google_merchant_products() IS
'Récupère les produits synchronisés Google Merchant avec waterfall pricing:
1. Prix custom Google Merchant (channel_product_pricing)
2. Prix B2C base (price_list_items)
3. Fallback: 0 si aucun prix';

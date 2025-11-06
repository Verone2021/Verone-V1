-- Migration: Fix Google Merchant eligible products price conversion
-- Created: 2025-11-06
-- Description: Convert price_ht (NUMERIC euros) to price_ht_cents (INTEGER)

-- Drop existing function first
DROP FUNCTION IF EXISTS get_google_merchant_eligible_products();

-- RPC: Récupérer produits éligibles Google Merchant (FIXED)
CREATE OR REPLACE FUNCTION get_google_merchant_eligible_products()
RETURNS TABLE (
  id UUID,
  sku VARCHAR(100),
  name VARCHAR(200),
  description TEXT,
  price_ht_cents INTEGER,
  price_ttc_cents INTEGER,
  tva_rate DECIMAL,
  image_url TEXT,
  stock_status TEXT,
  product_status TEXT,
  gtin VARCHAR(50),
  brand VARCHAR(100)
) AS $$
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

    -- Brand (optionnel, peut être NULL)
    p.brand

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
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_google_merchant_eligible_products() IS
'Récupère les produits éligibles pour Google Merchant (pas encore synchronisés).
Prix convertis de price_ht (NUMERIC euros) vers price_ht_cents (INTEGER centimes).';

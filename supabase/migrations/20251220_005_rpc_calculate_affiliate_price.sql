-- Migration: Create unified pricing RPC for affiliate products
-- Description: Single source of truth for price calculations (classic vs inverted commission)

-- Drop if exists for idempotency
DROP FUNCTION IF EXISTS calculate_affiliate_product_price(UUID, NUMERIC);

-- Create the unified pricing function
CREATE OR REPLACE FUNCTION calculate_affiliate_product_price(
  p_product_id UUID,
  p_margin_rate NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  base_price_ht NUMERIC,
  margin_rate NUMERIC,
  commission_rate NUMERIC,
  affiliate_earning NUMERIC,
  platform_earning NUMERIC,
  final_price_ht NUMERIC,
  pricing_model TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_channel_pricing RECORD;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Get product data
  SELECT
    p.id,
    p.created_by_affiliate,
    p.affiliate_payout_ht,
    p.affiliate_commission_rate,
    p.affiliate_approval_status
  INTO v_product
  FROM products p
  WHERE p.id = p_product_id;

  -- Product not found
  IF v_product.id IS NULL THEN
    RETURN;
  END IF;

  -- Check if this is an affiliate-created product
  IF v_product.created_by_affiliate IS NOT NULL THEN
    -- MODEL 2: Inverted Commission (Affiliate is the seller)
    -- Formula: payout × (1 + commission%) = client price
    -- Affiliate receives: payout
    -- Platform receives: payout × commission%

    RETURN QUERY SELECT
      v_product.affiliate_payout_ht::NUMERIC AS base_price_ht,
      0::NUMERIC AS margin_rate,  -- No margin for affiliate sellers
      COALESCE(v_product.affiliate_commission_rate, 15)::NUMERIC AS commission_rate,
      v_product.affiliate_payout_ht::NUMERIC AS affiliate_earning,
      ROUND(v_product.affiliate_payout_ht * COALESCE(v_product.affiliate_commission_rate, 15) / 100, 2)::NUMERIC AS platform_earning,
      ROUND(v_product.affiliate_payout_ht * (1 + COALESCE(v_product.affiliate_commission_rate, 15) / 100), 2)::NUMERIC AS final_price_ht,
      'affiliate_created'::TEXT AS pricing_model;

  ELSE
    -- MODEL 1: Classic Commission (Verone catalog product)
    -- Formula: base × (1 + commission% + margin%) = client price
    -- Affiliate receives: base × margin%
    -- Platform receives: base × commission%

    -- Get channel pricing for LinkMe
    SELECT
      cp.custom_price_ht,
      cp.channel_commission_rate,
      cp.suggested_margin_rate,
      cp.min_margin_rate,
      cp.max_margin_rate
    INTO v_channel_pricing
    FROM channel_pricing cp
    WHERE cp.product_id = p_product_id
      AND cp.channel_id = v_linkme_channel_id
      AND cp.is_active = true;

    -- No channel pricing found
    IF v_channel_pricing.custom_price_ht IS NULL THEN
      RETURN;
    END IF;

    -- Calculate with margin (use provided, or suggested, or 0)
    DECLARE
      v_margin NUMERIC := COALESCE(p_margin_rate, v_channel_pricing.suggested_margin_rate, 0);
      v_commission NUMERIC := COALESCE(v_channel_pricing.channel_commission_rate, 5);
      v_base NUMERIC := v_channel_pricing.custom_price_ht;
    BEGIN
      -- Clamp margin to min/max if defined
      IF v_channel_pricing.min_margin_rate IS NOT NULL AND v_margin < v_channel_pricing.min_margin_rate THEN
        v_margin := v_channel_pricing.min_margin_rate;
      END IF;
      IF v_channel_pricing.max_margin_rate IS NOT NULL AND v_margin > v_channel_pricing.max_margin_rate THEN
        v_margin := v_channel_pricing.max_margin_rate;
      END IF;

      RETURN QUERY SELECT
        v_base::NUMERIC AS base_price_ht,
        v_margin::NUMERIC AS margin_rate,
        v_commission::NUMERIC AS commission_rate,
        ROUND(v_base * v_margin / 100, 2)::NUMERIC AS affiliate_earning,
        ROUND(v_base * v_commission / 100, 2)::NUMERIC AS platform_earning,
        ROUND(v_base * (1 + v_commission / 100 + v_margin / 100), 2)::NUMERIC AS final_price_ht,
        'classic'::TEXT AS pricing_model;
    END;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION calculate_affiliate_product_price(UUID, NUMERIC) TO authenticated;

-- Comment
COMMENT ON FUNCTION calculate_affiliate_product_price IS
  'Unified pricing calculator for LinkMe products. Supports both classic commission (Verone products) and inverted commission (affiliate-created products) models.';


-- Helper function: Calculate volume in m3 from dimensions JSON
CREATE OR REPLACE FUNCTION calc_product_volume_m3(p_dimensions JSONB)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    ROUND(
      (p_dimensions->>'length_cm')::NUMERIC *
      (p_dimensions->>'width_cm')::NUMERIC *
      (p_dimensions->>'height_cm')::NUMERIC / 1000000,
      6
    ),
    0
  );
$$;

COMMENT ON FUNCTION calc_product_volume_m3 IS
  'Calculates volume in cubic meters from dimensions JSON {length_cm, width_cm, height_cm}';

-- RPCs for updating Meta Commerce product metadata and price

CREATE OR REPLACE FUNCTION update_meta_commerce_metadata(
  p_product_id UUID,
  p_custom_title TEXT DEFAULT NULL,
  p_custom_description TEXT DEFAULT NULL
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

  INSERT INTO channel_product_metadata (product_id, channel_id, custom_title, custom_description)
  VALUES (p_product_id, v_channel_id, p_custom_title, p_custom_description)
  ON CONFLICT (product_id, channel_id) DO UPDATE SET
    custom_title = COALESCE(p_custom_title, channel_product_metadata.custom_title),
    custom_description = COALESCE(p_custom_description, channel_product_metadata.custom_description),
    updated_at = NOW();

  UPDATE channel_pricing
  SET custom_title = COALESCE(p_custom_title, custom_title),
      custom_description = COALESCE(p_custom_description, custom_description),
      updated_at = NOW()
  WHERE product_id = p_product_id AND channel_id = v_channel_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_meta_commerce_price(
  p_product_id UUID,
  p_custom_price_ht NUMERIC
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
  SET custom_price_ht = p_custom_price_ht,
      updated_at = NOW()
  WHERE product_id = p_product_id AND channel_id = v_channel_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found in channel_pricing for Meta Commerce';
  END IF;
END;
$$;

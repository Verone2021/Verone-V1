-- ============================================================================
-- MIGRATION: Add price_display_mode to linkme_selections
-- Date: 2026-01-21
-- Description: Allow each selection to have its own price display mode (HT or TTC)
-- ============================================================================

-- Add price_display_mode column with default TTC
ALTER TABLE public.linkme_selections
ADD COLUMN IF NOT EXISTS price_display_mode TEXT DEFAULT 'TTC'
CHECK (price_display_mode IN ('HT', 'TTC'));

-- Add comment for documentation
COMMENT ON COLUMN public.linkme_selections.price_display_mode IS
  'Price display mode on public selection pages: HT (excluding tax) or TTC (including tax). Defaults to TTC.';

-- ============================================================================
-- UPDATE RPC: get_public_selection
-- ============================================================================
-- Update the RPC to include price_display_mode in the response
CREATE OR REPLACE FUNCTION public.get_public_selection(p_slug text, p_share_token text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_selection_id uuid;
  v_affiliate_id uuid;
  v_result json;
BEGIN
  -- Find selection by slug
  SELECT id, affiliate_id INTO v_selection_id, v_affiliate_id
  FROM linkme_selections
  WHERE slug = p_slug
    AND archived_at IS NULL
    AND (published_at IS NOT NULL OR share_token = p_share_token);

  IF v_selection_id IS NULL THEN
    RETURN json_build_object('error', 'Selection not found');
  END IF;

  -- Track view (only for published selections, not preview)
  IF p_share_token IS NULL THEN
    UPDATE linkme_selections
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = v_selection_id;
  END IF;

  -- Build response with selection details
  SELECT json_build_object(
    'id', s.id,
    'name', s.name,
    'slug', s.slug,
    'description', s.description,
    'image_url', s.image_url,
    'price_display_mode', COALESCE(s.price_display_mode, 'TTC'),
    'affiliate', json_build_object(
      'id', a.id,
      'display_name', a.display_name,
      'slug', a.slug,
      'logo_url', a.logo_url,
      'primary_color', a.primary_color,
      'secondary_color', a.secondary_color,
      'branding_description', a.branding_description,
      'contact_email', a.contact_email,
      'contact_phone', a.contact_phone
    ),
    'products', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', si.id,
          'product_id', si.product_id,
          'product_name', p.name,
          'product_sku', p.sku,
          'product_description', p.description,
          'selling_points', p.selling_points,
          'base_price_ht', si.base_price_ht,
          'margin_rate', si.margin_rate,
          'selling_price_ht', si.selling_price_ht,
          'custom_description', si.custom_description,
          'is_featured', COALESCE(si.is_featured, false),
          'display_order', si.display_order,
          'stock_real', p.stock_real,
          'weight_kg', p.weight_kg,
          'dimensions_cm', p.dimensions_cm,
          'category_name', sc.name,
          'category_id', sc.id,
          'primary_image_url', (
            SELECT pi.public_url
            FROM product_images pi
            WHERE pi.product_id = p.id AND pi.is_primary = true
            LIMIT 1
          ),
          'images', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', pi.id,
                'url', pi.public_url,
                'alt', pi.alt_text,
                'is_primary', pi.is_primary
              ) ORDER BY pi.is_primary DESC, pi.display_order
            ), '[]'::json)
            FROM product_images pi
            WHERE pi.product_id = p.id
          )
        ) ORDER BY si.display_order NULLS LAST, si.created_at
      ), '[]'::json)
      FROM linkme_selection_items si
      JOIN products p ON p.id = si.product_id
      LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
      WHERE si.selection_id = s.id
        AND p.product_status = 'active'
    )
  ) INTO v_result
  FROM linkme_selections s
  JOIN linkme_affiliates a ON a.id = s.affiliate_id
  WHERE s.id = v_selection_id;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Added price_display_mode column to linkme_selections';
  RAISE NOTICE '✅ Updated get_public_selection RPC to include price_display_mode';
END $$;

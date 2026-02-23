-- ============================================================================
-- MIGRATION: Add get_product_detail_public RPC
-- Date: 2026-02-23
-- Description: Returns enriched product details (brand, style, dimensions,
--              weight, suitable_rooms, description, images) for a product
--              that belongs to a published selection. SECURITY DEFINER to
--              bypass RLS (anon cannot SELECT products/product_images directly).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_product_detail_public(
  p_product_id UUID,
  p_selection_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_product RECORD;
  v_images JSONB;
BEGIN
  -- Verify product belongs to a published, non-archived selection with active affiliate
  SELECT
    p.id,
    p.name,
    p.sku,
    p.brand,
    p.style,
    p.dimensions,
    p.weight,
    p.suitable_rooms,
    p.description,
    cat.name AS category_name,
    sc.name AS subcategory_name,
    lsi.selling_price_ht,
    lsi.selling_price_ht * 1.2 AS selling_price_ttc
  INTO v_product
  FROM linkme_selection_items lsi
  JOIN products p ON p.id = lsi.product_id
  JOIN linkme_selections ls ON ls.id = lsi.selection_id
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  LEFT JOIN categories cat ON cat.id = sc.category_id
  WHERE lsi.product_id = p_product_id
    AND lsi.selection_id = p_selection_id
    AND ls.published_at IS NOT NULL
    AND ls.archived_at IS NULL
    AND la.status = 'active';

  IF v_product IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product not found in this published selection'
    );
  END IF;

  -- Get all images sorted by display_order
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'public_url', pi.public_url,
      'is_primary', pi.is_primary,
      'display_order', pi.display_order
    ) ORDER BY pi.display_order ASC
  ), '[]'::jsonb)
  INTO v_images
  FROM product_images pi
  WHERE pi.product_id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product', jsonb_build_object(
      'brand', v_product.brand,
      'style', v_product.style,
      'dimensions', v_product.dimensions,
      'weight', v_product.weight,
      'suitable_rooms', v_product.suitable_rooms,
      'description', v_product.description,
      'category_name', v_product.category_name,
      'subcategory_name', v_product.subcategory_name,
      'selling_price_ht', v_product.selling_price_ht,
      'selling_price_ttc', v_product.selling_price_ttc,
      'images', v_images
    )
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_product_detail_public(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_product_detail_public(UUID, UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Created RPC get_product_detail_public(UUID, UUID)';
  RAISE NOTICE 'Returns: brand, style, dimensions, weight, suitable_rooms, description, category, images';
  RAISE NOTICE 'Granted to: anon, authenticated';
END $$;

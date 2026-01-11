-- ============================================================================
-- MIGRATION: Fix public selection RPCs - remove invalid category column
-- Date: 2026-01-09
-- Description: products.category does not exist, use NULL placeholder
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix get_public_selection (by UUID)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_selection(p_selection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Recuperer la selection
  SELECT ls.*, la.id as affiliate_id
  INTO v_selection
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE ls.id = p_selection_id
    AND ls.published_at IS NOT NULL
    AND ls.archived_at IS NULL
    AND la.status = 'active';

  IF v_selection IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selection non trouvee ou non publique');
  END IF;

  -- Recuperer les items avec is_featured depuis channel_pricing
  SELECT jsonb_agg(item_data ORDER BY is_featured_order DESC, item_created_at)
  INTO v_items
  FROM (
    SELECT
      jsonb_build_object(
        'id', lsi.id,
        'product_id', p.id,
        'product_name', p.name,
        'product_sku', p.sku,
        'product_image', (
          SELECT pi.public_url
          FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_primary = true
          LIMIT 1
        ),
        'base_price_ht', lsi.base_price_ht,
        'selling_price_ht', lsi.selling_price_ht,
        'selling_price_ttc', lsi.selling_price_ht * 1.2,
        'margin_rate', lsi.margin_rate,
        'stock_quantity', COALESCE(p.stock_real, 0),
        'is_featured', COALESCE(cp.is_featured, false),
        'category', NULL::text
      ) as item_data,
      lsi.created_at as item_created_at,
      CASE WHEN COALESCE(cp.is_featured, false) THEN 1 ELSE 0 END as is_featured_order
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = v_linkme_channel_id
    WHERE lsi.selection_id = p_selection_id
  ) sub;

  RETURN jsonb_build_object(
    'success', true,
    'selection', jsonb_build_object(
      'id', v_selection.id,
      'name', v_selection.name,
      'description', v_selection.description,
      'image_url', v_selection.image_url,
      'affiliate_id', v_selection.affiliate_id,
      'published_at', v_selection.published_at,
      'created_at', v_selection.created_at
    ),
    'items', COALESCE(v_items, '[]'::jsonb),
    'item_count', COALESCE(jsonb_array_length(v_items), 0)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_selection(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_selection(uuid) TO authenticated;

-- ============================================================================
-- STEP 2: Fix get_public_selection_by_slug (by slug)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_selection_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Recuperer la selection par slug
  SELECT ls.*, la.id as affiliate_id
  INTO v_selection
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE ls.slug = p_slug
    AND ls.published_at IS NOT NULL
    AND ls.archived_at IS NULL
    AND la.status = 'active';

  IF v_selection IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selection non trouvee ou non publique');
  END IF;

  -- Recuperer les items avec is_featured depuis channel_pricing
  SELECT jsonb_agg(item_data ORDER BY is_featured_order DESC, item_created_at)
  INTO v_items
  FROM (
    SELECT
      jsonb_build_object(
        'id', lsi.id,
        'product_id', p.id,
        'product_name', p.name,
        'product_sku', p.sku,
        'product_image', (
          SELECT pi.public_url
          FROM product_images pi
          WHERE pi.product_id = p.id AND pi.is_primary = true
          LIMIT 1
        ),
        'base_price_ht', lsi.base_price_ht,
        'selling_price_ht', lsi.selling_price_ht,
        'selling_price_ttc', lsi.selling_price_ht * 1.2,
        'margin_rate', lsi.margin_rate,
        'stock_quantity', COALESCE(p.stock_real, 0),
        'is_featured', COALESCE(cp.is_featured, false),
        'category', NULL::text
      ) as item_data,
      lsi.created_at as item_created_at,
      CASE WHEN COALESCE(cp.is_featured, false) THEN 1 ELSE 0 END as is_featured_order
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = v_linkme_channel_id
    WHERE lsi.selection_id = v_selection.id
  ) sub;

  RETURN jsonb_build_object(
    'success', true,
    'selection', jsonb_build_object(
      'id', v_selection.id,
      'name', v_selection.name,
      'slug', v_selection.slug,
      'description', v_selection.description,
      'image_url', v_selection.image_url,
      'affiliate_id', v_selection.affiliate_id,
      'published_at', v_selection.published_at,
      'created_at', v_selection.created_at
    ),
    'items', COALESCE(v_items, '[]'::jsonb),
    'item_count', COALESCE(jsonb_array_length(v_items), 0)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_selection_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_selection_by_slug(text) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RPCs fixed: removed invalid p.category reference';
END $$;

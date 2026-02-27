-- ============================================================================
-- MIGRATION: Filter hidden/inactive products from public selection RPCs
-- Date: 2026-02-26
-- Description: Updates get_public_selection and get_public_selection_by_slug
--              to exclude:
--              1. Items hidden by staff (is_hidden_by_staff = true)
--              2. Products deactivated in catalog (channel_pricing.is_active = false)
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix get_public_selection (by UUID)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_selection(p_selection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
  v_branding JSONB;
  v_affiliate_info JSONB;
  v_organisations JSONB;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Recuperer la selection avec branding depuis linkme_affiliates
  SELECT ls.*, la.id as affiliate_id,
         la.primary_color, la.secondary_color, la.accent_color,
         la.text_color, la.background_color, la.logo_url
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

  -- Recuperer les items avec is_featured et categories
  -- FILTRE: exclure items masques par staff + produits desactives dans catalogue
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
        'category_name', cat.name,
        'subcategory_id', sc.id,
        'subcategory_name', sc.name
      ) as item_data,
      lsi.created_at as item_created_at,
      CASE WHEN COALESCE(cp.is_featured, false) THEN 1 ELSE 0 END as is_featured_order
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = v_linkme_channel_id
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN categories cat ON cat.id = sc.category_id
    WHERE lsi.selection_id = p_selection_id
      AND lsi.is_hidden_by_staff = false
      AND (cp.is_active IS NULL OR cp.is_active = true)
  ) sub;

  -- Branding depuis linkme_affiliates (colonnes directement sur la table)
  v_branding := jsonb_build_object(
    'primary_color', COALESCE(v_selection.primary_color, '#5DBEBB'),
    'secondary_color', COALESCE(v_selection.secondary_color, '#3976BB'),
    'accent_color', COALESCE(v_selection.accent_color, '#7E84C0'),
    'text_color', COALESCE(v_selection.text_color, '#183559'),
    'background_color', COALESCE(v_selection.background_color, '#FFFFFF'),
    'logo_url', v_selection.logo_url
  );

  -- Recuperer les infos de l'affilie
  SELECT jsonb_build_object(
    'affiliate_type', la.affiliate_type,
    'enseigne_id', la.enseigne_id,
    'enseigne_name', e.name
  )
  INTO v_affiliate_info
  FROM linkme_affiliates la
  LEFT JOIN enseignes e ON e.id = la.enseigne_id
  WHERE la.id = v_selection.affiliate_id;

  -- Recuperer les organisations (points de vente) si l'affilie est enseigne_admin
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'name', COALESCE(o.trade_name, o.legal_name),
      'address', o.address_line1,
      'city', o.city,
      'postalCode', o.postal_code,
      'country', o.country,
      'phone', o.phone,
      'email', o.email,
      'latitude', o.latitude,
      'longitude', o.longitude
    )
  )
  INTO v_organisations
  FROM organisations o
  WHERE o.enseigne_id = (
    SELECT enseigne_id FROM linkme_affiliates WHERE id = v_selection.affiliate_id
  )
  AND o.is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'selection', jsonb_build_object(
      'id', v_selection.id,
      'name', v_selection.name,
      'description', v_selection.description,
      'image_url', v_selection.image_url,
      'affiliate_id', v_selection.affiliate_id,
      'published_at', v_selection.published_at,
      'created_at', v_selection.created_at,
      'price_display_mode', COALESCE(v_selection.price_display_mode, 'TTC')
    ),
    'items', COALESCE(v_items, '[]'::jsonb),
    'item_count', COALESCE(jsonb_array_length(v_items), 0),
    'branding', v_branding,
    'affiliate_info', v_affiliate_info,
    'organisations', COALESCE(v_organisations, '[]'::jsonb)
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
SET search_path = public
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
  v_branding JSONB;
  v_affiliate_info JSONB;
  v_organisations JSONB;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Recuperer la selection par slug avec branding depuis linkme_affiliates
  SELECT ls.*, la.id as affiliate_id,
         la.primary_color, la.secondary_color, la.accent_color,
         la.text_color, la.background_color, la.logo_url
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

  -- Recuperer les items avec is_featured et categories
  -- FILTRE: exclure items masques par staff + produits desactives dans catalogue
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
        'category_name', cat.name,
        'subcategory_id', sc.id,
        'subcategory_name', sc.name
      ) as item_data,
      lsi.created_at as item_created_at,
      CASE WHEN COALESCE(cp.is_featured, false) THEN 1 ELSE 0 END as is_featured_order
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = v_linkme_channel_id
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN categories cat ON cat.id = sc.category_id
    WHERE lsi.selection_id = v_selection.id
      AND lsi.is_hidden_by_staff = false
      AND (cp.is_active IS NULL OR cp.is_active = true)
  ) sub;

  -- Branding depuis linkme_affiliates (colonnes directement sur la table)
  v_branding := jsonb_build_object(
    'primary_color', COALESCE(v_selection.primary_color, '#5DBEBB'),
    'secondary_color', COALESCE(v_selection.secondary_color, '#3976BB'),
    'accent_color', COALESCE(v_selection.accent_color, '#7E84C0'),
    'text_color', COALESCE(v_selection.text_color, '#183559'),
    'background_color', COALESCE(v_selection.background_color, '#FFFFFF'),
    'logo_url', v_selection.logo_url
  );

  -- Recuperer les infos de l'affilie
  SELECT jsonb_build_object(
    'affiliate_type', la.affiliate_type,
    'enseigne_id', la.enseigne_id,
    'enseigne_name', e.name
  )
  INTO v_affiliate_info
  FROM linkme_affiliates la
  LEFT JOIN enseignes e ON e.id = la.enseigne_id
  WHERE la.id = v_selection.affiliate_id;

  -- Recuperer les organisations (points de vente) si l'affilie est enseigne_admin
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'name', COALESCE(o.trade_name, o.legal_name),
      'address', o.address_line1,
      'city', o.city,
      'postalCode', o.postal_code,
      'country', o.country,
      'phone', o.phone,
      'email', o.email,
      'latitude', o.latitude,
      'longitude', o.longitude
    )
  )
  INTO v_organisations
  FROM organisations o
  WHERE o.enseigne_id = (
    SELECT enseigne_id FROM linkme_affiliates WHERE id = v_selection.affiliate_id
  )
  AND o.is_active = true;

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
      'created_at', v_selection.created_at,
      'price_display_mode', COALESCE(v_selection.price_display_mode, 'TTC')
    ),
    'items', COALESCE(v_items, '[]'::jsonb),
    'item_count', COALESCE(jsonb_array_length(v_items), 0),
    'branding', v_branding,
    'affiliate_info', v_affiliate_info,
    'organisations', COALESCE(v_organisations, '[]'::jsonb)
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
  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Updated RPCs to filter out:';
  RAISE NOTICE '  - Items with is_hidden_by_staff = true';
  RAISE NOTICE '  - Products with channel_pricing.is_active = false';
  RAISE NOTICE 'Affiliate products (no channel_pricing entry) are NOT affected by is_active filter';
END $$;

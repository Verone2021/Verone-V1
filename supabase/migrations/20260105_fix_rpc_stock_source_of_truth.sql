-- ============================================================================
-- MIGRATION: Fix RPC get_public_selection to use products.stock_real
-- Date: 2026-01-05
-- Description: Les RPCs utilisaient stock_movements.quantity_after au lieu de
--              products.stock_real, causant des affichages "Sur commande"
--              incorrects quand aucun mouvement n'existait.
--
-- Correction: Lire directement products.stock_real (source de verite)
-- ============================================================================

-- ============================================================================
-- STEP 1: Corriger get_public_selection (par UUID)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_selection(p_selection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
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

  -- Recuperer les items avec le stock reel DIRECTEMENT depuis products
  SELECT jsonb_agg(item_data ORDER BY item_created_at)
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
        -- FIX: Utiliser products.stock_real directement (source de verite)
        'stock_quantity', COALESCE(p.stock_real, 0)
      ) as item_data,
      lsi.created_at as item_created_at
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
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

-- Ensure anon can execute
GRANT EXECUTE ON FUNCTION public.get_public_selection(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_selection(uuid) TO authenticated;

-- ============================================================================
-- STEP 2: Corriger get_public_selection_by_slug (par slug)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_selection_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
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

  -- Recuperer les items avec le stock reel DIRECTEMENT depuis products
  SELECT jsonb_agg(item_data ORDER BY item_created_at)
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
        -- FIX: Utiliser products.stock_real directement (source de verite)
        'stock_quantity', COALESCE(p.stock_real, 0)
      ) as item_data,
      lsi.created_at as item_created_at
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
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

-- Ensure anon can execute
GRANT EXECUTE ON FUNCTION public.get_public_selection_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_selection_by_slug(text) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RPCs corrigees:';
  RAISE NOTICE '   - get_public_selection(uuid): stock_quantity = products.stock_real';
  RAISE NOTICE '   - get_public_selection_by_slug(text): stock_quantity = products.stock_real';
  RAISE NOTICE '   - Avant: stock_movements.quantity_after (potentiellement desaligne)';
  RAISE NOTICE '   - Apres: products.stock_real (source de verite unique)';
END $$;

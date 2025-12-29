-- =====================================================
-- Migration: Fix RPC - correct product image column
-- Date: 2025-12-22
-- Description: Utilise product_images table au lieu de main_image_url
-- =====================================================

-- Recréer get_public_selection avec correct image reference
CREATE OR REPLACE FUNCTION get_public_selection(p_selection_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_selection RECORD;
  v_items JSONB;
BEGIN
  -- Recuperer la selection (publiee = published_at NOT NULL)
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

  -- Recuperer les items avec produits
  SELECT jsonb_agg(
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
      'stock_quantity', COALESCE(
        (SELECT SUM(sm.quantity_change) FROM stock_movements sm WHERE sm.product_id = p.id),
        0
      ),
      'category', (SELECT c.name FROM categories c WHERE c.id = p.category_id)
    )
  )
  INTO v_items
  FROM linkme_selection_items lsi
  JOIN products p ON p.id = lsi.product_id
  WHERE lsi.selection_id = p_selection_id
  ORDER BY lsi.created_at;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_public_selection(UUID) IS
  'Recupere une selection publique avec ses produits - images depuis product_images';

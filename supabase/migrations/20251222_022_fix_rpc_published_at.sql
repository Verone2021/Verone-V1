-- =====================================================
-- Migration: Fix RPC - use published_at instead of is_public
-- Date: 2025-12-22
-- Description: Corrige les RPCs pour utiliser published_at IS NOT NULL
-- =====================================================

-- 1. Recréer create_public_order avec published_at
CREATE OR REPLACE FUNCTION create_public_order(
  p_selection_id UUID,
  p_customer_type TEXT,
  p_items JSONB,
  p_customer_code VARCHAR(9) DEFAULT NULL,
  p_customer_data JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_customer_id UUID;
  v_customer_org_type TEXT := 'organization';
  v_affiliate_id UUID;
  v_selection RECORD;
  v_item JSONB;
  v_selection_item RECORD;
  v_total_ht NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_item_total_ht NUMERIC;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
  v_new_customer_id UUID;
BEGIN
  -- 1. Verifier que la selection existe et est publiee (published_at NOT NULL)
  SELECT ls.*, la.id as aff_id, la.user_id as aff_user_id
  INTO v_selection
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE ls.id = p_selection_id
    AND ls.published_at IS NOT NULL
    AND ls.archived_at IS NULL
    AND la.status = 'active';

  IF v_selection IS NULL THEN
    RAISE EXCEPTION 'Selection non trouvee ou non publique';
  END IF;

  v_affiliate_id := v_selection.aff_id;

  -- 2. Identifier ou creer le client
  IF p_customer_type = 'existing' THEN
    IF p_customer_code IS NULL THEN
      RAISE EXCEPTION 'Code client requis pour client existant';
    END IF;

    SELECT id INTO v_customer_id
    FROM organisations
    WHERE linkme_code = UPPER(p_customer_code)
      AND type = 'customer'
      AND is_active = true;

    IF v_customer_id IS NULL THEN
      RAISE EXCEPTION 'Code client invalide ou inactif';
    END IF;

    v_customer_org_type := 'organization';

  ELSIF p_customer_type = 'new' THEN
    IF p_customer_data IS NULL THEN
      RAISE EXCEPTION 'Donnees client requises pour nouveau client';
    END IF;

    IF p_customer_data->>'email' IS NULL OR p_customer_data->>'first_name' IS NULL OR p_customer_data->>'last_name' IS NULL THEN
      RAISE EXCEPTION 'Email, prenom et nom sont requis';
    END IF;

    SELECT id INTO v_customer_id
    FROM individual_customers
    WHERE email = (p_customer_data->>'email');

    IF v_customer_id IS NOT NULL THEN
      v_customer_org_type := 'individual';
    ELSE
      INSERT INTO individual_customers (
        first_name,
        last_name,
        email,
        phone,
        pending_approval,
        created_at
      ) VALUES (
        p_customer_data->>'first_name',
        p_customer_data->>'last_name',
        p_customer_data->>'email',
        p_customer_data->>'phone',
        true,
        NOW()
      ) RETURNING id INTO v_new_customer_id;

      v_customer_id := v_new_customer_id;
      v_customer_org_type := 'individual';
    END IF;
  ELSE
    RAISE EXCEPTION 'Type client invalide: utiliser "existing" ou "new"';
  END IF;

  -- 3. Valider les items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Au moins un produit est requis';
  END IF;

  -- 4. Generer numero de commande
  SELECT 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
         LPAD((COALESCE(MAX(NULLIF(REGEXP_REPLACE(order_number, '^SO-\d{4}-', ''), '')::INTEGER), 0) + 1)::TEXT, 5, '0')
  INTO v_order_number
  FROM sales_orders
  WHERE order_number LIKE 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  -- 5. Creer la commande
  INSERT INTO sales_orders (
    order_number,
    channel_id,
    customer_id,
    customer_type,
    status,
    payment_status,
    created_by_affiliate_id,
    pending_admin_validation,
    linkme_selection_id,
    notes,
    total_ht,
    total_ttc,
    tax_rate,
    shipping_cost_ht,
    insurance_cost_ht,
    handling_cost_ht
  ) VALUES (
    v_order_number,
    v_linkme_channel_id,
    v_customer_id,
    v_customer_org_type,
    'draft',
    'pending',
    v_affiliate_id,
    true,
    p_selection_id,
    'Commande via page publique LinkMe',
    0,
    0,
    0.2,
    0,
    0,
    0
  ) RETURNING id INTO v_order_id;

  -- 6. Creer les lignes de commande
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT
      lsi.*,
      p.name as product_name,
      p.sku as product_sku
    INTO v_selection_item
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    WHERE lsi.id = (v_item->>'selection_item_id')::UUID
      AND lsi.selection_id = p_selection_id;

    IF v_selection_item IS NULL THEN
      RAISE EXCEPTION 'Item de selection non trouve: %', v_item->>'selection_item_id';
    END IF;

    v_item_total_ht := v_selection_item.selling_price_ht * (v_item->>'quantity')::INTEGER;

    INSERT INTO sales_order_items (
      sales_order_id,
      product_id,
      quantity,
      unit_price_ht,
      tax_rate,
      linkme_selection_item_id,
      retrocession_rate,
      retrocession_amount
    ) VALUES (
      v_order_id,
      v_selection_item.product_id,
      (v_item->>'quantity')::INTEGER,
      v_selection_item.selling_price_ht,
      0.2,
      v_selection_item.id,
      v_selection_item.margin_rate,
      v_selection_item.base_price_ht * v_selection_item.margin_rate / 100 * (v_item->>'quantity')::INTEGER
    );

    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;

  -- 7. Mettre a jour les totaux
  v_total_ttc := v_total_ht * 1.2;

  UPDATE sales_orders
  SET total_ht = v_total_ht, total_ttc = v_total_ttc
  WHERE id = v_order_id;

  -- 8. Retourner le resultat
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_ht', v_total_ht,
    'total_ttc', v_total_ttc,
    'customer_id', v_customer_id,
    'is_new_customer', (p_customer_type = 'new' AND v_new_customer_id IS NOT NULL)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recréer get_public_selection avec published_at
CREATE OR REPLACE FUNCTION get_public_selection(p_selection_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_selection RECORD;
  v_items JSONB;
  v_affiliate RECORD;
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
      'product_image', p.main_image_url,
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

-- 3. Recréer track_selection_view
CREATE OR REPLACE FUNCTION track_selection_view(p_selection_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE linkme_selections
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_selection_id
    AND published_at IS NOT NULL
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON FUNCTION create_public_order(UUID, TEXT, JSONB, VARCHAR, JSONB) IS
  'Cree une commande depuis la page publique LinkMe - utilise published_at pour verifier publication';
COMMENT ON FUNCTION get_public_selection(UUID) IS
  'Recupere une selection publique avec ses produits - utilise published_at';

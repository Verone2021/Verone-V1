-- ============================================================================
-- Migration: Fix create_affiliate_order - add created_by
-- Date: 2025-12-19
-- Description: Ajoute created_by = auth.uid() dans la RPC create_affiliate_order
-- ============================================================================

CREATE OR REPLACE FUNCTION create_affiliate_order(
  p_affiliate_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT,
  p_selection_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_selection_item RECORD;
  v_total_ht NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_item_total_ht NUMERIC;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
  v_current_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur courant
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Validations
  IF NOT EXISTS (
    SELECT 1 FROM linkme_affiliates
    WHERE id = p_affiliate_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Affilié non trouvé ou inactif';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RAISE EXCEPTION 'Sélection non trouvée ou n appartient pas à l affilié';
  END IF;

  IF p_customer_type = 'organization' THEN
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Organisation cliente non trouvée';
    END IF;
  ELSIF p_customer_type = 'individual' THEN
    IF NOT EXISTS (SELECT 1 FROM individual_customers WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Client individuel non trouvé';
    END IF;
  ELSE
    RAISE EXCEPTION 'Type de client invalide';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Au moins un produit est requis';
  END IF;

  -- Génération numéro de commande
  SELECT 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
         LPAD((COALESCE(MAX(NULLIF(REGEXP_REPLACE(order_number, '^SO-\d{4}-', ''), '')::INTEGER), 0) + 1)::TEXT, 5, '0')
  INTO v_order_number
  FROM sales_orders
  WHERE order_number LIKE 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  -- Création de la commande avec created_by
  INSERT INTO sales_orders (
    order_number,
    channel_id,
    customer_id,
    customer_type,
    status,
    payment_status,
    created_by,
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
    p_customer_id,
    p_customer_type,
    'draft',
    'pending',
    v_current_user_id,
    p_affiliate_id,
    true,
    p_selection_id,
    p_notes,
    0,
    0,
    0.2,
    0,
    0,
    0
  ) RETURNING id INTO v_order_id;

  -- Création des lignes de commande
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
      RAISE EXCEPTION 'Item de sélection non trouvé';
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

  -- Mise à jour des totaux
  v_total_ttc := v_total_ht * 1.2;

  UPDATE sales_orders
  SET total_ht = v_total_ht, total_ttc = v_total_ttc
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

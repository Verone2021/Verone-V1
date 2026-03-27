-- Fix create_affiliate_order RPC to save franchise_legal_name, franchise_siret, kbis_url
-- These fields were passed in p_linkme_details but never saved
-- Also drop old overload with different parameter order to avoid ambiguity
DROP FUNCTION IF EXISTS create_affiliate_order(uuid, uuid, uuid, text, jsonb, text, jsonb, uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION create_affiliate_order(
  p_affiliate_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT,
  p_selection_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL,
  p_responsable_contact_id UUID DEFAULT NULL,
  p_billing_contact_id UUID DEFAULT NULL,
  p_delivery_contact_id UUID DEFAULT NULL,
  p_linkme_details JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID; v_order_number TEXT; v_item JSONB; v_selection_item RECORD;
  v_total_ht NUMERIC := 0; v_total_ttc NUMERIC := 0; v_item_total_ht NUMERIC; v_unit_price NUMERIC;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
  v_max_num INTEGER; v_year TEXT; v_current_user_id UUID;
  v_shipping_address_jsonb JSONB; v_expected_delivery_date DATE;
BEGIN
  v_current_user_id := auth.uid();
  IF NOT EXISTS (SELECT 1 FROM linkme_affiliates WHERE id = p_affiliate_id AND status = 'active') THEN
    RAISE EXCEPTION 'Affilie non trouve ou inactif: %', p_affiliate_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM linkme_selections WHERE id = p_selection_id AND affiliate_id = p_affiliate_id) THEN
    RAISE EXCEPTION 'Selection non trouvee ou n appartient pas a l affilie: %', p_selection_id; END IF;
  IF p_customer_type = 'organization' THEN
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = p_customer_id) THEN RAISE EXCEPTION 'Organisation cliente non trouvee: %', p_customer_id; END IF;
  ELSIF p_customer_type = 'individual' THEN
    IF NOT EXISTS (SELECT 1 FROM individual_customers WHERE id = p_customer_id) THEN RAISE EXCEPTION 'Client individuel non trouve: %', p_customer_id; END IF;
  ELSE RAISE EXCEPTION 'Type de client invalide: %. Doit etre organization ou individual', p_customer_type; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Au moins un produit est requis'; END IF;
  IF p_responsable_contact_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_responsable_contact_id AND is_active = TRUE) THEN RAISE EXCEPTION 'Contact responsable invalide ou inactif: %', p_responsable_contact_id; END IF; END IF;
  IF p_billing_contact_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_billing_contact_id AND is_active = TRUE) THEN RAISE EXCEPTION 'Contact facturation invalide ou inactif: %', p_billing_contact_id; END IF; END IF;
  IF p_delivery_contact_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_delivery_contact_id AND is_active = TRUE) THEN RAISE EXCEPTION 'Contact livraison invalide ou inactif: %', p_delivery_contact_id; END IF; END IF;
  IF p_linkme_details IS NOT NULL THEN
    IF p_linkme_details->>'delivery_address' IS NOT NULL THEN
      v_shipping_address_jsonb := jsonb_build_object('line1', p_linkme_details->>'delivery_address', 'postal_code', p_linkme_details->>'delivery_postal_code', 'city', p_linkme_details->>'delivery_city', 'country', COALESCE(p_linkme_details->>'delivery_country', 'FR')); END IF;
    IF p_linkme_details->>'desired_delivery_date' IS NOT NULL AND p_linkme_details->>'desired_delivery_date' != '' THEN
      v_expected_delivery_date := (p_linkme_details->>'desired_delivery_date')::DATE; END IF; END IF;

  -- Save kbis_url and siret on organisation if provided
  IF p_linkme_details IS NOT NULL AND p_customer_type = 'organization' THEN
    UPDATE organisations SET
      kbis_url = COALESCE(p_linkme_details->>'kbis_url', kbis_url),
      siret = COALESCE(p_linkme_details->>'franchise_siret', siret),
      legal_name = COALESCE(NULLIF(p_linkme_details->>'franchise_legal_name', ''), legal_name)
    WHERE id = p_customer_id
      AND (p_linkme_details->>'kbis_url' IS NOT NULL OR p_linkme_details->>'franchise_siret' IS NOT NULL OR p_linkme_details->>'franchise_legal_name' IS NOT NULL);
  END IF;

  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CASE WHEN LENGTH(order_number) >= 13 AND SUBSTRING(order_number FROM 10) ~ '^\d+$' THEN SUBSTRING(order_number FROM 10)::INTEGER ELSE 0 END), 0) INTO v_max_num FROM sales_orders WHERE order_number LIKE 'SO-' || v_year || '-%';
  v_order_number := 'SO-' || v_year || '-' || LPAD((v_max_num + 1)::TEXT, 5, '0');
  INSERT INTO sales_orders (order_number, channel_id, customer_id, customer_type, status, payment_status_v2, created_by, created_by_affiliate_id, pending_admin_validation, linkme_selection_id, notes, total_ht, total_ttc, tax_rate, shipping_cost_ht, insurance_cost_ht, handling_cost_ht, responsable_contact_id, billing_contact_id, delivery_contact_id, shipping_address, expected_delivery_date)
  VALUES (v_order_number, v_linkme_channel_id, p_customer_id, p_customer_type, 'draft', 'pending', v_current_user_id, p_affiliate_id, true, p_selection_id, p_notes, 0, 0, 0.2, 0, 0, 0, p_responsable_contact_id, p_billing_contact_id, p_delivery_contact_id, v_shipping_address_jsonb, v_expected_delivery_date)
  RETURNING id INTO v_order_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT lsi.*, p.name as product_name, p.sku as product_sku INTO v_selection_item FROM linkme_selection_items lsi JOIN products p ON p.id = lsi.product_id WHERE lsi.id = (v_item->>'selection_item_id')::UUID AND lsi.selection_id = p_selection_id;
    IF v_selection_item IS NULL THEN RAISE EXCEPTION 'Item de selection non trouve ou n appartient pas a la selection: %', v_item->>'selection_item_id'; END IF;
    v_unit_price := v_selection_item.selling_price_ht;
    v_item_total_ht := v_unit_price * (v_item->>'quantity')::INTEGER;
    INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price_ht, tax_rate, linkme_selection_item_id, retrocession_rate)
    VALUES (v_order_id, v_selection_item.product_id, (v_item->>'quantity')::INTEGER, v_unit_price, 0.2, v_selection_item.id, v_selection_item.margin_rate / 100);
    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;
  v_total_ttc := v_total_ht * 1.2;
  UPDATE sales_orders SET total_ht = v_total_ht, total_ttc = v_total_ttc WHERE id = v_order_id;
  IF p_linkme_details IS NOT NULL THEN
    INSERT INTO sales_order_linkme_details (sales_order_id, requester_type, requester_name, requester_email, requester_phone, requester_position, is_new_restaurant, owner_type, owner_company_legal_name, owner_company_trade_name, owner_kbis_url, billing_contact_source, billing_name, billing_email, billing_phone, delivery_contact_name, delivery_contact_email, delivery_contact_phone, delivery_address, delivery_postal_code, delivery_city, delivery_latitude, delivery_longitude, delivery_date, desired_delivery_date, is_mall_delivery, mall_email, semi_trailer_accessible, access_form_url, delivery_notes, delivery_terms_accepted)
    VALUES (v_order_id, COALESCE(p_linkme_details->>'requester_type', 'responsable_enseigne'), COALESCE(p_linkme_details->>'requester_name', ''), COALESCE(p_linkme_details->>'requester_email', ''), p_linkme_details->>'requester_phone', p_linkme_details->>'requester_position', COALESCE((p_linkme_details->>'is_new_restaurant')::BOOLEAN, false), p_linkme_details->>'owner_type',
      p_linkme_details->>'franchise_legal_name', p_linkme_details->>'franchise_trade_name', p_linkme_details->>'kbis_url',
      p_linkme_details->>'billing_contact_source', p_linkme_details->>'billing_name', p_linkme_details->>'billing_email', p_linkme_details->>'billing_phone', p_linkme_details->>'delivery_contact_name', p_linkme_details->>'delivery_contact_email', p_linkme_details->>'delivery_contact_phone', p_linkme_details->>'delivery_address', p_linkme_details->>'delivery_postal_code', p_linkme_details->>'delivery_city', CASE WHEN p_linkme_details->>'delivery_latitude' IS NOT NULL THEN (p_linkme_details->>'delivery_latitude')::NUMERIC END, CASE WHEN p_linkme_details->>'delivery_longitude' IS NOT NULL THEN (p_linkme_details->>'delivery_longitude')::NUMERIC END, v_expected_delivery_date, v_expected_delivery_date, COALESCE((p_linkme_details->>'is_mall_delivery')::BOOLEAN, false), p_linkme_details->>'mall_email', COALESCE((p_linkme_details->>'semi_trailer_accessible')::BOOLEAN, true), p_linkme_details->>'access_form_url', p_linkme_details->>'delivery_notes', COALESCE((p_linkme_details->>'delivery_terms_accepted')::BOOLEAN, false));
  END IF;
  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;

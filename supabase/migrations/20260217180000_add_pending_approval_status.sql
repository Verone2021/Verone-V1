-- ============================================================================
-- Migration: Replace pending_admin_validation boolean with pending_approval status
--
-- Context: Affiliate LinkMe orders used a separate boolean (pending_admin_validation)
-- alongside the 'draft' status to track admin approval. This is confusing.
-- We integrate approval into the status workflow:
--   pending_approval -> draft (approved) or cancelled (rejected)
--
-- Stock impact: NONE. Stock triggers only fire on draft -> validated transition.
-- ============================================================================

-- 1. Add pending_approval to the sales_order_status enum (before 'draft')
ALTER TYPE sales_order_status ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'draft';

-- 2. Migrate existing data (commandes en attente -> nouveau statut)
-- NOTE: Must be in separate statement after ADD VALUE (PG requires commit between)
UPDATE sales_orders
SET status = 'pending_approval'
WHERE pending_admin_validation = true AND status = 'draft';

-- 3. Recreate affiliate_pending_orders view (DROP needed because so.* columns changed)
DROP VIEW IF EXISTS affiliate_pending_orders;
CREATE VIEW affiliate_pending_orders AS
SELECT
  so.*,
  la.display_name as affiliate_name,
  la.email as affiliate_email,
  la.affiliate_type,
  ls.name as selection_name
FROM sales_orders so
JOIN linkme_affiliates la ON so.created_by_affiliate_id = la.id
LEFT JOIN linkme_selections ls ON so.linkme_selection_id = ls.id
WHERE so.status = 'pending_approval';

GRANT SELECT ON affiliate_pending_orders TO authenticated;

-- 4. Update create_affiliate_order RPC: insert with pending_approval status
CREATE OR REPLACE FUNCTION public.create_affiliate_order(
  p_affiliate_id uuid,
  p_customer_id uuid,
  p_customer_type text,
  p_selection_id uuid,
  p_items jsonb,
  p_notes text DEFAULT NULL::text,
  p_responsable_contact_id uuid DEFAULT NULL::uuid,
  p_billing_contact_id uuid DEFAULT NULL::uuid,
  p_delivery_contact_id uuid DEFAULT NULL::uuid,
  p_linkme_details jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_selection_item RECORD;
  v_total_ht NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_item_total_ht NUMERIC;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
  v_max_num INTEGER;
  v_year TEXT;
  v_current_user_id UUID;
  v_shipping_address_jsonb JSONB;
  v_expected_delivery_date DATE;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifie';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM linkme_affiliates
    WHERE id = p_affiliate_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Affilie non trouve ou inactif: %', p_affiliate_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RAISE EXCEPTION 'Selection non trouvee ou n appartient pas a l affilie: %', p_selection_id;
  END IF;

  IF p_customer_type = 'organization' THEN
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Organisation cliente non trouvee: %', p_customer_id;
    END IF;
  ELSIF p_customer_type = 'individual' THEN
    IF NOT EXISTS (SELECT 1 FROM individual_customers WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Client individuel non trouve: %', p_customer_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Type de client invalide: %. Doit etre organization ou individual', p_customer_type;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Au moins un produit est requis';
  END IF;

  IF p_responsable_contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = p_responsable_contact_id AND is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'Contact responsable invalide ou inactif: %', p_responsable_contact_id;
    END IF;
  END IF;

  IF p_billing_contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = p_billing_contact_id AND is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'Contact facturation invalide ou inactif: %', p_billing_contact_id;
    END IF;
  END IF;

  IF p_delivery_contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = p_delivery_contact_id AND is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'Contact livraison invalide ou inactif: %', p_delivery_contact_id;
    END IF;
  END IF;

  -- Extract delivery address from p_linkme_details if provided
  IF p_linkme_details IS NOT NULL THEN
    IF p_linkme_details->>'delivery_address' IS NOT NULL THEN
      v_shipping_address_jsonb := jsonb_build_object(
        'line1', p_linkme_details->>'delivery_address',
        'postal_code', p_linkme_details->>'delivery_postal_code',
        'city', p_linkme_details->>'delivery_city',
        'country', COALESCE(p_linkme_details->>'delivery_country', 'FR')
      );
    END IF;
    IF p_linkme_details->>'desired_delivery_date' IS NOT NULL
       AND p_linkme_details->>'desired_delivery_date' != '' THEN
      v_expected_delivery_date := (p_linkme_details->>'desired_delivery_date')::DATE;
    END IF;
  END IF;

  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(
    MAX(
      CASE
        WHEN LENGTH(order_number) >= 13
             AND SUBSTRING(order_number FROM 10) ~ '^\d+$'
        THEN SUBSTRING(order_number FROM 10)::INTEGER
        ELSE 0
      END
    ), 0
  ) INTO v_max_num
  FROM sales_orders
  WHERE order_number LIKE 'SO-' || v_year || '-%';

  v_order_number := 'SO-' || v_year || '-' || LPAD((v_max_num + 1)::TEXT, 5, '0');

  -- INSERT with pending_approval status (was 'draft' + pending_admin_validation=true)
  INSERT INTO sales_orders (
    order_number, channel_id, customer_id, customer_type,
    status, payment_status_v2, created_by, created_by_affiliate_id,
    pending_admin_validation, linkme_selection_id, notes,
    total_ht, total_ttc, tax_rate,
    shipping_cost_ht, insurance_cost_ht, handling_cost_ht,
    responsable_contact_id, billing_contact_id, delivery_contact_id,
    shipping_address, expected_delivery_date
  ) VALUES (
    v_order_number, v_linkme_channel_id, p_customer_id, p_customer_type,
    'pending_approval', 'pending', v_current_user_id, p_affiliate_id,
    true, p_selection_id, p_notes,
    0, 0, 0.2,
    0, 0, 0,
    p_responsable_contact_id, p_billing_contact_id, p_delivery_contact_id,
    v_shipping_address_jsonb, v_expected_delivery_date
  ) RETURNING id INTO v_order_id;

  -- Create order items
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
      RAISE EXCEPTION 'Item de selection non trouve ou n appartient pas a la selection: %', v_item->>'selection_item_id';
    END IF;

    v_item_total_ht := v_selection_item.selling_price_ht * (v_item->>'quantity')::INTEGER;

    INSERT INTO sales_order_items (
      sales_order_id, product_id, quantity, unit_price_ht,
      tax_rate, linkme_selection_item_id,
      retrocession_rate, retrocession_amount
    ) VALUES (
      v_order_id, v_selection_item.product_id,
      (v_item->>'quantity')::INTEGER, v_selection_item.selling_price_ht,
      0.2, v_selection_item.id,
      v_selection_item.margin_rate,
      ROUND(
        (v_selection_item.selling_price_ht - v_selection_item.base_price_ht)
        * (v_item->>'quantity')::INTEGER,
        2
      )
    );

    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;

  v_total_ttc := v_total_ht * 1.2;

  UPDATE sales_orders
  SET total_ht = v_total_ht, total_ttc = v_total_ttc
  WHERE id = v_order_id;

  -- Insert into sales_order_linkme_details (atomic, same transaction)
  IF p_linkme_details IS NOT NULL THEN
    INSERT INTO sales_order_linkme_details (
      sales_order_id,
      requester_type, requester_name, requester_email, requester_phone,
      requester_position, is_new_restaurant,
      owner_type,
      billing_contact_source, billing_name, billing_email, billing_phone,
      delivery_contact_name, delivery_contact_email, delivery_contact_phone,
      delivery_address, delivery_postal_code, delivery_city,
      delivery_latitude, delivery_longitude,
      delivery_date, desired_delivery_date,
      is_mall_delivery, mall_email, semi_trailer_accessible,
      access_form_url, delivery_notes,
      delivery_terms_accepted
    ) VALUES (
      v_order_id,
      COALESCE(p_linkme_details->>'requester_type', 'responsable_enseigne'),
      COALESCE(p_linkme_details->>'requester_name', ''),
      COALESCE(p_linkme_details->>'requester_email', ''),
      p_linkme_details->>'requester_phone',
      p_linkme_details->>'requester_position',
      COALESCE((p_linkme_details->>'is_new_restaurant')::BOOLEAN, false),
      p_linkme_details->>'owner_type',
      p_linkme_details->>'billing_contact_source',
      p_linkme_details->>'billing_name',
      p_linkme_details->>'billing_email',
      p_linkme_details->>'billing_phone',
      p_linkme_details->>'delivery_contact_name',
      p_linkme_details->>'delivery_contact_email',
      p_linkme_details->>'delivery_contact_phone',
      p_linkme_details->>'delivery_address',
      p_linkme_details->>'delivery_postal_code',
      p_linkme_details->>'delivery_city',
      CASE WHEN p_linkme_details->>'delivery_latitude' IS NOT NULL
           THEN (p_linkme_details->>'delivery_latitude')::NUMERIC END,
      CASE WHEN p_linkme_details->>'delivery_longitude' IS NOT NULL
           THEN (p_linkme_details->>'delivery_longitude')::NUMERIC END,
      v_expected_delivery_date,
      v_expected_delivery_date,
      COALESCE((p_linkme_details->>'is_mall_delivery')::BOOLEAN, false),
      p_linkme_details->>'mall_email',
      COALESCE((p_linkme_details->>'semi_trailer_accessible')::BOOLEAN, true),
      p_linkme_details->>'access_form_url',
      p_linkme_details->>'delivery_notes',
      COALESCE((p_linkme_details->>'delivery_terms_accepted')::BOOLEAN, false)
    );
  END IF;

  RETURN v_order_id;
END;
$function$;

-- 5. Update validate_affiliate_order: pending_approval -> draft
CREATE OR REPLACE FUNCTION validate_affiliate_order(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Check order exists and is pending approval
  SELECT * INTO v_order
  FROM sales_orders
  WHERE id = p_order_id
    AND status = 'pending_approval';

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Commande non trouvee ou pas en attente d approbation: %', p_order_id;
  END IF;

  -- Approve: move to draft status (ready for normal workflow)
  UPDATE sales_orders
  SET
    status = 'draft',
    pending_admin_validation = false,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update reject_affiliate_order: pending_approval -> cancelled
CREATE OR REPLACE FUNCTION reject_affiliate_order(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Rejetee par admin'
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Check order exists and is pending approval
  SELECT * INTO v_order
  FROM sales_orders
  WHERE id = p_order_id
    AND status = 'pending_approval';

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Commande non trouvee ou pas en attente d approbation: %', p_order_id;
  END IF;

  -- Reject: cancel the order
  UPDATE sales_orders
  SET
    status = 'cancelled',
    pending_admin_validation = false,
    notes = COALESCE(notes, '') || E'\n[REJET ADMIN] ' || p_reason,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION validate_affiliate_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_affiliate_order(UUID, TEXT) TO authenticated;

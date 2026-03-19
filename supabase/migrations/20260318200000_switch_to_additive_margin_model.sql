-- =============================================================================
-- SWITCH: Taux de marque (inclusif) → Taux de marge additif
-- =============================================================================
-- OLD formula: selling_price_ht = base_price_ht / (1 - margin_rate/100)
-- NEW formula: selling_price_ht = base_price_ht * (1 + margin_rate/100)
--
-- PRINCIPLE: NO PRICE CHANGES. Only margin_rate is recalculated.
-- Example PLA-0002: base=13.50, selling=15.88
--   margin_rate: 15.00 → 17.63 (so that 13.50 * 1.1763 ≈ 15.88)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Step 1: Save current prices for verification
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _old_prices AS
SELECT id, selling_price_ht, margin_rate, base_price_ht
FROM linkme_selection_items;

-- ---------------------------------------------------------------------------
-- Step 2: Drop dependent views (CASCADE handles linkme_orders_with_margins)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS public.linkme_order_items_enriched CASCADE;
DROP VIEW IF EXISTS public.linkme_orders_enriched CASCADE;
DROP VIEW IF EXISTS public.linkme_selection_items_with_pricing CASCADE;

-- ---------------------------------------------------------------------------
-- Step 3: Change the GENERATED column formula
-- ---------------------------------------------------------------------------
ALTER TABLE linkme_selection_items DROP COLUMN selling_price_ht;
ALTER TABLE linkme_selection_items ADD COLUMN selling_price_ht NUMERIC(10,2)
  GENERATED ALWAYS AS (
    CASE WHEN margin_rate = 0 THEN base_price_ht
         ELSE ROUND(base_price_ht * (1 + margin_rate / 100), 2)
    END
  ) STORED;

-- ---------------------------------------------------------------------------
-- Step 4: Recalculate margin_rate to preserve selling prices
-- Old formula: selling = base / (1 - margin/100)
-- So: old_selling = base / (1 - margin/100)
-- New margin = (old_selling - base) / base * 100
-- ---------------------------------------------------------------------------
UPDATE linkme_selection_items
SET margin_rate = ROUND(
  (base_price_ht / (1 - margin_rate / 100) - base_price_ht) / base_price_ht * 100, 2
)
WHERE base_price_ht > 0
  AND margin_rate > 0;

-- ---------------------------------------------------------------------------
-- Step 4b: Fix B&W items — base_price_ht was incorrectly set to 405 (artifact
-- of old model). Real Verone price = 450, client price = 495, margin = 10%.
-- ---------------------------------------------------------------------------
UPDATE linkme_selection_items
SET base_price_ht = 450.00, margin_rate = 10.00
WHERE id IN ('48e36985-1717-4f95-b2cd-b79e83972ac1', '9be70233-570b-4eaf-8de0-a90093fe57e3');

-- Fix B&W locked prices in existing orders (remove 405 artifact)
UPDATE sales_order_items soi
SET base_price_ht_locked = 450.00, selling_price_ht_locked = 495.00
FROM sales_orders so
WHERE soi.sales_order_id = so.id
  AND so.created_by_affiliate_id = '4c60050b-79e4-4453-9388-6f3db25bc04f'
  AND soi.base_price_ht_locked = 405.00;

-- ---------------------------------------------------------------------------
-- Step 5: Verify NO price changed (RAISE EXCEPTION if any drift > 0.01)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM linkme_selection_items lsi
    JOIN _old_prices op ON op.id = lsi.id
    WHERE op.margin_rate > 0
      AND ABS(lsi.selling_price_ht - op.selling_price_ht) > 0.01
  ) THEN
    RAISE EXCEPTION 'ERREUR: selling_price_ht a change apres recalcul margin_rate! Migration annulee.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Step 6: Recreate views
-- ---------------------------------------------------------------------------

-- 6a. linkme_selection_items_with_pricing (identical to before, reads GENERATED)
CREATE OR REPLACE VIEW linkme_selection_items_with_pricing AS
SELECT
  lsi.id,
  lsi.selection_id,
  lsi.product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  pi.public_url AS product_image,
  lsi.base_price_ht,
  lsi.selling_price_ht,
  round(lsi.selling_price_ht * 1.20, 2) AS selling_price_ttc,
  lsi.margin_rate,
  c.name AS category_name,
  p.subcategory_id,
  sc.name AS subcategory_name,
  lsi.display_order
FROM linkme_selection_items lsi
JOIN products p ON (p.id = lsi.product_id)
LEFT JOIN product_images pi ON (pi.product_id = p.id AND pi.is_primary = true)
LEFT JOIN subcategories sc ON (sc.id = p.subcategory_id)
LEFT JOIN categories c ON (c.id = sc.category_id);

ALTER VIEW linkme_selection_items_with_pricing SET (security_invoker = on);

-- 6b. linkme_order_items_enriched (FIXED: selling_price = client price, base = Verone price)
CREATE VIEW public.linkme_order_items_enriched AS
SELECT
  soi.id,
  soi.sales_order_id,
  soi.product_id,
  soi.quantity,
  soi.unit_price_ht,
  soi.total_ht,
  soi.linkme_selection_item_id,
  soi.tax_rate,
  p.name AS product_name,
  p.sku AS product_sku,
  pi.public_url AS product_image_url,
  -- base_price_ht = prix VERONE
  COALESCE(soi.base_price_ht_locked, lsi.base_price_ht, soi.unit_price_ht) AS base_price_ht,
  COALESCE(lsi.margin_rate, 0::numeric) AS margin_rate,
  COALESCE(cp.channel_commission_rate, 0::numeric) AS commission_rate,
  -- selling_price_ht = prix CLIENT (from locked snapshot or selection)
  COALESCE(soi.selling_price_ht_locked, lsi.selling_price_ht)::numeric(10,2) AS selling_price_ht,
  -- affiliate_margin = use retrocession_amount (correctly computed by trigger)
  COALESCE(soi.retrocession_amount, 0)::numeric(10,2) AS affiliate_margin,
  COALESCE(soi.retrocession_rate, 0::numeric) AS retrocession_rate
FROM sales_order_items soi
  LEFT JOIN products p ON p.id = soi.product_id
  LEFT JOIN product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true
  LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  LEFT JOIN channel_pricing cp ON cp.product_id = soi.product_id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
WHERE EXISTS (
  SELECT 1 FROM sales_orders so
  WHERE so.id = soi.sales_order_id
    AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
);

-- 6c. linkme_orders_enriched (same as before)
CREATE VIEW public.linkme_orders_enriched AS
SELECT so.id,
    so.order_number,
    so.status,
    so.payment_status_v2 AS payment_status,
    so.total_ht,
    so.total_ttc,
    so.customer_type,
    so.customer_id,
    so.created_at,
    so.updated_at,
    so.channel_id,
    CASE
        WHEN so.customer_type = 'organization'::text THEN COALESCE(org.trade_name, org.legal_name, 'Organisation'::character varying)
        WHEN so.customer_type = 'individual'::text THEN concat_ws(' '::text, ic.first_name, ic.last_name)::character varying
        ELSE 'Client inconnu'::character varying
    END AS customer_name,
    CASE
        WHEN so.customer_type = 'organization'::text THEN org.address_line1
        ELSE ic.address_line1
    END AS customer_address,
    CASE
        WHEN so.customer_type = 'organization'::text THEN org.postal_code::text
        ELSE ic.postal_code
    END AS customer_postal_code,
    CASE
        WHEN so.customer_type = 'organization'::text THEN org.city::text
        ELSE ic.city
    END AS customer_city,
    CASE
        WHEN so.customer_type = 'organization'::text THEN org.email::text
        ELSE ic.email
    END AS customer_email,
    CASE
        WHEN so.customer_type = 'organization'::text THEN org.phone::text
        ELSE ic.phone
    END AS customer_phone,
    la.display_name AS affiliate_name,
    CASE
        WHEN la.enseigne_id IS NOT NULL THEN 'enseigne'::text
        WHEN la.organisation_id IS NOT NULL THEN 'organisation'::text
        ELSE NULL::text
    END AS affiliate_type,
    ls.name AS selection_name,
    ls.id AS selection_id
FROM sales_orders so
  LEFT JOIN organisations org ON so.customer_type = 'organization'::text AND so.customer_id = org.id
  LEFT JOIN individual_customers ic ON so.customer_type = 'individual'::text AND so.customer_id = ic.id
  LEFT JOIN LATERAL (
    SELECT soi.linkme_selection_item_id
    FROM sales_order_items soi
    WHERE soi.sales_order_id = so.id AND soi.linkme_selection_item_id IS NOT NULL
    LIMIT 1
  ) first_item ON true
  LEFT JOIN linkme_selection_items lsi ON lsi.id = first_item.linkme_selection_item_id
  LEFT JOIN linkme_selections ls ON ls.id = lsi.selection_id
  LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id
WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid;

-- 6d. linkme_orders_with_margins (depends on 6b + 6c)
CREATE VIEW public.linkme_orders_with_margins AS
SELECT loe.id,
    loe.order_number,
    loe.status,
    loe.payment_status,
    loe.total_ht,
    loe.total_ttc,
    loe.customer_type,
    loe.customer_id,
    loe.created_at,
    loe.updated_at,
    loe.channel_id,
    loe.customer_name,
    loe.customer_address,
    loe.customer_postal_code,
    loe.customer_city,
    loe.customer_email,
    loe.customer_phone,
    loe.affiliate_name,
    loe.affiliate_type,
    loe.selection_name,
    loe.selection_id,
    COALESCE(lc.affiliate_commission, margins.total_affiliate_margin, 0::numeric) AS total_affiliate_margin,
    COALESCE(margins.items_count, 0::bigint) AS items_count
FROM linkme_orders_enriched loe
  LEFT JOIN linkme_commissions lc ON lc.order_id = loe.id
  LEFT JOIN (
    SELECT linkme_order_items_enriched.sales_order_id,
        sum(linkme_order_items_enriched.affiliate_margin) AS total_affiliate_margin,
        count(*) AS items_count
    FROM linkme_order_items_enriched
    GROUP BY linkme_order_items_enriched.sales_order_id
  ) margins ON margins.sales_order_id = loe.id;

-- Grants
GRANT SELECT ON public.linkme_orders_enriched TO authenticated;
GRANT SELECT ON public.linkme_orders_enriched TO anon;
GRANT SELECT ON public.linkme_order_items_enriched TO authenticated;
GRANT SELECT ON public.linkme_order_items_enriched TO anon;
GRANT SELECT ON public.linkme_orders_with_margins TO authenticated;
GRANT SELECT ON public.linkme_orders_with_margins TO anon;

-- ---------------------------------------------------------------------------
-- Step 7: Update RPCs — unit_price = selling_price_ht (NO multiplication)
-- ---------------------------------------------------------------------------

-- 7a. create_affiliate_order() — Back-office order creation
CREATE OR REPLACE FUNCTION create_affiliate_order(
  p_affiliate_id UUID,
  p_selection_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL,
  p_linkme_details JSONB DEFAULT NULL,
  p_responsable_contact_id UUID DEFAULT NULL,
  p_billing_contact_id UUID DEFAULT NULL,
  p_delivery_contact_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_selection_item RECORD;
  v_total_ht NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_item_total_ht NUMERIC;
  v_unit_price NUMERIC;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
  v_max_num INTEGER;
  v_year TEXT;
  v_current_user_id UUID;
  v_shipping_address_jsonb JSONB;
  v_expected_delivery_date DATE;
BEGIN
  v_current_user_id := auth.uid();

  IF NOT EXISTS (SELECT 1 FROM linkme_affiliates WHERE id = p_affiliate_id AND status = 'active') THEN
    RAISE EXCEPTION 'Affilie non trouve ou inactif: %', p_affiliate_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM linkme_selections WHERE id = p_selection_id AND affiliate_id = p_affiliate_id) THEN
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
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_responsable_contact_id AND is_active = TRUE) THEN
      RAISE EXCEPTION 'Contact responsable invalide ou inactif: %', p_responsable_contact_id;
    END IF;
  END IF;
  IF p_billing_contact_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_billing_contact_id AND is_active = TRUE) THEN
      RAISE EXCEPTION 'Contact facturation invalide ou inactif: %', p_billing_contact_id;
    END IF;
  END IF;
  IF p_delivery_contact_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_delivery_contact_id AND is_active = TRUE) THEN
      RAISE EXCEPTION 'Contact livraison invalide ou inactif: %', p_delivery_contact_id;
    END IF;
  END IF;

  IF p_linkme_details IS NOT NULL THEN
    IF p_linkme_details->>'delivery_address' IS NOT NULL THEN
      v_shipping_address_jsonb := jsonb_build_object(
        'line1', p_linkme_details->>'delivery_address',
        'postal_code', p_linkme_details->>'delivery_postal_code',
        'city', p_linkme_details->>'delivery_city',
        'country', COALESCE(p_linkme_details->>'delivery_country', 'FR')
      );
    END IF;
    IF p_linkme_details->>'desired_delivery_date' IS NOT NULL AND p_linkme_details->>'desired_delivery_date' != '' THEN
      v_expected_delivery_date := (p_linkme_details->>'desired_delivery_date')::DATE;
    END IF;
  END IF;

  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CASE WHEN LENGTH(order_number) >= 13 AND SUBSTRING(order_number FROM 10) ~ '^\d+$'
      THEN SUBSTRING(order_number FROM 10)::INTEGER ELSE 0 END
  ), 0) INTO v_max_num
  FROM sales_orders WHERE order_number LIKE 'SO-' || v_year || '-%';
  v_order_number := 'SO-' || v_year || '-' || LPAD((v_max_num + 1)::TEXT, 5, '0');

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
    'draft', 'pending', v_current_user_id, p_affiliate_id,
    true, p_selection_id, p_notes,
    0, 0, 0.2, 0, 0, 0,
    p_responsable_contact_id, p_billing_contact_id, p_delivery_contact_id,
    v_shipping_address_jsonb, v_expected_delivery_date
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT lsi.*, p.name as product_name, p.sku as product_sku
    INTO v_selection_item
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    WHERE lsi.id = (v_item->>'selection_item_id')::UUID AND lsi.selection_id = p_selection_id;

    IF v_selection_item IS NULL THEN
      RAISE EXCEPTION 'Item de selection non trouve ou n appartient pas a la selection: %', v_item->>'selection_item_id';
    END IF;

    -- FIX: selling_price_ht IS the client price (additive margin model)
    -- No multiplication needed: base * (1 + margin/100) is already computed by GENERATED column
    v_unit_price := v_selection_item.selling_price_ht;

    v_item_total_ht := v_unit_price * (v_item->>'quantity')::INTEGER;

    INSERT INTO sales_order_items (
      sales_order_id, product_id, quantity, unit_price_ht,
      tax_rate, linkme_selection_item_id, retrocession_rate
    ) VALUES (
      v_order_id, v_selection_item.product_id,
      (v_item->>'quantity')::INTEGER, v_unit_price,
      0.2, v_selection_item.id,
      v_selection_item.margin_rate / 100
    );

    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;

  v_total_ttc := v_total_ht * 1.2;
  UPDATE sales_orders SET total_ht = v_total_ht, total_ttc = v_total_ttc WHERE id = v_order_id;

  IF p_linkme_details IS NOT NULL THEN
    INSERT INTO sales_order_linkme_details (
      sales_order_id, requester_type, requester_name, requester_email, requester_phone,
      requester_position, is_new_restaurant, owner_type,
      billing_contact_source, billing_name, billing_email, billing_phone,
      delivery_contact_name, delivery_contact_email, delivery_contact_phone,
      delivery_address, delivery_postal_code, delivery_city,
      delivery_latitude, delivery_longitude,
      delivery_date, desired_delivery_date,
      is_mall_delivery, mall_email, semi_trailer_accessible,
      access_form_url, delivery_notes, delivery_terms_accepted
    ) VALUES (
      v_order_id,
      COALESCE(p_linkme_details->>'requester_type', 'responsable_enseigne'),
      COALESCE(p_linkme_details->>'requester_name', ''),
      COALESCE(p_linkme_details->>'requester_email', ''),
      p_linkme_details->>'requester_phone', p_linkme_details->>'requester_position',
      COALESCE((p_linkme_details->>'is_new_restaurant')::BOOLEAN, false),
      p_linkme_details->>'owner_type',
      p_linkme_details->>'billing_contact_source', p_linkme_details->>'billing_name',
      p_linkme_details->>'billing_email', p_linkme_details->>'billing_phone',
      p_linkme_details->>'delivery_contact_name', p_linkme_details->>'delivery_contact_email',
      p_linkme_details->>'delivery_contact_phone',
      p_linkme_details->>'delivery_address', p_linkme_details->>'delivery_postal_code',
      p_linkme_details->>'delivery_city',
      CASE WHEN p_linkme_details->>'delivery_latitude' IS NOT NULL THEN (p_linkme_details->>'delivery_latitude')::NUMERIC END,
      CASE WHEN p_linkme_details->>'delivery_longitude' IS NOT NULL THEN (p_linkme_details->>'delivery_longitude')::NUMERIC END,
      v_expected_delivery_date, v_expected_delivery_date,
      COALESCE((p_linkme_details->>'is_mall_delivery')::BOOLEAN, false),
      p_linkme_details->>'mall_email',
      COALESCE((p_linkme_details->>'semi_trailer_accessible')::BOOLEAN, true),
      p_linkme_details->>'access_form_url', p_linkme_details->>'delivery_notes',
      COALESCE((p_linkme_details->>'delivery_terms_accepted')::BOOLEAN, false)
    );
  END IF;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;


-- 7b. create_public_linkme_order() — Public/site-internet order creation
CREATE OR REPLACE FUNCTION create_public_linkme_order(
  p_affiliate_id UUID,
  p_selection_id UUID,
  p_cart JSONB,
  p_requester JSONB,
  p_organisation JSONB,
  p_owner JSONB,
  p_billing JSONB,
  p_delivery JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_total_ht NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_item JSONB;
  v_enseigne_id UUID;
  v_owner_type TEXT;
  v_ownership_type organisation_ownership_type;
  v_owner_contact_id UUID;
  v_billing_contact_id UUID;
  v_delivery_contact_id UUID;
  v_parent_org_id UUID;
  v_delivery_contact_name TEXT;
  v_delivery_contact_email TEXT;
  v_delivery_contact_phone TEXT;
  v_tax_rate NUMERIC := 0.20;
  v_customer_country TEXT;
  v_selection_item RECORD;
  v_unit_price NUMERIC;
  v_item_total NUMERIC;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selection invalide ou non trouvee');
  END IF;

  IF p_cart IS NULL OR jsonb_array_length(p_cart) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le panier ne peut pas etre vide');
  END IF;

  IF (p_requester->>'name') IS NULL OR (p_requester->>'email') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nom et email du demandeur requis');
  END IF;

  SELECT enseigne_id INTO v_enseigne_id FROM linkme_affiliates WHERE id = p_affiliate_id;

  v_owner_type := COALESCE(p_owner->>'type', p_organisation->>'ownership_type');

  IF v_owner_type = 'succursale' THEN v_ownership_type := 'succursale';
  ELSIF v_owner_type = 'franchise' THEN v_ownership_type := 'franchise';
  ELSIF v_owner_type = 'propre' THEN v_ownership_type := 'succursale';
  ELSE v_ownership_type := NULL;
  END IF;

  IF (p_organisation->>'existing_id') IS NOT NULL THEN
    v_customer_id := (p_organisation->>'existing_id')::UUID;
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = v_customer_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Organisation selectionnee non trouvee');
    END IF;
    IF v_ownership_type IS NOT NULL THEN
      UPDATE organisations SET ownership_type = v_ownership_type WHERE id = v_customer_id AND ownership_type IS NULL;
    END IF;
  ELSE
    INSERT INTO organisations (trade_name, legal_name, city, postal_code, address_line1, latitude, longitude, country, email, approval_status, enseigne_id, type, ownership_type)
    VALUES (
      p_organisation->>'trade_name',
      COALESCE(p_organisation->>'legal_name', p_organisation->>'trade_name'),
      p_organisation->>'city',
      p_organisation->>'postal_code',
      p_organisation->>'address',
      CASE WHEN (p_organisation->>'latitude') IS NOT NULL AND (p_organisation->>'latitude') != '' THEN (p_organisation->>'latitude')::NUMERIC ELSE NULL END,
      CASE WHEN (p_organisation->>'longitude') IS NOT NULL AND (p_organisation->>'longitude') != '' THEN (p_organisation->>'longitude')::NUMERIC ELSE NULL END,
      'FR',
      p_requester->>'email',
      'pending_validation',
      v_enseigne_id,
      'customer',
      v_ownership_type
    ) RETURNING id INTO v_customer_id;
  END IF;

  SELECT COALESCE(default_vat_rate, CASE WHEN country != 'FR' THEN 0.00 ELSE 0.20 END) INTO v_tax_rate FROM organisations WHERE id = v_customer_id;
  v_tax_rate := COALESCE(v_tax_rate, 0.20);

  IF (p_owner->>'contact_id') IS NOT NULL AND (p_owner->>'contact_id') != '' THEN
    v_owner_contact_id := (p_owner->>'contact_id')::UUID;
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = v_owner_contact_id AND organisation_id = v_customer_id AND is_active = TRUE) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Contact responsable selectionne non trouve ou inactif');
    END IF;
  ELSIF (p_owner->>'email') IS NOT NULL AND (p_owner->>'name') IS NOT NULL THEN
    INSERT INTO contacts (organisation_id, first_name, last_name, email, phone, mobile, is_primary_contact, is_commercial_contact, owner_type)
    VALUES (
      v_customer_id,
      SPLIT_PART(p_owner->>'name', ' ', 1),
      CASE WHEN ARRAY_LENGTH(STRING_TO_ARRAY(p_owner->>'name', ' '), 1) > 1
        THEN SUBSTRING(p_owner->>'name' FROM POSITION(' ' IN p_owner->>'name') + 1)
        ELSE SPLIT_PART(p_owner->>'name', ' ', 1) END,
      p_owner->>'email', p_owner->>'phone', p_owner->>'phone', TRUE, TRUE, 'organisation'
    )
    ON CONFLICT (organisation_id, email) WHERE is_active = TRUE
    DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
      phone = COALESCE(EXCLUDED.phone, contacts.phone), mobile = COALESCE(EXCLUDED.mobile, contacts.mobile),
      is_primary_contact = TRUE, updated_at = NOW()
    RETURNING id INTO v_owner_contact_id;
  END IF;

  IF (p_billing->>'use_parent')::BOOLEAN = TRUE THEN
    SELECT id INTO v_parent_org_id FROM organisations WHERE enseigne_id = v_enseigne_id AND is_enseigne_parent = TRUE LIMIT 1;
    IF v_parent_org_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Organisation mere non definie pour cette enseigne');
    END IF;
    SELECT id INTO v_billing_contact_id FROM contacts WHERE organisation_id = v_parent_org_id AND is_primary_contact = TRUE AND is_active = TRUE LIMIT 1;
  ELSIF (p_billing->>'contact_source') = 'custom' AND (p_billing->>'email') IS NOT NULL AND (p_billing->>'name') IS NOT NULL THEN
    INSERT INTO contacts (organisation_id, first_name, last_name, email, phone, is_billing_contact, is_commercial_contact, owner_type)
    VALUES (
      v_customer_id,
      SPLIT_PART(p_billing->>'name', ' ', 1),
      CASE WHEN ARRAY_LENGTH(STRING_TO_ARRAY(p_billing->>'name', ' '), 1) > 1
        THEN SUBSTRING(p_billing->>'name' FROM POSITION(' ' IN p_billing->>'name') + 1)
        ELSE SPLIT_PART(p_billing->>'name', ' ', 1) END,
      p_billing->>'email', p_billing->>'phone', TRUE, FALSE, 'organisation'
    )
    ON CONFLICT (organisation_id, email) WHERE is_active = TRUE
    DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
      phone = COALESCE(EXCLUDED.phone, contacts.phone), is_billing_contact = TRUE, updated_at = NOW()
    RETURNING id INTO v_billing_contact_id;
  ELSIF (p_billing->>'contact_source') = 'owner' OR (p_billing->>'contact_source') = 'responsable' THEN
    v_billing_contact_id := v_owner_contact_id;
  END IF;

  IF (p_delivery->>'use_responsable_contact')::BOOLEAN = TRUE THEN
    v_delivery_contact_id := v_owner_contact_id;
    SELECT CONCAT(first_name, ' ', last_name), email, COALESCE(phone, mobile)
    INTO v_delivery_contact_name, v_delivery_contact_email, v_delivery_contact_phone
    FROM contacts WHERE id = v_owner_contact_id;
  ELSE
    v_delivery_contact_id := NULL;
    v_delivery_contact_name := p_delivery->>'contact_name';
    v_delivery_contact_email := p_delivery->>'contact_email';
    v_delivery_contact_phone := p_delivery->>'contact_phone';
  END IF;

  v_order_number := 'LNK-' || UPPER(TO_CHAR(NOW(), 'YYMMDD')) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  INSERT INTO sales_orders (order_number, customer_id, customer_type, channel_id, status, currency, notes, expected_delivery_date, linkme_selection_id, pending_admin_validation, created_by, responsable_contact_id, billing_contact_id, delivery_contact_id, tax_rate)
  VALUES (
    v_order_number, v_customer_id, 'organization',
    '93c68db1-5a30-4168-89ec-6383152be405', 'draft', 'EUR',
    'Commande publique LinkMe - Selection: ' || p_selection_id::TEXT,
    CASE WHEN (p_delivery->>'delivery_date') IS NOT NULL AND (p_delivery->>'delivery_date') != '' THEN (p_delivery->>'delivery_date')::DATE ELSE NULL END,
    p_selection_id, TRUE, '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0',
    v_owner_contact_id, v_billing_contact_id, v_delivery_contact_id, v_tax_rate
  ) RETURNING id INTO v_order_id;

  -- ITEMS — FIX: selling_price_ht IS the client price, no multiplication
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart)
  LOOP
    IF (v_item->>'id') IS NOT NULL AND (v_item->>'id') != '' THEN
      SELECT lsi.selling_price_ht, lsi.margin_rate, lsi.id as lsi_id
      INTO v_selection_item
      FROM linkme_selection_items lsi
      WHERE lsi.id = (v_item->>'id')::UUID;
    ELSE
      SELECT lsi.selling_price_ht, lsi.margin_rate, lsi.id as lsi_id
      INTO v_selection_item
      FROM linkme_selection_items lsi
      WHERE lsi.product_id = (v_item->>'product_id')::UUID
        AND lsi.selection_id = p_selection_id
      LIMIT 1;
    END IF;

    IF v_selection_item IS NOT NULL THEN
      -- FIX: selling_price_ht IS the client price (additive margin model)
      v_unit_price := v_selection_item.selling_price_ht;

      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price_ht, tax_rate, linkme_selection_item_id, retrocession_rate)
      VALUES (
        v_order_id, (v_item->>'product_id')::UUID, (v_item->>'quantity')::INT,
        v_unit_price, v_tax_rate,
        v_selection_item.lsi_id,
        v_selection_item.margin_rate / 100
      );
    ELSE
      v_unit_price := (v_item->>'selling_price_ttc')::NUMERIC / (1 + v_tax_rate);

      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price_ht, tax_rate, linkme_selection_item_id)
      VALUES (
        v_order_id, (v_item->>'product_id')::UUID, (v_item->>'quantity')::INT,
        v_unit_price, v_tax_rate,
        NULL
      );
    END IF;

    v_item_total := v_unit_price * (v_item->>'quantity')::INT;
    v_total_ht := v_total_ht + v_item_total;
  END LOOP;

  v_total_ttc := ROUND(v_total_ht * (1 + v_tax_rate), 2);
  UPDATE sales_orders SET total_ht = v_total_ht, total_ttc = v_total_ttc WHERE id = v_order_id;

  INSERT INTO sales_order_linkme_details (
    sales_order_id, requester_type, requester_name, requester_email, requester_phone, requester_position,
    is_new_restaurant, owner_type, owner_contact_same_as_requester, owner_name, owner_email, owner_phone,
    billing_contact_source,
    delivery_contact_name, delivery_contact_email, delivery_contact_phone,
    delivery_address, delivery_postal_code, delivery_city, delivery_latitude, delivery_longitude,
    delivery_date, is_mall_delivery, mall_email, access_form_required, access_form_url,
    semi_trailer_accessible, delivery_notes, delivery_terms_accepted, desired_delivery_date, mall_form_required
  ) VALUES (
    v_order_id,
    p_requester->>'type', p_requester->>'name', p_requester->>'email', p_requester->>'phone', p_requester->>'position',
    COALESCE((p_organisation->>'is_new')::BOOLEAN, FALSE),
    CASE WHEN v_owner_type = 'propre' THEN 'succursale' ELSE v_owner_type END,
    COALESCE((p_owner->>'same_as_requester')::BOOLEAN, FALSE),
    p_owner->>'name', p_owner->>'email', p_owner->>'phone',
    CASE WHEN (p_billing->>'use_parent')::BOOLEAN = TRUE THEN 'parent_organisation' ELSE COALESCE(p_billing->>'contact_source', 'owner') END,
    v_delivery_contact_name, v_delivery_contact_email, v_delivery_contact_phone,
    p_delivery->>'address', p_delivery->>'postal_code', p_delivery->>'city',
    CASE WHEN (p_delivery->>'latitude') IS NOT NULL AND (p_delivery->>'latitude') != '' THEN (p_delivery->>'latitude')::NUMERIC ELSE NULL END,
    CASE WHEN (p_delivery->>'longitude') IS NOT NULL AND (p_delivery->>'longitude') != '' THEN (p_delivery->>'longitude')::NUMERIC ELSE NULL END,
    CASE WHEN (p_delivery->>'delivery_date') IS NOT NULL AND (p_delivery->>'delivery_date') != '' THEN (p_delivery->>'delivery_date')::DATE ELSE NULL END,
    COALESCE((p_delivery->>'is_mall_delivery')::BOOLEAN, FALSE),
    p_delivery->>'mall_email',
    COALESCE((p_delivery->>'access_form_required')::BOOLEAN, FALSE),
    p_delivery->>'access_form_url',
    COALESCE((p_delivery->>'semi_trailer_accessible')::BOOLEAN, TRUE),
    p_delivery->>'notes',
    TRUE,
    CASE WHEN (p_delivery->>'delivery_date') IS NOT NULL AND (p_delivery->>'delivery_date') != '' THEN (p_delivery->>'delivery_date')::DATE ELSE NULL END,
    COALESCE((p_delivery->>'access_form_required')::BOOLEAN, FALSE)
  );

  RETURN jsonb_build_object(
    'success', true, 'order_id', v_order_id, 'order_number', v_order_number,
    'customer_id', v_customer_id, 'total_ttc', v_total_ttc,
    'owner_contact_id', v_owner_contact_id, 'billing_contact_id', v_billing_contact_id,
    'delivery_contact_id', v_delivery_contact_id, 'parent_organisation_id', v_parent_org_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erreur create_public_linkme_order: % - %', SQLSTATE, SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;


-- ---------------------------------------------------------------------------
-- Step 8: Update trigger calculate_retrocession_amount()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_retrocession_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_price NUMERIC;
  v_selling_price NUMERIC;
BEGIN
  -- For catalog products (linked to a selection item):
  -- commission = (selling_price - base_price) * quantity — exact, no rounding issues
  IF NEW.linkme_selection_item_id IS NOT NULL THEN
    SELECT base_price_ht, selling_price_ht
    INTO v_base_price, v_selling_price
    FROM linkme_selection_items
    WHERE id = NEW.linkme_selection_item_id;

    IF v_selling_price IS NOT NULL AND v_base_price IS NOT NULL THEN
      NEW.retrocession_amount := ROUND(
        (v_selling_price - v_base_price) * NEW.quantity, 2
      );
    ELSE
      NEW.retrocession_amount := 0.00;
    END IF;

  -- For affiliate products: retrocession_rate is already decimal (0.15 = 15%)
  -- Do NOT divide by 100 again
  ELSIF NEW.retrocession_rate IS NOT NULL AND NEW.retrocession_rate > 0 THEN
    NEW.retrocession_amount := ROUND(
      (NEW.unit_price_ht * NEW.quantity) * NEW.retrocession_rate, 2
    );
  ELSE
    NEW.retrocession_amount := 0.00;
  END IF;

  RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------------
-- Step 9: Update trigger lock_prices_on_order_validation()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION lock_prices_on_order_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- VALIDATION: draft -> validated = lock prices (snapshot from selection)
  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    UPDATE sales_order_items soi
    SET
      base_price_ht_locked = lsi.base_price_ht,
      selling_price_ht_locked = lsi.selling_price_ht,
      price_locked_at = NOW(),
      -- unit_price = selling_price (no multiplication, it IS the client price)
      unit_price_ht = lsi.selling_price_ht,
      -- commission = (selling - base) * qty
      retrocession_amount = ROUND(
        (lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2
      )
    FROM linkme_selection_items lsi
    WHERE soi.sales_order_id = NEW.id
      AND soi.linkme_selection_item_id = lsi.id;

  -- DEVALIDATION: validated -> draft = unlock prices (clear snapshot)
  ELSIF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    UPDATE sales_order_items soi
    SET
      base_price_ht_locked = NULL,
      selling_price_ht_locked = NULL,
      price_locked_at = NULL
    FROM linkme_selection_items lsi
    WHERE soi.sales_order_id = NEW.id
      AND soi.linkme_selection_item_id = lsi.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Cleanup temp table
DROP TABLE IF EXISTS _old_prices;

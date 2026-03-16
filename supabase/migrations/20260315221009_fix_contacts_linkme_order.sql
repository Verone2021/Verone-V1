-- Fix create_public_linkme_order RPC:
-- 1. ownership_type fallback: read from p_organisation if p_owner->>'type' is NULL
-- 2. delivery_contact_id: set to v_owner_contact_id when use_responsable_contact = true

CREATE OR REPLACE FUNCTION public.create_public_linkme_order(
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
  v_tax_rate NUMERIC := 0.20; -- Default FR 20%
  v_customer_country TEXT;
BEGIN
  -- =========================================
  -- 1. VALIDATIONS
  -- =========================================

  -- Verify selection exists and belongs to affiliate
  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Selection invalide ou non trouvee'
    );
  END IF;

  -- Verify cart is not empty
  IF p_cart IS NULL OR jsonb_array_length(p_cart) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Le panier ne peut pas etre vide'
    );
  END IF;

  -- Verify required requester fields
  IF (p_requester->>'name') IS NULL OR (p_requester->>'email') IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nom et email du demandeur requis'
    );
  END IF;

  -- Get enseigne_id from affiliate
  SELECT enseigne_id INTO v_enseigne_id
  FROM linkme_affiliates
  WHERE id = p_affiliate_id;

  -- =========================================
  -- 2. MAP owner_type -> ownership_type
  --    Fallback: p_organisation->>'ownership_type'
  -- =========================================
  v_owner_type := COALESCE(p_owner->>'type', p_organisation->>'ownership_type');

  IF v_owner_type = 'succursale' THEN
    v_ownership_type := 'succursale';
  ELSIF v_owner_type = 'franchise' THEN
    v_ownership_type := 'franchise';
  ELSIF v_owner_type = 'propre' THEN
    v_ownership_type := 'succursale';
  ELSE
    v_ownership_type := NULL;
  END IF;

  -- =========================================
  -- 3. CUSTOMER ORGANISATION
  -- =========================================

  IF (p_organisation->>'existing_id') IS NOT NULL THEN
    v_customer_id := (p_organisation->>'existing_id')::UUID;

    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = v_customer_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Organisation selectionnee non trouvee'
      );
    END IF;

    IF v_ownership_type IS NOT NULL THEN
      UPDATE organisations
      SET ownership_type = v_ownership_type
      WHERE id = v_customer_id
        AND ownership_type IS NULL;
    END IF;
  ELSE
    INSERT INTO organisations (
      trade_name,
      legal_name,
      city,
      postal_code,
      address_line1,
      latitude,
      longitude,
      country,
      email,
      approval_status,
      enseigne_id,
      type,
      ownership_type
    ) VALUES (
      p_organisation->>'trade_name',
      COALESCE(p_organisation->>'legal_name', p_organisation->>'trade_name'),
      p_organisation->>'city',
      p_organisation->>'postal_code',
      p_organisation->>'address',
      CASE
        WHEN (p_organisation->>'latitude') IS NOT NULL AND (p_organisation->>'latitude') != ''
        THEN (p_organisation->>'latitude')::NUMERIC
        ELSE NULL
      END,
      CASE
        WHEN (p_organisation->>'longitude') IS NOT NULL AND (p_organisation->>'longitude') != ''
        THEN (p_organisation->>'longitude')::NUMERIC
        ELSE NULL
      END,
      'FR',
      p_requester->>'email',
      'pending_validation',
      v_enseigne_id,
      'customer',
      v_ownership_type
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- =========================================
  -- 3b. DETERMINE TAX RATE from customer country
  -- =========================================

  SELECT COALESCE(default_vat_rate, CASE WHEN country != 'FR' THEN 0.00 ELSE 0.20 END)
  INTO v_tax_rate
  FROM organisations
  WHERE id = v_customer_id;

  -- Fallback if NULL
  v_tax_rate := COALESCE(v_tax_rate, 0.20);

  -- =========================================
  -- 4. OWNER CONTACT (responsable)
  -- =========================================

  IF (p_owner->>'contact_id') IS NOT NULL AND (p_owner->>'contact_id') != '' THEN
    v_owner_contact_id := (p_owner->>'contact_id')::UUID;

    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = v_owner_contact_id
        AND organisation_id = v_customer_id
        AND is_active = TRUE
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Contact responsable selectionne non trouve ou inactif'
      );
    END IF;

  ELSIF (p_owner->>'email') IS NOT NULL AND (p_owner->>'name') IS NOT NULL THEN
    INSERT INTO contacts (
      organisation_id,
      first_name,
      last_name,
      email,
      phone,
      mobile,
      is_primary_contact,
      is_commercial_contact,
      owner_type
    ) VALUES (
      v_customer_id,
      SPLIT_PART(p_owner->>'name', ' ', 1),
      CASE
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(p_owner->>'name', ' '), 1) > 1
        THEN SUBSTRING(p_owner->>'name' FROM POSITION(' ' IN p_owner->>'name') + 1)
        ELSE SPLIT_PART(p_owner->>'name', ' ', 1)
      END,
      p_owner->>'email',
      p_owner->>'phone',
      p_owner->>'phone',
      TRUE,
      TRUE,
      'organisation'
    )
    ON CONFLICT (organisation_id, email) WHERE is_active = TRUE
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = COALESCE(EXCLUDED.phone, contacts.phone),
      mobile = COALESCE(EXCLUDED.mobile, contacts.mobile),
      is_primary_contact = TRUE,
      updated_at = NOW()
    RETURNING id INTO v_owner_contact_id;
  END IF;

  -- =========================================
  -- 5. BILLING
  -- =========================================

  IF (p_billing->>'use_parent')::BOOLEAN = TRUE THEN
    SELECT id INTO v_parent_org_id
    FROM organisations
    WHERE enseigne_id = v_enseigne_id
      AND is_enseigne_parent = TRUE
    LIMIT 1;

    IF v_parent_org_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Organisation mere non definie pour cette enseigne'
      );
    END IF;

    SELECT id INTO v_billing_contact_id
    FROM contacts
    WHERE organisation_id = v_parent_org_id
      AND is_primary_contact = TRUE
      AND is_active = TRUE
    LIMIT 1;

  ELSIF (p_billing->>'contact_source') = 'custom'
       AND (p_billing->>'email') IS NOT NULL
       AND (p_billing->>'name') IS NOT NULL THEN

    INSERT INTO contacts (
      organisation_id,
      first_name,
      last_name,
      email,
      phone,
      is_billing_contact,
      is_commercial_contact,
      owner_type
    ) VALUES (
      v_customer_id,
      SPLIT_PART(p_billing->>'name', ' ', 1),
      CASE
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(p_billing->>'name', ' '), 1) > 1
        THEN SUBSTRING(p_billing->>'name' FROM POSITION(' ' IN p_billing->>'name') + 1)
        ELSE SPLIT_PART(p_billing->>'name', ' ', 1)
      END,
      p_billing->>'email',
      p_billing->>'phone',
      TRUE,
      FALSE,
      'organisation'
    )
    ON CONFLICT (organisation_id, email) WHERE is_active = TRUE
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = COALESCE(EXCLUDED.phone, contacts.phone),
      is_billing_contact = TRUE,
      updated_at = NOW()
    RETURNING id INTO v_billing_contact_id;

  ELSIF (p_billing->>'contact_source') = 'owner' OR (p_billing->>'contact_source') = 'responsable' THEN
    v_billing_contact_id := v_owner_contact_id;
  END IF;

  -- =========================================
  -- 6. DELIVERY CONTACT
  -- =========================================

  IF (p_delivery->>'use_responsable_contact')::BOOLEAN = TRUE THEN
    -- Reuse owner contact ID for delivery
    v_delivery_contact_id := v_owner_contact_id;

    SELECT
      CONCAT(first_name, ' ', last_name),
      email,
      COALESCE(phone, mobile)
    INTO
      v_delivery_contact_name,
      v_delivery_contact_email,
      v_delivery_contact_phone
    FROM contacts
    WHERE id = v_owner_contact_id;
  ELSE
    -- Custom delivery contact = text only, no contact created, no FK
    v_delivery_contact_id := NULL;
    v_delivery_contact_name := p_delivery->>'contact_name';
    v_delivery_contact_email := p_delivery->>'contact_email';
    v_delivery_contact_phone := p_delivery->>'contact_phone';
  END IF;

  -- =========================================
  -- 7. ORDER NUMBER
  -- =========================================

  v_order_number := 'LNK-' ||
                    UPPER(TO_CHAR(NOW(), 'YYMMDD')) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- =========================================
  -- 8. CALCULATE TOTALS (using correct tax rate)
  -- =========================================

  SELECT
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC / (1 + v_tax_rate) * (item->>'quantity')::INT), 0),
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC * (item->>'quantity')::INT), 0)
  INTO v_total_ht, v_total_ttc
  FROM jsonb_array_elements(p_cart) AS item;

  -- =========================================
  -- 9. CREATE SALES_ORDER (with delivery_contact_id)
  -- =========================================

  INSERT INTO sales_orders (
    order_number,
    customer_id,
    customer_type,
    channel_id,
    status,
    currency,
    notes,
    expected_delivery_date,
    linkme_selection_id,
    pending_admin_validation,
    created_by,
    responsable_contact_id,
    billing_contact_id,
    delivery_contact_id,
    tax_rate
  ) VALUES (
    v_order_number,
    v_customer_id,
    'organization',
    '93c68db1-5a30-4168-89ec-6383152be405', -- LINKME_CHANNEL_ID
    'draft',
    'EUR',
    'Commande publique LinkMe - Selection: ' || p_selection_id::TEXT,
    CASE
      WHEN (p_delivery->>'delivery_date') IS NOT NULL AND (p_delivery->>'delivery_date') != ''
      THEN (p_delivery->>'delivery_date')::DATE
      ELSE NULL
    END,
    p_selection_id,
    TRUE,
    '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0', -- admin@verone.com
    v_owner_contact_id,
    v_billing_contact_id,
    v_delivery_contact_id,
    v_tax_rate
  )
  RETURNING id INTO v_order_id;

  -- Update totals
  UPDATE sales_orders
  SET total_ht = v_total_ht, total_ttc = v_total_ttc
  WHERE id = v_order_id;

  -- =========================================
  -- 10. CREATE SALES_ORDER_ITEMS (with correct tax_rate)
  -- =========================================

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart)
  LOOP
    INSERT INTO sales_order_items (
      sales_order_id,
      product_id,
      quantity,
      unit_price_ht,
      tax_rate,
      linkme_selection_item_id
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INT,
      (v_item->>'selling_price_ttc')::NUMERIC / (1 + v_tax_rate),
      v_tax_rate,
      CASE
        WHEN (v_item->>'id') IS NOT NULL AND (v_item->>'id') != ''
        THEN (v_item->>'id')::UUID
        ELSE NULL
      END
    );
  END LOOP;

  -- =========================================
  -- 11. CREATE SALES_ORDER_LINKME_DETAILS
  -- =========================================

  INSERT INTO sales_order_linkme_details (
    sales_order_id,
    -- Requester
    requester_type,
    requester_name,
    requester_email,
    requester_phone,
    requester_position,
    -- Owner (responsable)
    is_new_restaurant,
    owner_type,
    owner_contact_same_as_requester,
    owner_name,
    owner_email,
    owner_phone,
    -- Billing (text fields only, contact_id stored in sales_orders)
    billing_contact_source,
    -- Delivery
    delivery_contact_name,
    delivery_contact_email,
    delivery_contact_phone,
    delivery_address,
    delivery_postal_code,
    delivery_city,
    delivery_latitude,
    delivery_longitude,
    delivery_date,
    is_mall_delivery,
    mall_email,
    access_form_required,
    access_form_url,
    semi_trailer_accessible,
    delivery_notes,
    -- Legacy
    delivery_terms_accepted,
    desired_delivery_date,
    mall_form_required
  ) VALUES (
    v_order_id,
    -- Requester
    p_requester->>'type',
    p_requester->>'name',
    p_requester->>'email',
    p_requester->>'phone',
    p_requester->>'position',
    -- Owner
    COALESCE((p_organisation->>'is_new')::BOOLEAN, FALSE),
    CASE
      WHEN v_owner_type = 'propre' THEN 'succursale'
      ELSE v_owner_type
    END,
    COALESCE((p_owner->>'same_as_requester')::BOOLEAN, FALSE),
    p_owner->>'name',
    p_owner->>'email',
    p_owner->>'phone',
    -- Billing
    CASE
      WHEN (p_billing->>'use_parent')::BOOLEAN = TRUE THEN 'parent_organisation'
      ELSE COALESCE(p_billing->>'contact_source', 'owner')
    END,
    -- Delivery
    v_delivery_contact_name,
    v_delivery_contact_email,
    v_delivery_contact_phone,
    p_delivery->>'address',
    p_delivery->>'postal_code',
    p_delivery->>'city',
    CASE
      WHEN (p_delivery->>'latitude') IS NOT NULL AND (p_delivery->>'latitude') != ''
      THEN (p_delivery->>'latitude')::NUMERIC
      ELSE NULL
    END,
    CASE
      WHEN (p_delivery->>'longitude') IS NOT NULL AND (p_delivery->>'longitude') != ''
      THEN (p_delivery->>'longitude')::NUMERIC
      ELSE NULL
    END,
    CASE
      WHEN (p_delivery->>'delivery_date') IS NOT NULL AND (p_delivery->>'delivery_date') != ''
      THEN (p_delivery->>'delivery_date')::DATE
      ELSE NULL
    END,
    COALESCE((p_delivery->>'is_mall_delivery')::BOOLEAN, FALSE),
    p_delivery->>'mall_email',
    COALESCE((p_delivery->>'access_form_required')::BOOLEAN, FALSE),
    p_delivery->>'access_form_url',
    COALESCE((p_delivery->>'semi_trailer_accessible')::BOOLEAN, TRUE),
    p_delivery->>'notes',
    -- Legacy
    TRUE,
    CASE
      WHEN (p_delivery->>'delivery_date') IS NOT NULL AND (p_delivery->>'delivery_date') != ''
      THEN (p_delivery->>'delivery_date')::DATE
      ELSE NULL
    END,
    COALESCE((p_delivery->>'access_form_required')::BOOLEAN, FALSE)
  );

  -- =========================================
  -- 12. SUCCESS
  -- =========================================

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'total_ttc', v_total_ttc,
    'owner_contact_id', v_owner_contact_id,
    'billing_contact_id', v_billing_contact_id,
    'delivery_contact_id', v_delivery_contact_id,
    'parent_organisation_id', v_parent_org_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erreur create_public_linkme_order: % - %', SQLSTATE, SQLERRM;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_public_linkme_order(uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_linkme_order(uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) TO anon;

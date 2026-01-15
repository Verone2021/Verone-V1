-- ============================================================================
-- Migration: Update create_public_linkme_order RPC for delivery step
-- Date: 2026-01-15
-- Task: LM-ORD-009
-- Description: Ajouter p_delivery + support contact_id + org mère
-- ============================================================================

CREATE OR REPLACE FUNCTION create_public_linkme_order(
  p_affiliate_id UUID,
  p_selection_id UUID,
  p_cart JSONB,           -- [{product_id, quantity, selling_price_ttc, id}]
  p_requester JSONB,      -- {type, name, email, phone, position, notes}
  p_organisation JSONB,   -- {existing_id} OU {is_new, trade_name, city, latitude, longitude, ownership_type, ...}
  p_owner JSONB,          -- {type, contact_id, name, email, phone} - contact_id si existant
  p_billing JSONB,        -- {use_parent, contact_source, name, email, phone, ...}
  p_delivery JSONB        -- NOUVEAU: {use_responsable_contact, contact_name, address, delivery_date, ...}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
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
  v_parent_org_id UUID;
  v_delivery_contact_name TEXT;
  v_delivery_contact_email TEXT;
  v_delivery_contact_phone TEXT;
BEGIN
  -- =========================================
  -- 1. VALIDATIONS
  -- =========================================

  -- Vérifier que la sélection existe et appartient à l'affilié
  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sélection invalide ou non trouvée'
    );
  END IF;

  -- Vérifier que le panier n'est pas vide
  IF p_cart IS NULL OR jsonb_array_length(p_cart) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Le panier ne peut pas être vide'
    );
  END IF;

  -- Vérifier les champs requis du demandeur
  IF (p_requester->>'name') IS NULL OR (p_requester->>'email') IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nom et email du demandeur requis'
    );
  END IF;

  -- Récupérer l'enseigne_id de l'affilié
  SELECT enseigne_id INTO v_enseigne_id
  FROM linkme_affiliates
  WHERE id = p_affiliate_id;

  -- =========================================
  -- 2. MAPPER owner_type -> ownership_type
  -- =========================================
  v_owner_type := p_owner->>'type';

  IF v_owner_type = 'succursale' THEN
    v_ownership_type := 'succursale';
  ELSIF v_owner_type = 'franchise' THEN
    v_ownership_type := 'franchise';
  ELSIF v_owner_type = 'propre' THEN
    -- Legacy mapping
    v_ownership_type := 'succursale';
  ELSE
    v_ownership_type := NULL;
  END IF;

  -- =========================================
  -- 3. ORGANISATION CLIENTE
  -- =========================================

  IF (p_organisation->>'existing_id') IS NOT NULL THEN
    -- Organisation existante
    v_customer_id := (p_organisation->>'existing_id')::UUID;

    -- Vérifier que l'organisation existe
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = v_customer_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Organisation sélectionnée non trouvée'
      );
    END IF;

    -- Mettre à jour ownership_type si fourni et pas déjà défini
    IF v_ownership_type IS NOT NULL THEN
      UPDATE organisations
      SET ownership_type = v_ownership_type
      WHERE id = v_customer_id
        AND ownership_type IS NULL;
    END IF;
  ELSE
    -- Créer nouvelle organisation (en attente de validation)
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
  -- 4. CONTACT RESPONSABLE (owner)
  -- =========================================

  -- Si contact_id fourni, utiliser le contact existant
  IF (p_owner->>'contact_id') IS NOT NULL AND (p_owner->>'contact_id') != '' THEN
    v_owner_contact_id := (p_owner->>'contact_id')::UUID;

    -- Vérifier que le contact existe et appartient à l'organisation
    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = v_owner_contact_id
        AND organisation_id = v_customer_id
        AND is_active = TRUE
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Contact responsable sélectionné non trouvé ou inactif'
      );
    END IF;

  -- Sinon, créer nouveau contact
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
  -- 5. FACTURATION
  -- =========================================

  -- Option 1: Utiliser organisation mère de l'enseigne
  IF (p_billing->>'use_parent')::BOOLEAN = TRUE THEN
    SELECT id INTO v_parent_org_id
    FROM organisations
    WHERE enseigne_id = v_enseigne_id
      AND is_enseigne_parent = TRUE
    LIMIT 1;

    -- Si pas d'org mère, erreur
    IF v_parent_org_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Organisation mère non définie pour cette enseigne'
      );
    END IF;

    -- Contact facturation = contact principal de l'org mère (optionnel)
    SELECT id INTO v_billing_contact_id
    FROM contacts
    WHERE organisation_id = v_parent_org_id
      AND is_primary_contact = TRUE
      AND is_active = TRUE
    LIMIT 1;

  -- Option 2: Contact facturation custom
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

  -- Option 3: Utiliser le même contact que le responsable
  ELSIF (p_billing->>'contact_source') = 'owner' OR (p_billing->>'contact_source') = 'responsable' THEN
    v_billing_contact_id := v_owner_contact_id;
  END IF;

  -- =========================================
  -- 6. CONTACT LIVRAISON
  -- =========================================

  -- Si utilise le contact responsable
  IF (p_delivery->>'use_responsable_contact')::BOOLEAN = TRUE THEN
    -- Récupérer les données du contact responsable
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

  -- Sinon, utiliser les données fournies
  ELSE
    v_delivery_contact_name := p_delivery->>'contact_name';
    v_delivery_contact_email := p_delivery->>'contact_email';
    v_delivery_contact_phone := p_delivery->>'contact_phone';
  END IF;

  -- =========================================
  -- 7. NUMÉRO DE COMMANDE
  -- =========================================

  v_order_number := 'LNK-' ||
                    UPPER(TO_CHAR(NOW(), 'YYMMDD')) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- =========================================
  -- 8. CALCUL DES TOTAUX
  -- =========================================

  SELECT
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC / 1.2 * (item->>'quantity')::INT), 0),
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC * (item->>'quantity')::INT), 0)
  INTO v_total_ht, v_total_ttc
  FROM jsonb_array_elements(p_cart) AS item;

  -- =========================================
  -- 9. CRÉER SALES_ORDER
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
    created_by
  ) VALUES (
    v_order_number,
    v_customer_id,
    'organization',
    '93c68db1-5a30-4168-89ec-6383152be405', -- LINKME_CHANNEL_ID
    'draft',
    'EUR',
    'Commande publique LinkMe - Sélection: ' || p_selection_id::TEXT,
    CASE
      WHEN (p_delivery->>'delivery_date') IS NOT NULL AND (p_delivery->>'delivery_date') != ''
      THEN (p_delivery->>'delivery_date')::DATE
      ELSE NULL
    END,
    p_selection_id,
    TRUE,
    '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0' -- admin@verone.com
  )
  RETURNING id INTO v_order_id;

  -- Mettre à jour les totaux
  UPDATE sales_orders
  SET total_ht = v_total_ht, total_ttc = v_total_ttc
  WHERE id = v_order_id;

  -- =========================================
  -- 10. CRÉER SALES_ORDER_ITEMS
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
      (v_item->>'selling_price_ttc')::NUMERIC / 1.2,
      0.20,
      CASE
        WHEN (v_item->>'id') IS NOT NULL AND (v_item->>'id') != ''
        THEN (v_item->>'id')::UUID
        ELSE NULL
      END
    );
  END LOOP;

  -- =========================================
  -- 11. CRÉER SALES_ORDER_LINKME_DETAILS
  -- =========================================

  INSERT INTO sales_order_linkme_details (
    sales_order_id,
    -- Demandeur
    requester_type,
    requester_name,
    requester_email,
    requester_phone,
    requester_position,
    -- Responsable (owner)
    is_new_restaurant,
    owner_type,
    owner_contact_same_as_requester,
    owner_name,
    owner_email,
    owner_phone,
    owner_contact_id,
    -- Facturation
    billing_contact_source,
    billing_contact_id,
    -- Livraison (NOUVEAU)
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
    -- Demandeur
    p_requester->>'type',
    p_requester->>'name',
    p_requester->>'email',
    p_requester->>'phone',
    p_requester->>'position',
    -- Responsable
    COALESCE((p_organisation->>'is_new')::BOOLEAN, FALSE),
    CASE
      WHEN v_owner_type = 'propre' THEN 'succursale'
      ELSE v_owner_type
    END,
    COALESCE((p_owner->>'same_as_requester')::BOOLEAN, FALSE),
    p_owner->>'name',
    p_owner->>'email',
    p_owner->>'phone',
    v_owner_contact_id,
    -- Facturation
    CASE
      WHEN (p_billing->>'use_parent')::BOOLEAN = TRUE THEN 'parent_organisation'
      ELSE COALESCE(p_billing->>'contact_source', 'owner')
    END,
    v_billing_contact_id,
    -- Livraison
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
  -- 12. SUCCÈS
  -- =========================================

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'total_ttc', v_total_ttc,
    'owner_contact_id', v_owner_contact_id,
    'billing_contact_id', v_billing_contact_id,
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

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION create_public_linkme_order(UUID, UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB) IS
'Crée une commande LinkMe depuis une page publique (LM-ORD-009 - 6 étapes).

WORKFLOW 6 ÉTAPES (2026-01-15):
1. Demandeur : nom, email, téléphone, position, notes
2. Restaurant : sélection existant OU nouveau (ownership_type)
3. Responsable : sélection contact existant (contact_id) OU nouveau
4. Facturation : organisation mère (use_parent) OU custom
5. Livraison : contact, adresse, date, centre commercial, formulaire accès
6. Validation : récapitulatif + panier

NOUVEAUTÉS:
- p_delivery (8ème paramètre) : toutes les infos livraison
- p_owner.contact_id : support sélection contact existant
- p_billing.use_parent : utiliser organisation mère de l''enseigne
- Retourne parent_organisation_id

PARAMÈTRES:
- p_affiliate_id: UUID de l''affilié
- p_selection_id: UUID de la sélection LinkMe
- p_cart: JSONB array des produits
- p_requester: JSONB {type, name, email, phone, position, notes}
- p_organisation: JSONB {existing_id} OU {is_new, trade_name, city, ownership_type, ...}
- p_owner: JSONB {type, contact_id, name, email, phone}
- p_billing: JSONB {use_parent, contact_source, name, email, phone, ...}
- p_delivery: JSONB {use_responsable_contact, contact_name, address, delivery_date, is_mall_delivery, ...}

RETOURNE:
- Succès: {success: true, order_id, order_number, customer_id, total_ttc, owner_contact_id, billing_contact_id, parent_organisation_id}
- Erreur: {success: false, error, sqlstate}';

-- ============================================================================
-- Migration: Simplify ownership_type mapping in RPC
-- Date: 2026-01-11
-- Description: Frontend now sends 'succursale' directly, no need to map 'propre'
-- ============================================================================

-- ============================================
-- UPDATE create_public_linkme_order RPC
-- ============================================

CREATE OR REPLACE FUNCTION create_public_linkme_order(
  p_affiliate_id UUID,
  p_selection_id UUID,
  p_cart JSONB,           -- [{product_id, quantity, selling_price_ttc, id}]
  p_requester JSONB,      -- {type, name, email, phone, position}
  p_organisation JSONB,   -- {existing_id} OU {is_new, trade_name, city, ...}
  p_owner JSONB,          -- Optionnel: étape 2
  p_billing JSONB         -- {contact_source, delivery_date, mall_form_required}
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
  -- Frontend envoie maintenant 'succursale' ou 'franchise' directement
  -- Legacy: 'propre' -> 'succursale' pour compatibilité
  v_owner_type := p_owner->>'type';

  IF v_owner_type = 'succursale' THEN
    v_ownership_type := 'succursale';
  ELSIF v_owner_type = 'franchise' THEN
    v_ownership_type := 'franchise';
  ELSIF v_owner_type = 'propre' THEN
    -- Legacy mapping pour anciennes versions du frontend
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
  -- 4. NUMÉRO DE COMMANDE
  -- =========================================

  v_order_number := 'LNK-' ||
                    UPPER(TO_CHAR(NOW(), 'YYMMDD')) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- =========================================
  -- 5. CALCUL DES TOTAUX
  -- =========================================

  SELECT
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC / 1.2 * (item->>'quantity')::INT), 0),
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC * (item->>'quantity')::INT), 0)
  INTO v_total_ht, v_total_ttc
  FROM jsonb_array_elements(p_cart) AS item;

  -- =========================================
  -- 6. CRÉER SALES_ORDER
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
      WHEN (p_billing->>'delivery_date') IS NOT NULL AND (p_billing->>'delivery_date') != ''
      THEN (p_billing->>'delivery_date')::DATE
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
  -- 7. CRÉER SALES_ORDER_ITEMS
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
  -- 8. CRÉER SALES_ORDER_LINKME_DETAILS
  -- =========================================

  INSERT INTO sales_order_linkme_details (
    sales_order_id,
    requester_type,
    requester_name,
    requester_email,
    requester_phone,
    requester_position,
    is_new_restaurant,
    owner_type,
    owner_contact_same_as_requester,
    owner_name,
    owner_email,
    owner_phone,
    billing_contact_source,
    delivery_terms_accepted,
    desired_delivery_date,
    mall_form_required
  ) VALUES (
    v_order_id,
    p_requester->>'type',
    p_requester->>'name',
    p_requester->>'email',
    p_requester->>'phone',
    p_requester->>'position',
    COALESCE((p_organisation->>'is_new')::BOOLEAN, FALSE),
    -- Stocker la valeur normalisée ('succursale' ou 'franchise')
    CASE
      WHEN v_owner_type = 'propre' THEN 'succursale'
      ELSE v_owner_type
    END,
    COALESCE((p_owner->>'same_as_requester')::BOOLEAN, TRUE),
    p_owner->>'name',
    p_owner->>'email',
    p_owner->>'phone',
    COALESCE(p_billing->>'contact_source', 'step1'),
    TRUE,
    CASE
      WHEN (p_billing->>'delivery_date') IS NOT NULL AND (p_billing->>'delivery_date') != ''
      THEN (p_billing->>'delivery_date')::DATE
      ELSE NULL
    END,
    COALESCE((p_billing->>'mall_form_required')::BOOLEAN, FALSE)
  );

  -- =========================================
  -- 9. SUCCÈS
  -- =========================================

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'total_ttc', v_total_ttc
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

COMMENT ON FUNCTION create_public_linkme_order IS
'Crée une commande LinkMe depuis une page publique.

MAPPING ownership_type (2026-01-11):
- Frontend envoie maintenant ''succursale'' ou ''franchise'' directement
- Legacy ''propre'' est mappé vers ''succursale'' pour compatibilité

PARAMÈTRES:
- p_affiliate_id: UUID de l''affilié
- p_selection_id: UUID de la sélection LinkMe
- p_cart: JSONB array des produits
- p_requester: JSONB {type, name, email, phone, position}
- p_organisation: JSONB {existing_id} OU {is_new, trade_name, city, ...}
- p_owner: JSONB {type, same_as_requester, name, email, phone}
- p_billing: JSONB {contact_source, delivery_date, mall_form_required}

RETOURNE:
- Succès: {success: true, order_id, order_number, customer_id, total_ttc}
- Erreur: {success: false, error, sqlstate}';

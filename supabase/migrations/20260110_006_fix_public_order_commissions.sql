-- ============================================================================
-- Migration: Correction du calcul des commissions dans le RPC public LinkMe
-- Date: 2026-01-10
-- Description: Ajoute le calcul correct des commissions (retrocession_rate et
--              retrocession_amount) dans la création des sales_order_items
--
-- FORMULE CORRECTE (TAUX DE MARQUE):
--   retrocession_amount = selling_price_ht × margin_rate / 100 × quantity
--   (Le margin_rate est un taux de marque sur le prix de vente, PAS sur le coût)
--
-- Exemple: Plateau bois 20x30
--   - selling_price_ht = 23.75€
--   - margin_rate = 15%
--   - retrocession_amount = 23.75 × 0.15 = 3.56€ (pas 3.03€!)
-- ============================================================================

-- ============================================
-- FONCTION CORRIGÉE: create_public_linkme_order
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
  -- Variables pour le calcul des commissions (AJOUTÉES)
  v_margin_rate NUMERIC;
  v_selling_price_ht NUMERIC;
  v_quantity INT;
  v_retrocession_amount NUMERIC;
  v_selection_item_id UUID;
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
  -- 2. ORGANISATION CLIENTE
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
      type
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
      'customer'
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- =========================================
  -- 3. NUMÉRO DE COMMANDE
  -- =========================================

  v_order_number := 'LNK-' ||
                    UPPER(TO_CHAR(NOW(), 'YYMMDD')) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- =========================================
  -- 4. CALCUL DES TOTAUX
  -- =========================================

  SELECT
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC / 1.2 * (item->>'quantity')::INT), 0),
    COALESCE(SUM((item->>'selling_price_ttc')::NUMERIC * (item->>'quantity')::INT), 0)
  INTO v_total_ht, v_total_ttc
  FROM jsonb_array_elements(p_cart) AS item;

  -- =========================================
  -- 5. CRÉER SALES_ORDER (sans totaux, ils seront mis à jour après)
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
    '93c68db1-5a30-4168-89ec-6383152be405', -- LINKME_CHANNEL_ID (from sales_channels)
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
    '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0' -- admin@verone.com - System user pour commandes publiques
  )
  RETURNING id INTO v_order_id;

  -- Mettre à jour les totaux après création
  UPDATE sales_orders
  SET total_ht = v_total_ht, total_ttc = v_total_ttc
  WHERE id = v_order_id;

  -- =========================================
  -- 6. CRÉER SALES_ORDER_ITEMS (AVEC COMMISSIONS)
  -- =========================================

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart)
  LOOP
    -- Récupérer l'ID de l'item de sélection
    v_selection_item_id := CASE
      WHEN (v_item->>'id') IS NOT NULL AND (v_item->>'id') != ''
      THEN (v_item->>'id')::UUID
      ELSE NULL
    END;

    -- Récupérer la quantité
    v_quantity := (v_item->>'quantity')::INT;

    -- Récupérer les données de commission depuis linkme_selection_items (SOURCE DE VÉRITÉ)
    IF v_selection_item_id IS NOT NULL THEN
      SELECT
        lsi.margin_rate,
        lsi.selling_price_ht
      INTO v_margin_rate, v_selling_price_ht
      FROM linkme_selection_items lsi
      WHERE lsi.id = v_selection_item_id;

      -- Calculer la commission avec la BONNE formule (taux de marque)
      -- retrocession_amount = selling_price_ht × margin_rate / 100 × quantity
      v_retrocession_amount := COALESCE(v_selling_price_ht * v_margin_rate / 100 * v_quantity, 0);
    ELSE
      -- Fallback si pas de linkme_selection_item_id
      v_margin_rate := 0;
      v_selling_price_ht := (v_item->>'selling_price_ttc')::NUMERIC / 1.2;
      v_retrocession_amount := 0;
    END IF;

    INSERT INTO sales_order_items (
      sales_order_id,
      product_id,
      quantity,
      unit_price_ht,
      tax_rate,
      linkme_selection_item_id,
      retrocession_rate,      -- ✅ AJOUTÉ: Taux de marque (%)
      retrocession_amount     -- ✅ AJOUTÉ: Commission calculée (€)
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_quantity,
      v_selling_price_ht,     -- Utiliser selling_price_ht depuis la sélection
      0.20,
      v_selection_item_id,
      v_margin_rate,          -- Taux de marque depuis linkme_selection_items
      v_retrocession_amount   -- selling_price_ht × margin_rate / 100 × quantity
    );
  END LOOP;

  -- =========================================
  -- 7. CRÉER SALES_ORDER_LINKME_DETAILS
  -- =========================================

  INSERT INTO sales_order_linkme_details (
    sales_order_id,
    -- Étape 1: Demandeur
    requester_type,
    requester_name,
    requester_email,
    requester_phone,
    requester_position,
    is_new_restaurant,
    -- Étape 2: Propriétaire
    owner_type,
    owner_contact_same_as_requester,
    owner_name,
    owner_email,
    owner_phone,
    -- Étape 3: Facturation
    billing_contact_source,
    delivery_terms_accepted,
    desired_delivery_date,
    mall_form_required
  ) VALUES (
    v_order_id,
    -- Étape 1
    p_requester->>'type',
    p_requester->>'name',
    p_requester->>'email',
    p_requester->>'phone',
    p_requester->>'position',
    COALESCE((p_organisation->>'is_new')::BOOLEAN, FALSE),
    -- Étape 2
    p_owner->>'type',
    COALESCE((p_owner->>'same_as_requester')::BOOLEAN, TRUE),
    p_owner->>'name',
    p_owner->>'email',
    p_owner->>'phone',
    -- Étape 3
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
  -- 8. SUCCÈS
  -- =========================================

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_id', v_customer_id,
    'total_ttc', v_total_ttc
  );

EXCEPTION WHEN OTHERS THEN
  -- Log l'erreur et retourner un message propre
  RAISE NOTICE 'Erreur create_public_linkme_order: % - %', SQLSTATE, SQLERRM;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Permettre aux utilisateurs anonymes ET authentifiés d'appeler cette fonction
GRANT EXECUTE ON FUNCTION create_public_linkme_order TO anon, authenticated;

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION create_public_linkme_order IS
'Crée une commande LinkMe depuis une page publique (client non connecté).

PARAMÈTRES:
- p_affiliate_id: UUID de l''affilié propriétaire de la sélection
- p_selection_id: UUID de la sélection LinkMe
- p_cart: JSONB array des produits [{product_id, quantity, selling_price_ttc, id}]
- p_requester: JSONB {type, name, email, phone, position}
- p_organisation: JSONB {existing_id} OU {is_new, trade_name, city, ...}
- p_owner: JSONB optionnel {type, same_as_requester, name, email, phone}
- p_billing: JSONB {contact_source, delivery_date, mall_form_required}

RETOURNE:
- Succès: {success: true, order_id, order_number, customer_id, total_ttc}
- Erreur: {success: false, error, sqlstate}

CALCUL DES COMMISSIONS (CORRIGÉ 2026-01-10):
- Source de vérité: linkme_selection_items
- Formule: retrocession_amount = selling_price_ht × margin_rate / 100 × quantity
- Le margin_rate est un TAUX DE MARQUE (sur prix de vente), pas un taux de marge (sur coût)
- Exemple: Plateau 20x30 → 23.75€ × 15% = 3.56€ (pas 3.03€!)

SÉCURITÉ:
- SECURITY DEFINER: s''exécute avec les privilèges du propriétaire
- SET row_security = off: bypass RLS pour permettre insertions anonymes
- Validation des données côté serveur avant toute insertion

UTILISÉ PAR:
- apps/linkme/src/lib/hooks/use-submit-enseigne-order.ts
- Pages publiques /s/[selection-id]';

-- ============================================
-- ROLLBACK (si nécessaire)
-- ============================================
-- DROP FUNCTION IF EXISTS create_public_linkme_order;

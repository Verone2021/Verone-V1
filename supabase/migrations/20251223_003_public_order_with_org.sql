-- Migration: Update create_public_order to support new organisation creation
-- Date: 2025-12-23
-- Description: When a new client orders, create organisation linked to enseigne

-- Helper function to generate linkme_code
CREATE OR REPLACE FUNCTION generate_linkme_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code like VERO-XXXX (4 alphanumeric chars)
    v_code := 'VERO-' || upper(substring(md5(random()::text) from 1 for 4));

    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM organisations WHERE linkme_code = v_code) INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- Updated create_public_order function
CREATE OR REPLACE FUNCTION public.create_public_order(
  p_selection_id uuid,
  p_customer_type text,
  p_items jsonb,
  p_customer_code varchar DEFAULT NULL,
  p_customer_data jsonb DEFAULT NULL,
  p_organisation_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_customer_id UUID;
  v_customer_org_type TEXT := 'organization';
  v_affiliate_id UUID;
  v_enseigne_id UUID;
  v_selection RECORD;
  v_item JSONB;
  v_selection_item RECORD;
  v_total_ht NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_item_total_ht NUMERIC;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
  v_new_customer_id UUID;
  v_new_org_id UUID;
  v_linkme_code TEXT;
  v_order_status TEXT;
BEGIN
  -- 1. Verifier que la selection existe et est publiee
  SELECT
    ls.*,
    la.id as aff_id,
    la.user_id as aff_user_id,
    la.enseigne_id as aff_enseigne_id
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
  v_enseigne_id := v_selection.aff_enseigne_id;

  -- 2. Gerer le client selon le type
  IF p_customer_type = 'existing' THEN
    -- Client existant avec code
    SELECT id INTO v_customer_id
    FROM organisations
    WHERE linkme_code = p_customer_code
      AND is_active = true;

    IF v_customer_id IS NULL THEN
      RAISE EXCEPTION 'Code client invalide ou inactif';
    END IF;

    v_order_status := 'pending'; -- Commande normale

  ELSIF p_customer_type = 'new' THEN
    -- Nouveau client: creer l'organisation
    IF p_organisation_data IS NULL THEN
      RAISE EXCEPTION 'Donnees organisation requises pour nouveau client';
    END IF;

    -- Generer un code linkme unique
    v_linkme_code := generate_linkme_code();

    -- Creer l'organisation (inactive, en attente d'approbation)
    INSERT INTO organisations (
      legal_name,
      address_line1,
      postal_code,
      city,
      phone,
      email,
      country,
      enseigne_id,
      source_type,
      source_affiliate_id,
      linkme_code,
      is_active,
      is_enseigne_parent
    ) VALUES (
      p_organisation_data->>'legal_name',
      p_organisation_data->>'address_line1',
      p_organisation_data->>'postal_code',
      p_organisation_data->>'city',
      NULLIF(p_organisation_data->>'phone', ''),
      NULLIF(p_organisation_data->>'email', ''),
      'FR',
      v_enseigne_id,
      'linkme',
      v_affiliate_id,
      v_linkme_code,
      false, -- Inactive jusqu'a approbation
      false
    )
    RETURNING id INTO v_new_org_id;

    v_customer_id := v_new_org_id;
    v_order_status := 'pending_approval'; -- Requiert approbation

  ELSE
    RAISE EXCEPTION 'Type client invalide: %', p_customer_type;
  END IF;

  -- 3. Generer numero de commande
  SELECT 'LNK-' || to_char(NOW(), 'YYYYMMDD') || '-' ||
         LPAD((COUNT(*)::int + 1)::text, 4, '0')
  INTO v_order_number
  FROM linkme_orders
  WHERE created_at::date = CURRENT_DATE;

  -- 4. Calculer les totaux
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT lsi.* INTO v_selection_item
    FROM linkme_selection_items lsi
    WHERE lsi.id = (v_item->>'item_id')::uuid
      AND lsi.selection_id = p_selection_id;

    IF v_selection_item IS NOT NULL THEN
      v_item_total_ht := v_selection_item.selling_price_ht * (v_item->>'quantity')::int;
      v_total_ht := v_total_ht + v_item_total_ht;
    END IF;
  END LOOP;

  v_total_ttc := v_total_ht * 1.2;

  -- 5. Creer la commande
  INSERT INTO linkme_orders (
    order_number,
    selection_id,
    affiliate_id,
    customer_id,
    customer_org_type,
    status,
    total_ht,
    total_ttc,
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    notes
  ) VALUES (
    v_order_number,
    p_selection_id,
    v_affiliate_id,
    v_customer_id,
    v_customer_org_type,
    v_order_status,
    v_total_ht,
    v_total_ttc,
    COALESCE(p_customer_data->>'first_name', ''),
    COALESCE(p_customer_data->>'last_name', ''),
    COALESCE(p_customer_data->>'email', ''),
    COALESCE(p_customer_data->>'phone', ''),
    CASE WHEN p_customer_type = 'new' THEN
      'Nouvelle organisation à approuver: ' || (p_organisation_data->>'legal_name')
    ELSE NULL END
  )
  RETURNING id INTO v_order_id;

  -- 6. Creer les lignes de commande
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT lsi.* INTO v_selection_item
    FROM linkme_selection_items lsi
    WHERE lsi.id = (v_item->>'item_id')::uuid
      AND lsi.selection_id = p_selection_id;

    IF v_selection_item IS NOT NULL THEN
      INSERT INTO linkme_order_items (
        order_id,
        selection_item_id,
        product_id,
        quantity,
        unit_price_ht,
        unit_price_ttc,
        total_ht,
        total_ttc
      ) VALUES (
        v_order_id,
        v_selection_item.id,
        v_selection_item.product_id,
        (v_item->>'quantity')::int,
        v_selection_item.selling_price_ht,
        v_selection_item.selling_price_ht * 1.2,
        v_selection_item.selling_price_ht * (v_item->>'quantity')::int,
        v_selection_item.selling_price_ht * 1.2 * (v_item->>'quantity')::int
      );
    END IF;
  END LOOP;

  -- 7. Mettre a jour le compteur de commandes de la selection
  UPDATE linkme_selections
  SET orders_count = COALESCE(orders_count, 0) + 1
  WHERE id = p_selection_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', v_order_status,
    'organisation_id', v_new_org_id,
    'linkme_code', v_linkme_code,
    'message', CASE
      WHEN p_customer_type = 'new' THEN
        'Commande créée. En attente de validation.'
      ELSE
        'Commande confirmée.'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Grant execute to anon for public access
GRANT EXECUTE ON FUNCTION generate_linkme_code() TO anon;
GRANT EXECUTE ON FUNCTION generate_linkme_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order(uuid, text, jsonb, varchar, jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_order(uuid, text, jsonb, varchar, jsonb, jsonb) TO authenticated;

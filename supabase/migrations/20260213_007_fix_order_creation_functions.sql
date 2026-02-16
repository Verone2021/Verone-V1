-- Migration: Fix order creation functions
--
-- TWO fixes:
-- 1. create_public_order (5 args): Fix incorrect retrocession formula
--    WAS:  base_price_ht * margin_rate / 100 * qty  (WRONG)
--    NOW:  ROUND((selling_price_ht - base_price_ht) * qty, 2)  (CORRECT)
-- 2. Both functions: Populate locked price columns at INSERT time
--    so orders are immediately protected from future price changes.

-- Fix create_public_order (5-arg version)
CREATE OR REPLACE FUNCTION public.create_public_order(
  p_selection_id uuid,
  p_customer_type text,
  p_items jsonb,
  p_customer_code character varying DEFAULT NULL::character varying,
  p_customer_data jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      retrocession_amount,
      base_price_ht_locked,
      selling_price_ht_locked,
      price_locked_at
    ) VALUES (
      v_order_id,
      v_selection_item.product_id,
      (v_item->>'quantity')::INTEGER,
      v_selection_item.selling_price_ht,
      0.2,
      v_selection_item.id,
      v_selection_item.margin_rate,
      -- FIX: correct formula (was base_price_ht * margin_rate / 100 * qty)
      ROUND(
        (v_selection_item.selling_price_ht - v_selection_item.base_price_ht)
        * (v_item->>'quantity')::INTEGER,
        2
      ),
      -- Lock prices immediately at order creation
      v_selection_item.base_price_ht,
      v_selection_item.selling_price_ht,
      NOW()
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
$function$;

-- Also update create_affiliate_order to populate locked price columns
-- (formula was already correct, just adding locked columns)
CREATE OR REPLACE FUNCTION public.create_affiliate_order(
  p_affiliate_id uuid,
  p_customer_id uuid,
  p_customer_type text,
  p_selection_id uuid,
  p_items jsonb,
  p_notes text DEFAULT NULL::text,
  p_responsable_contact_id uuid DEFAULT NULL::uuid,
  p_billing_contact_id uuid DEFAULT NULL::uuid,
  p_delivery_contact_id uuid DEFAULT NULL::uuid
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

  INSERT INTO sales_orders (
    order_number, channel_id, customer_id, customer_type,
    status, payment_status, created_by, created_by_affiliate_id,
    pending_admin_validation, linkme_selection_id, notes,
    total_ht, total_ttc, tax_rate,
    shipping_cost_ht, insurance_cost_ht, handling_cost_ht,
    responsable_contact_id, billing_contact_id, delivery_contact_id
  ) VALUES (
    v_order_number, v_linkme_channel_id, p_customer_id, p_customer_type,
    'draft', 'pending', v_current_user_id, p_affiliate_id,
    true, p_selection_id, p_notes,
    0, 0, 0.2,
    0, 0, 0,
    p_responsable_contact_id, p_billing_contact_id, p_delivery_contact_id
  ) RETURNING id INTO v_order_id;

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
      retrocession_rate, retrocession_amount,
      base_price_ht_locked,
      selling_price_ht_locked,
      price_locked_at
    ) VALUES (
      v_order_id, v_selection_item.product_id,
      (v_item->>'quantity')::INTEGER, v_selection_item.selling_price_ht,
      0.2, v_selection_item.id,
      v_selection_item.margin_rate,
      -- Commission: (selling_price - base_price) * qty
      ROUND(
        (v_selection_item.selling_price_ht - v_selection_item.base_price_ht)
        * (v_item->>'quantity')::INTEGER,
        2
      ),
      -- Lock prices immediately at order creation
      v_selection_item.base_price_ht,
      v_selection_item.selling_price_ht,
      NOW()
    );

    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;

  v_total_ttc := v_total_ht * 1.2;

  UPDATE sales_orders
  SET total_ht = v_total_ht, total_ttc = v_total_ttc
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$function$;

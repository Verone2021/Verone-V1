-- ============================================================================
-- Migration: Fix order number generation in create_affiliate_order
-- Date: 2026-01-25
-- Description: Corrige le bug de génération du numéro de commande
--              Le REGEXP_REPLACE ne fonctionnait pas correctement
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT, UUID, UUID, UUID);

-- Recreate with fixed order number generation
CREATE OR REPLACE FUNCTION create_affiliate_order(
  p_affiliate_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT,
  p_selection_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL,
  p_responsable_contact_id UUID DEFAULT NULL,
  p_billing_contact_id UUID DEFAULT NULL,
  p_delivery_contact_id UUID DEFAULT NULL
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
  v_max_num INTEGER;
  v_year TEXT;
  v_current_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur courant
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  -- ============================================
  -- VALIDATIONS
  -- ============================================

  IF NOT EXISTS (
    SELECT 1 FROM linkme_affiliates
    WHERE id = p_affiliate_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Affilié non trouvé ou inactif: %', p_affiliate_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RAISE EXCEPTION 'Sélection non trouvée ou n appartient pas à l affilié: %', p_selection_id;
  END IF;

  IF p_customer_type = 'organization' THEN
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Organisation cliente non trouvée: %', p_customer_id;
    END IF;
  ELSIF p_customer_type = 'individual' THEN
    IF NOT EXISTS (SELECT 1 FROM individual_customers WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Client individuel non trouvé: %', p_customer_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Type de client invalide: %. Doit être organization ou individual', p_customer_type;
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

  -- ============================================
  -- GÉNÉRATION NUMÉRO DE COMMANDE (FIXED)
  -- ============================================

  v_year := TO_CHAR(NOW(), 'YYYY');

  -- Méthode robuste: extraire le numéro avec SUBSTRING
  -- Format: SO-YYYY-NNNNN (ex: SO-2026-00001)
  -- Position 10 = après "SO-YYYY-" (9 caractères)
  -- Format: SO-YYYY-NNNNN = 13 caractères minimum (SO-2026-00001)
  -- Position 10 = début du numéro séquentiel
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

  -- ============================================
  -- CRÉATION DE LA COMMANDE
  -- ============================================

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
    handling_cost_ht,
    responsable_contact_id,
    billing_contact_id,
    delivery_contact_id
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
    0,
    p_responsable_contact_id,
    p_billing_contact_id,
    p_delivery_contact_id
  ) RETURNING id INTO v_order_id;

  -- ============================================
  -- CRÉATION DES LIGNES DE COMMANDE
  -- ============================================

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
      RAISE EXCEPTION 'Item de sélection non trouvé ou n appartient pas à la sélection: %', v_item->>'selection_item_id';
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
      v_selection_item.base_price_ht * v_selection_item.margin_rate * (v_item->>'quantity')::INTEGER
    );

    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;

  -- ============================================
  -- MISE À JOUR DES TOTAUX
  -- ============================================

  v_total_ttc := v_total_ht * 1.2;

  UPDATE sales_orders
  SET
    total_ht = v_total_ht,
    total_ttc = v_total_ttc
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT, UUID, UUID, UUID) TO authenticated;

-- Verification
SELECT 'Migration 20260125_001_fix_order_number_generation applied successfully' AS status;

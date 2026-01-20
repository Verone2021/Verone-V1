-- ============================================================================
-- Migration: Update RPC create_affiliate_order with contact parameters
-- Date: 2026-01-21
-- Task: Contact Management LinkMe
-- Description: Ajouter paramètres contact_id à create_affiliate_order
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT);

-- Recreate with contact parameters
CREATE OR REPLACE FUNCTION create_affiliate_order(
  p_affiliate_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT, -- 'organization' | 'individual'
  p_selection_id UUID,
  p_items JSONB, -- [{selection_item_id: UUID, quantity: INTEGER}]
  p_notes TEXT DEFAULT NULL,
  -- NEW PARAMETERS
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
BEGIN
  -- ============================================
  -- VALIDATIONS
  -- ============================================

  -- 1. Valider que l'affilié existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM linkme_affiliates
    WHERE id = p_affiliate_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Affilié non trouvé ou inactif: %', p_affiliate_id;
  END IF;

  -- 2. Valider que la sélection appartient à l'affilié
  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RAISE EXCEPTION 'Sélection non trouvée ou n appartient pas à l affilié: %', p_selection_id;
  END IF;

  -- 3. Valider que le client existe
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

  -- 4. Valider qu'il y a au moins un item
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Au moins un produit est requis';
  END IF;

  -- 5. Valider les contacts si fournis (optionnel)
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
  -- GÉNÉRATION NUMÉRO DE COMMANDE
  -- ============================================

  -- Générer le numéro de commande (format SO-YYYY-NNNNN)
  SELECT 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
         LPAD((COALESCE(MAX(NULLIF(REGEXP_REPLACE(order_number, '^SO-\\d{4}-', ''), '')::INTEGER), 0) + 1)::TEXT, 5, '0')
  INTO v_order_number
  FROM sales_orders
  WHERE order_number LIKE 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-%';

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
    -- NEW: Contact references
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
    p_affiliate_id,
    true, -- En attente de validation admin
    p_selection_id,
    p_notes,
    0, -- Calculé après
    0, -- Calculé après
    0.2, -- TVA 20% par défaut
    0,
    0,
    0,
    -- NEW: Contact IDs
    p_responsable_contact_id,
    p_billing_contact_id,
    p_delivery_contact_id
  ) RETURNING id INTO v_order_id;

  -- ============================================
  -- CRÉATION DES LIGNES DE COMMANDE
  -- ============================================

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Récupérer les détails de l'item de sélection
    -- SÉCURITÉ: La marge vient TOUJOURS de la table, pas du paramètre
    SELECT
      lsi.*,
      p.name as product_name,
      p.sku as product_sku
    INTO v_selection_item
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    WHERE lsi.id = (v_item->>'selection_item_id')::UUID
      AND lsi.selection_id = p_selection_id; -- Double vérification d'appartenance

    IF v_selection_item IS NULL THEN
      RAISE EXCEPTION 'Item de sélection non trouvé ou n appartient pas à la sélection: %', v_item->>'selection_item_id';
    END IF;

    -- Calculer le total HT de la ligne
    v_item_total_ht := v_selection_item.selling_price_ht * (v_item->>'quantity')::INTEGER;

    -- Insérer la ligne de commande
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
      0.2, -- TVA 20%
      v_selection_item.id,
      v_selection_item.margin_rate, -- MARGE = CELLE DE LA SÉLECTION (immutable)
      v_selection_item.base_price_ht * v_selection_item.margin_rate * (v_item->>'quantity')::INTEGER
    );

    -- Accumuler les totaux
    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;

  -- ============================================
  -- MISE À JOUR DES TOTAUX
  -- ============================================

  v_total_ttc := v_total_ht * 1.2; -- TVA 20%

  UPDATE sales_orders
  SET
    total_ht = v_total_ht,
    total_ttc = v_total_ttc
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT, UUID, UUID, UUID) IS
'Crée une commande depuis l app LinkMe (affilié).

NOUVEAUTÉS 2026-01-21:
- Support contact_id pour responsable, facturation, livraison
- Colonnes contact_id persistées dans sales_orders

SÉCURITÉ: La marge est TOUJOURS prise de linkme_selection_items, jamais du frontend.
Le statut initial est draft avec pending_admin_validation = true.

PARAMÈTRES:
- p_affiliate_id: UUID de l affilié
- p_customer_id: UUID du client (organisation ou individual)
- p_customer_type: Type de client (organization | individual)
- p_selection_id: UUID de la sélection LinkMe
- p_items: JSONB array [{selection_item_id, quantity}]
- p_notes: Notes optionnelles
- p_responsable_contact_id: UUID du contact responsable (optionnel)
- p_billing_contact_id: UUID du contact facturation (optionnel)
- p_delivery_contact_id: UUID du contact livraison (optionnel)

RETOURNE: UUID de la commande créée';

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT, UUID, UUID, UUID) TO authenticated;

-- ============================================
-- ROLLBACK (si nécessaire)
-- ============================================

-- Pour rollback, recréer la version sans contact_id :
-- DROP FUNCTION IF EXISTS create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT, UUID, UUID, UUID);
-- Puis réappliquer 20251219_002_rpc_create_affiliate_order.sql

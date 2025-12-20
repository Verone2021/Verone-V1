-- ============================================================================
-- Migration: RPC create_affiliate_order
-- Date: 2025-12-19
-- Description: Fonction pour créer une commande depuis l'app LinkMe (affilié)
-- Sécurité: La marge vient TOUJOURS de linkme_selection_items, jamais du frontend
-- ============================================================================

-- 1. Fonction principale de création de commande affilié
CREATE OR REPLACE FUNCTION create_affiliate_order(
  p_affiliate_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT, -- 'organization' | 'individual'
  p_selection_id UUID,
  p_items JSONB, -- [{selection_item_id: UUID, quantity: INTEGER}]
  p_notes TEXT DEFAULT NULL
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

  -- ============================================
  -- GÉNÉRATION NUMÉRO DE COMMANDE
  -- ============================================

  -- Générer le numéro de commande (format SO-YYYY-NNNNN)
  SELECT 'SO-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
         LPAD((COALESCE(MAX(NULLIF(REGEXP_REPLACE(order_number, '^SO-\d{4}-', ''), '')::INTEGER), 0) + 1)::TEXT, 5, '0')
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
    handling_cost_ht
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
    0
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

-- 2. Commentaire de documentation
COMMENT ON FUNCTION create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT) IS
'Crée une commande depuis l app LinkMe (affilié).
SÉCURITÉ: La marge est TOUJOURS prise de linkme_selection_items, jamais du frontend.
Le statut initial est draft avec pending_admin_validation = true.';

-- 3. Permissions
GRANT EXECUTE ON FUNCTION create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT) TO authenticated;

-- ============================================================================
-- FONCTION VALIDATION ADMIN
-- ============================================================================

-- Fonction pour valider une commande affilié (admin)
CREATE OR REPLACE FUNCTION validate_affiliate_order(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Vérifier que la commande existe et est en attente
  SELECT * INTO v_order
  FROM sales_orders
  WHERE id = p_order_id
    AND pending_admin_validation = true
    AND status = 'draft';

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Commande non trouvée ou pas en attente de validation: %', p_order_id;
  END IF;

  -- Marquer comme validée par admin (reste en draft pour workflow normal)
  UPDATE sales_orders
  SET
    pending_admin_validation = false,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rejeter une commande affilié (admin)
CREATE OR REPLACE FUNCTION reject_affiliate_order(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Rejetée par admin'
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Vérifier que la commande existe et est en attente
  SELECT * INTO v_order
  FROM sales_orders
  WHERE id = p_order_id
    AND pending_admin_validation = true
    AND status = 'draft';

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Commande non trouvée ou pas en attente de validation: %', p_order_id;
  END IF;

  -- Annuler la commande
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

-- Permissions
GRANT EXECUTE ON FUNCTION validate_affiliate_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_affiliate_order(UUID, TEXT) TO authenticated;

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
-- DROP FUNCTION IF EXISTS reject_affiliate_order(UUID, TEXT);
-- DROP FUNCTION IF EXISTS validate_affiliate_order(UUID);
-- DROP FUNCTION IF EXISTS create_affiliate_order(UUID, UUID, TEXT, UUID, JSONB, TEXT);

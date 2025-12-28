-- =====================================================
-- MIGRATION: Ajouter création mouvement stock à l'approbation
-- Date: 2025-12-21
-- Description: Lors de l'approbation d'un produit affilié avec stock_quantity > 0,
--              créer automatiquement un mouvement de stock et mettre à jour stock_real
-- Règle métier: "Le client doit toujours indiquer un stock" (qu'il stocke lui-même ou nous l'envoi)
-- =====================================================

-- Drop et recreer la fonction avec la nouvelle logique
DROP FUNCTION IF EXISTS approve_affiliate_product(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION approve_affiliate_product(
  p_product_id UUID,
  p_commission_rate NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_stock_before INTEGER;
  v_stock_after INTEGER;
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID utilisateur
  v_user_id := auth.uid();

  -- Verifier acces admin back-office
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = v_user_id
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Recuperer le produit
  SELECT * INTO v_product FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.affiliate_approval_status != 'pending_approval' THEN
    RAISE EXCEPTION 'Product must be pending approval';
  END IF;

  -- IMPORTANT: Commission obligatoire
  IF p_commission_rate IS NULL THEN
    RAISE EXCEPTION 'Commission rate is required for approval';
  END IF;

  -- Valider la commission (5%, 10%, 15%)
  IF p_commission_rate NOT IN (5, 10, 15) THEN
    RAISE EXCEPTION 'Commission rate must be 5, 10, or 15 percent';
  END IF;

  -- ========================================
  -- NOUVEAU: Gestion du stock initial affilié
  -- ========================================

  -- Récupérer le stock actuel avant modification
  v_stock_before := COALESCE(v_product.stock_real, 0);

  -- Si le produit a un stock_quantity > 0, créer un mouvement de stock
  IF COALESCE(v_product.stock_quantity, 0) > 0 THEN
    -- Calculer le nouveau stock
    v_stock_after := v_stock_before + v_product.stock_quantity;

    -- Créer le mouvement de stock (entrée)
    INSERT INTO stock_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_type,
      reference_id,
      notes,
      reason_code,
      performed_by
    ) VALUES (
      p_product_id,
      'IN',
      v_product.stock_quantity,
      v_stock_before,
      v_stock_after,
      'affiliate_product',
      p_product_id,
      'Stock initial produit affilié - Approbation',
      'affiliate_initial_stock',
      v_user_id
    );

    -- Mettre à jour stock_real
    UPDATE products
    SET stock_real = v_stock_after
    WHERE id = p_product_id;
  END IF;

  -- ========================================
  -- Approuver avec la commission
  -- ========================================
  UPDATE products
  SET
    affiliate_approval_status = 'approved',
    affiliate_commission_rate = p_commission_rate,
    affiliate_approved_at = NOW(),
    affiliate_approved_by = v_user_id,
    affiliate_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

-- Commentaire explicatif
COMMENT ON FUNCTION approve_affiliate_product IS
'Approuve un produit affilié avec commission obligatoire.
NOUVEAU (2025-12-21): Si stock_quantity > 0, crée automatiquement un mouvement de stock
de type "affiliate_initial_stock" et met à jour stock_real.
Règle métier: Le client doit toujours indiquer un stock (stocké chez lui ou envoyé à Vérone).';

-- Revoquer et re-granter les permissions
REVOKE ALL ON FUNCTION approve_affiliate_product(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_affiliate_product(UUID, NUMERIC) TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

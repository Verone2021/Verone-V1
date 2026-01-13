-- =====================================================
-- Migration: RPC pour mise a jour produits affilies
-- Date: 2026-01-09
-- Description: Fonction RPC pour modifier commission et payout
--              des produits affilies approuves
-- =====================================================

-- 1. Fonction RPC principale
CREATE OR REPLACE FUNCTION update_affiliate_product(
  p_product_id UUID,
  p_commission_rate NUMERIC DEFAULT NULL,
  p_payout_ht NUMERIC DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_old_commission NUMERIC;
  v_old_payout NUMERIC;
BEGIN
  -- Recuperer l'utilisateur courant
  v_user_id := auth.uid();

  -- Verifier les droits admin
  SELECT EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = v_user_id
      AND app = 'back-office'
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Acces refuse: droits admin requis'
    );
  END IF;

  -- Recuperer le produit
  SELECT
    id,
    name,
    created_by_affiliate,
    affiliate_commission_rate,
    affiliate_payout_ht,
    affiliate_approval_status
  INTO v_product
  FROM products
  WHERE id = p_product_id;

  IF v_product IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Produit non trouve'
    );
  END IF;

  -- Verifier que c'est un produit affilie
  IF v_product.created_by_affiliate IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ce n est pas un produit affilie'
    );
  END IF;

  -- Verifier que le produit est approuve
  IF v_product.affiliate_approval_status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Le produit doit etre approuve pour etre modifie'
    );
  END IF;

  -- Stocker anciennes valeurs pour l'historique
  v_old_commission := v_product.affiliate_commission_rate;
  v_old_payout := v_product.affiliate_payout_ht;

  -- Valider les nouvelles valeurs
  IF p_commission_rate IS NOT NULL THEN
    IF p_commission_rate < 0 OR p_commission_rate > 100 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Le taux de commission doit etre entre 0 et 100'
      );
    END IF;
  END IF;

  IF p_payout_ht IS NOT NULL THEN
    IF p_payout_ht < 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Le payout doit etre positif'
      );
    END IF;
  END IF;

  -- Mettre a jour le produit
  UPDATE products
  SET
    affiliate_commission_rate = COALESCE(p_commission_rate, affiliate_commission_rate),
    affiliate_payout_ht = COALESCE(p_payout_ht, affiliate_payout_ht),
    updated_at = NOW()
  WHERE id = p_product_id;

  -- Le trigger log_product_commission_change() s'occupe de l'historique

  -- Si une raison est fournie, mettre a jour le dernier enregistrement d'historique
  IF p_change_reason IS NOT NULL THEN
    UPDATE product_commission_history
    SET change_reason = p_change_reason
    WHERE product_id = p_product_id
      AND modified_at = (
        SELECT MAX(modified_at)
        FROM product_commission_history
        WHERE product_id = p_product_id
      );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'old_commission_rate', v_old_commission,
    'new_commission_rate', COALESCE(p_commission_rate, v_old_commission),
    'old_payout_ht', v_old_payout,
    'new_payout_ht', COALESCE(p_payout_ht, v_old_payout)
  );
END;
$$;

-- 2. Fonction pour recuperer l'historique d'un produit
CREATE OR REPLACE FUNCTION get_product_commission_history(
  p_product_id UUID
)
RETURNS TABLE (
  id UUID,
  old_commission_rate NUMERIC,
  new_commission_rate NUMERIC,
  old_payout_ht NUMERIC,
  new_payout_ht NUMERIC,
  change_reason TEXT,
  change_type TEXT,
  modified_by UUID,
  modified_by_email TEXT,
  modified_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pch.id,
    pch.old_commission_rate,
    pch.new_commission_rate,
    pch.old_payout_ht,
    pch.new_payout_ht,
    pch.change_reason,
    pch.change_type,
    pch.modified_by,
    au.email as modified_by_email,
    pch.modified_at
  FROM product_commission_history pch
  LEFT JOIN auth.users au ON au.id = pch.modified_by
  WHERE pch.product_id = p_product_id
  ORDER BY pch.modified_at DESC;
END;
$$;

-- 3. Commentaires
COMMENT ON FUNCTION update_affiliate_product IS
  'Met a jour la commission et/ou le payout d un produit affilie approuve';
COMMENT ON FUNCTION get_product_commission_history IS
  'Recupere l historique des modifications de commission d un produit';

-- =====================================================
-- Verification
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'RPC update_affiliate_product creee avec succes';
  RAISE NOTICE 'RPC get_product_commission_history creee avec succes';
END $$;

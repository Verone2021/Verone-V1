-- =====================================================
-- MIGRATION: Modifier approve_affiliate_product pour exiger commission
-- Date: 2025-12-20
-- Description: La commission doit etre definie avant approbation
-- =====================================================

-- Drop et recreer la fonction avec le nouveau parametre
DROP FUNCTION IF EXISTS approve_affiliate_product(UUID);

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
BEGIN
  -- Verifier acces admin back-office
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
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

  -- Approuver avec la commission
  UPDATE products
  SET
    affiliate_approval_status = 'approved',
    affiliate_commission_rate = p_commission_rate,
    affiliate_approved_at = NOW(),
    affiliate_approved_by = auth.uid(),
    affiliate_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

-- Revoquer et re-granter les permissions
REVOKE ALL ON FUNCTION approve_affiliate_product(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_affiliate_product(UUID, NUMERIC) TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

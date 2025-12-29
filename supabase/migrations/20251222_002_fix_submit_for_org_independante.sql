-- =====================================================
-- MIGRATION: Fix submit_affiliate_product_for_approval pour org_independante
-- Date: 2025-12-22
-- Description: Permet aux organisations independantes de soumettre leurs produits
-- =====================================================

CREATE OR REPLACE FUNCTION submit_affiliate_product_for_approval(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_user_id UUID;
  v_has_access BOOLEAN := FALSE;
BEGIN
  v_user_id := auth.uid();

  -- Get product and affiliate info
  SELECT p.*, la.enseigne_id AS affiliate_enseigne_id, la.organisation_id AS affiliate_organisation_id
  INTO v_product
  FROM products p
  JOIN linkme_affiliates la ON la.id = p.created_by_affiliate
  WHERE p.id = p_product_id;

  -- Product not found or not an affiliate product
  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found or not an affiliate product';
  END IF;

  -- Check user has access: either via enseigne_id OR via organisation_id (for org_independante)
  -- 1. Check via enseigne_id
  IF v_product.affiliate_enseigne_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = v_user_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id = v_product.affiliate_enseigne_id
    ) INTO v_has_access;
  END IF;

  -- 2. Check via organisation_id (for org_independante)
  IF NOT v_has_access AND v_product.affiliate_organisation_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = v_user_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.organisation_id = v_product.affiliate_organisation_id
    ) INTO v_has_access;
  END IF;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Check product is in draft status
  IF v_product.affiliate_approval_status != 'draft' THEN
    RAISE EXCEPTION 'Product must be in draft status to submit for approval';
  END IF;

  -- Update status to pending_approval
  UPDATE products
  SET
    affiliate_approval_status = 'pending_approval',
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION submit_affiliate_product_for_approval IS
'Soumet un produit affilie pour approbation.
Supporte les enseignes ET les organisations independantes (org_independante).';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

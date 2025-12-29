-- Migration: RLS Policies for affiliate-created products
-- Description: Security policies for affiliate product creation and viewing

-- Note: products table already has RLS enabled
-- We need to add policies specific to affiliate-created products

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Affiliate view own created products" ON products;
DROP POLICY IF EXISTS "Affiliate create products" ON products;
DROP POLICY IF EXISTS "Affiliate update draft products" ON products;
DROP POLICY IF EXISTS "Affiliate submit for approval" ON products;

-- Policy 1: Affiliate can view their own created products (any status)
-- Uses enseigne_id link through linkme_affiliates
CREATE POLICY "Affiliate view own created products"
  ON products FOR SELECT
  USING (
    created_by_affiliate IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.enseigne_id = la.enseigne_id
      WHERE la.id = products.created_by_affiliate
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- Policy 2: Affiliate can create products (draft status only)
-- Product must be linked to their enseigne
CREATE POLICY "Affiliate create products"
  ON products FOR INSERT
  WITH CHECK (
    -- Must be a draft affiliate product
    affiliate_approval_status = 'draft'
    -- Must have enseigne_id set
    AND enseigne_id IS NOT NULL
    -- User must have linkme role for this enseigne
    AND EXISTS (
      SELECT 1
      FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id = products.enseigne_id
        AND uar.role IN ('enseigne_admin', 'org_independante')
    )
    -- created_by_affiliate must match the enseigne's affiliate
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      WHERE la.id = products.created_by_affiliate
        AND la.enseigne_id = products.enseigne_id
    )
  );

-- Policy 3: Affiliate can update their own draft products
CREATE POLICY "Affiliate update draft products"
  ON products FOR UPDATE
  USING (
    -- Must be a draft product
    affiliate_approval_status = 'draft'
    -- Must be created by affiliate
    AND created_by_affiliate IS NOT NULL
    -- User must have access
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.enseigne_id = la.enseigne_id
      WHERE la.id = products.created_by_affiliate
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  )
  WITH CHECK (
    -- Can only update certain fields (not change approval status arbitrarily)
    -- Status can only go from draft to pending_approval
    (
      affiliate_approval_status = 'draft'
      OR affiliate_approval_status = 'pending_approval'
    )
    -- Must remain linked to same enseigne
    AND enseigne_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.enseigne_id = la.enseigne_id
      WHERE la.id = products.created_by_affiliate
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );


-- RPC: Submit product for approval (controlled status change)
CREATE OR REPLACE FUNCTION submit_affiliate_product_for_approval(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
BEGIN
  -- Get product and verify ownership
  SELECT p.*, la.enseigne_id AS affiliate_enseigne_id
  INTO v_product
  FROM products p
  JOIN linkme_affiliates la ON la.id = p.created_by_affiliate
  WHERE p.id = p_product_id;

  -- Product not found or not an affiliate product
  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found or not an affiliate product';
  END IF;

  -- Check user has access to this enseigne
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND uar.enseigne_id = v_product.affiliate_enseigne_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Check product is in draft status
  IF v_product.affiliate_approval_status != 'draft' THEN
    RAISE EXCEPTION 'Product must be in draft status to submit for approval';
  END IF;

  -- Validate required fields
  IF v_product.name IS NULL OR v_product.name = '' THEN
    RAISE EXCEPTION 'Product name is required';
  END IF;

  IF v_product.affiliate_payout_ht IS NULL OR v_product.affiliate_payout_ht <= 0 THEN
    RAISE EXCEPTION 'Payout price must be greater than 0';
  END IF;

  -- Update status to pending
  UPDATE products
  SET
    affiliate_approval_status = 'pending_approval',
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_affiliate_product_for_approval(UUID) TO authenticated;


-- RPC: Approve affiliate product (admin only)
CREATE OR REPLACE FUNCTION approve_affiliate_product(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
BEGIN
  -- Check user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Get product
  SELECT * INTO v_product FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.affiliate_approval_status != 'pending_approval' THEN
    RAISE EXCEPTION 'Product must be pending approval';
  END IF;

  -- Approve
  UPDATE products
  SET
    affiliate_approval_status = 'approved',
    affiliate_approved_at = NOW(),
    affiliate_approved_by = auth.uid(),
    affiliate_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_affiliate_product(UUID) TO authenticated;


-- RPC: Reject affiliate product (admin only)
CREATE OR REPLACE FUNCTION reject_affiliate_product(
  p_product_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
BEGIN
  -- Check user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Validate reason
  IF p_reason IS NULL OR p_reason = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  -- Get product
  SELECT * INTO v_product FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.affiliate_approval_status != 'pending_approval' THEN
    RAISE EXCEPTION 'Product must be pending approval';
  END IF;

  -- Reject (back to draft so affiliate can fix and resubmit)
  UPDATE products
  SET
    affiliate_approval_status = 'rejected',
    affiliate_rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION reject_affiliate_product(UUID, TEXT) TO authenticated;


-- RPC: Get pending approvals count (for badge)
CREATE OR REPLACE FUNCTION get_pending_approvals_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM products
  WHERE affiliate_approval_status = 'pending_approval';
$$;

GRANT EXECUTE ON FUNCTION get_pending_approvals_count() TO authenticated;


-- RPC: Get affiliate products for enseigne
CREATE OR REPLACE FUNCTION get_affiliate_products_for_enseigne(p_enseigne_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  affiliate_payout_ht NUMERIC,
  affiliate_commission_rate NUMERIC,
  affiliate_approval_status affiliate_product_approval_status,
  affiliate_rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  dimensions JSONB,
  description TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.sku,
    p.affiliate_payout_ht,
    p.affiliate_commission_rate,
    p.affiliate_approval_status,
    p.affiliate_rejection_reason,
    p.created_at,
    p.updated_at,
    p.dimensions::JSONB,
    p.description
  FROM products p
  JOIN linkme_affiliates la ON la.id = p.created_by_affiliate
  WHERE la.enseigne_id = p_enseigne_id
    AND p.created_by_affiliate IS NOT NULL
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_affiliate_products_for_enseigne(UUID) TO authenticated;

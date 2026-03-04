-- Migration: Add store_at_verone to get_affiliate_products_for_enseigne RPC
-- This allows LinkMe to conditionally show the Stock button only for products stored at Verone

-- Must drop first because RETURNS TABLE signature changed (added store_at_verone column)
DROP FUNCTION IF EXISTS get_affiliate_products_for_enseigne(UUID);

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
  description TEXT,
  store_at_verone BOOLEAN
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
    p.description,
    p.store_at_verone
  FROM products p
  JOIN linkme_affiliates la ON la.id = p.created_by_affiliate
  WHERE la.enseigne_id = p_enseigne_id
    AND p.created_by_affiliate IS NOT NULL
  ORDER BY p.created_at DESC;
$$;

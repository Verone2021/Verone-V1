-- ============================================
-- Migration: Add enseigne_id + ownership_type to create_customer_organisation_for_affiliate
-- Date: 2026-02-15
-- Description:
--   Add p_enseigne_id UUID and p_ownership_type TEXT parameters so that
--   new customer organisations created via LinkMe get properly linked to
--   their enseigne and have their ownership type set (succursale/franchise).
-- ============================================

-- Drop the existing function (12 params) to recreate with 14 params
DROP FUNCTION IF EXISTS create_customer_organisation_for_affiliate(
  uuid, text, text, text, text, text, text, text, boolean, text, decimal, decimal
);

-- Recreate the RPC with enseigne_id and ownership_type parameters
CREATE OR REPLACE FUNCTION create_customer_organisation_for_affiliate(
  p_affiliate_id UUID,
  p_legal_name TEXT,
  p_trade_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_is_new_restaurant BOOLEAN DEFAULT false,
  p_country TEXT DEFAULT 'FR',
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  -- NEW: Enseigne and ownership parameters
  p_enseigne_id UUID DEFAULT NULL,
  p_ownership_type TEXT DEFAULT NULL  -- 'succursale' or 'franchise'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_new_id UUID;
  v_approval_status TEXT;
BEGIN
  -- Determine approval status
  IF p_is_new_restaurant THEN
    v_approval_status := 'pending_validation';
  ELSE
    v_approval_status := 'approved';
  END IF;

  INSERT INTO organisations (
    legal_name,
    trade_name,
    email,
    phone,
    address_line1,
    postal_code,
    city,
    country,
    latitude,
    longitude,
    source_affiliate_id,
    source_type,
    type,
    is_active,
    approval_status,
    enseigne_id,
    ownership_type
  ) VALUES (
    p_legal_name,
    p_trade_name,
    p_email,
    p_phone,
    p_address,
    p_postal_code,
    p_city,
    COALESCE(p_country, 'FR'),
    p_latitude,
    p_longitude,
    p_affiliate_id,
    'linkme',
    'customer',
    true,
    v_approval_status,
    p_enseigne_id,
    p_ownership_type::organisation_ownership_type
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Update comment
COMMENT ON FUNCTION create_customer_organisation_for_affiliate IS
'Creates a customer organisation for a LinkMe affiliate.

Parameters:
- p_affiliate_id: UUID of the affiliate creating this customer
- p_legal_name: Legal name (required)
- p_trade_name: Trade/commercial name
- p_email, p_phone: Contact info
- p_address, p_postal_code, p_city: Address info
- p_is_new_restaurant: If true, sets approval_status = pending_validation
- p_country: ISO country code (FR, LU, BE, etc.). Default FR.
- p_latitude, p_longitude: GPS coordinates
- p_enseigne_id: UUID of the parent enseigne (for linking org to enseigne)
- p_ownership_type: succursale or franchise

VAT Behavior (via trigger):
- France (FR) = 20% default VAT
- Other countries = 0% (export)';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_customer_organisation_for_affiliate TO authenticated;

-- ============================================
-- Migration: Add geolocation params to create_customer_organisation_for_affiliate
-- Date: 2026-01-20
-- Description:
--   Add p_country, p_latitude, p_longitude parameters to RPC
--   for automatic VAT rate calculation and store locator support
-- ============================================

-- Drop the existing function (9 params) to recreate with 12 params
DROP FUNCTION IF EXISTS create_customer_organisation_for_affiliate(
  uuid, text, text, text, text, text, text, text, boolean
);

-- Recreate the RPC with geolocation parameters
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
  -- NEW: Geolocation parameters for TVA calculation
  p_country TEXT DEFAULT 'FR',           -- ISO country code
  p_latitude DECIMAL DEFAULT NULL,       -- GPS latitude
  p_longitude DECIMAL DEFAULT NULL       -- GPS longitude
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
    country,          -- NEW
    latitude,         -- NEW
    longitude,        -- NEW
    source_affiliate_id,
    source_type,
    type,
    is_active,
    approval_status
    -- default_vat_rate is auto-calculated by trigger based on country
  ) VALUES (
    p_legal_name,
    p_trade_name,
    p_email,
    p_phone,
    p_address,
    p_postal_code,
    p_city,
    COALESCE(p_country, 'FR'),  -- Default to France
    p_latitude,
    p_longitude,
    p_affiliate_id,
    'linkme',
    'customer',
    true,
    v_approval_status
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
- p_country: ISO country code (FR, LU, BE, etc.). Default FR. Used for VAT calculation.
- p_latitude, p_longitude: GPS coordinates for store locator map

VAT Behavior (via trigger):
- France (FR) = 20% default VAT
- Other countries = 0% (export)

The default_vat_rate is auto-calculated by the trg_calculate_default_vat_rate trigger.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_customer_organisation_for_affiliate TO authenticated;

-- ============================================
-- Migration: Fix RLS for LinkMe order creation flow
-- Date: 2026-02-15
-- Description:
--   1. Change create_customer_organisation_for_affiliate to SECURITY DEFINER
--      (matches pattern of all other LinkMe RPCs like create_affiliate_order)
--   2. Add INSERT policy on contacts for LinkMe affiliates
--      (allows creating contacts for organisations belonging to their enseigne)
-- ============================================

-- ============================================
-- FIX 1: RPC → SECURITY DEFINER
-- ============================================
-- Drop existing function and recreate with SECURITY DEFINER
DROP FUNCTION IF EXISTS create_customer_organisation_for_affiliate(
  uuid, text, text, text, text, text, text, text, boolean, text, decimal, decimal, uuid, text
);

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
  p_enseigne_id UUID DEFAULT NULL,
  p_ownership_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_approval_status TEXT;
BEGIN
  -- Verify caller is a LinkMe affiliate
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'linkme'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: not a LinkMe affiliate';
  END IF;

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

COMMENT ON FUNCTION create_customer_organisation_for_affiliate IS
'Creates a customer organisation for a LinkMe affiliate.
SECURITY DEFINER: Bypasses RLS to allow insert into organisations table.
Includes access check: caller must be a LinkMe affiliate.

Parameters:
- p_affiliate_id: UUID of the affiliate creating this customer
- p_legal_name: Legal name (required)
- p_trade_name: Trade/commercial name
- p_email, p_phone: Contact info
- p_address, p_postal_code, p_city: Address info
- p_is_new_restaurant: If true, sets approval_status = pending_validation
- p_country: ISO country code (FR, LU, BE, etc.). Default FR.
- p_latitude, p_longitude: GPS coordinates
- p_enseigne_id: UUID of the parent enseigne
- p_ownership_type: succursale or franchise

VAT Behavior (via trigger):
- France (FR) = 20% default VAT
- Other countries = 0% (export)';

GRANT EXECUTE ON FUNCTION create_customer_organisation_for_affiliate TO authenticated;

-- ============================================
-- FIX 2: INSERT policy on contacts for LinkMe affiliates
-- ============================================
-- Allow LinkMe affiliates to create contacts for:
-- - Organisations belonging to their enseigne (enseigne_admin)
-- - Their own organisation (organisation_admin / org_independante)

CREATE POLICY "linkme_insert_contacts" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    -- LinkMe affiliate can insert contacts for organisations they manage
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          -- enseigne_admin: can create contacts for any org in their enseigne
          (uar.role = 'enseigne_admin'
           AND uar.enseigne_id IS NOT NULL
           AND (
             -- Contact linked to an org in their enseigne
             contacts.organisation_id IN (
               SELECT o.id FROM organisations o
               WHERE o.enseigne_id = uar.enseigne_id
             )
             -- Or contact linked directly to their enseigne
             OR contacts.enseigne_id = uar.enseigne_id
           ))
          OR
          -- organisation_admin: can create contacts for their own org
          (uar.organisation_id IS NOT NULL
           AND contacts.organisation_id = uar.organisation_id)
        )
    )
  );

-- Also add SELECT policy on contacts for LinkMe affiliates
-- (they need to read contacts for their organisations)
CREATE POLICY "linkme_select_contacts" ON contacts
  FOR SELECT TO authenticated
  USING (
    -- Backoffice already covered by backoffice_full_access_contacts
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          -- enseigne_admin: sees contacts for orgs in their enseigne + enseigne contacts
          (uar.role = 'enseigne_admin'
           AND uar.enseigne_id IS NOT NULL
           AND (
             contacts.organisation_id IN (
               SELECT o.id FROM organisations o
               WHERE o.enseigne_id = uar.enseigne_id
             )
             OR contacts.enseigne_id = uar.enseigne_id
           ))
          OR
          -- organisation_admin: sees contacts for their own org
          (uar.organisation_id IS NOT NULL
           AND contacts.organisation_id = uar.organisation_id)
        )
    )
  );

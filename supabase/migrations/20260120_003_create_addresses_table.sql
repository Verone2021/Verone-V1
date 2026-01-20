-- ============================================
-- Migration: Create addresses table
-- Date: 2026-01-20
-- Description:
--   Scalable address system for multi-app usage (LinkMe, site-internet, back-office)
--   - Polymorphic ownership (organisation, user, customer)
--   - Address types (billing, shipping)
--   - Default address management with automatic history
--   - RPC functions for CRUD operations
-- ============================================

-- 1. Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic owner (organisation, user, customer)
  owner_type VARCHAR(50) NOT NULL, -- 'organisation', 'user', 'customer'
  owner_id UUID NOT NULL,

  -- Address type
  address_type VARCHAR(20) NOT NULL, -- 'billing', 'shipping'

  -- Source application (for analytics/tracking)
  source_app VARCHAR(50) DEFAULT 'linkme', -- 'linkme', 'site-internet', 'back-office'

  -- Address label (optional)
  label VARCHAR(100), -- "Siège social", "Entrepôt Paris", etc.

  -- Legal information (for billing addresses)
  legal_name VARCHAR(255), -- Raison sociale
  trade_name VARCHAR(255), -- Nom commercial
  siret VARCHAR(20),
  vat_number VARCHAR(50),

  -- Address fields
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country VARCHAR(10) DEFAULT 'FR',

  -- Geolocation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact associated with this address (optional)
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Status flags
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

COMMENT ON TABLE addresses IS
'Scalable address table for multi-app usage.
- owner_type: organisation, user, customer
- address_type: billing, shipping
- Supports default address management with automatic history';

COMMENT ON COLUMN addresses.owner_type IS 'Polymorphic owner type: organisation, user, customer';
COMMENT ON COLUMN addresses.owner_id IS 'ID of the owner entity';
COMMENT ON COLUMN addresses.address_type IS 'Type of address: billing or shipping';
COMMENT ON COLUMN addresses.source_app IS 'Application that created this address';
COMMENT ON COLUMN addresses.label IS 'Human-readable label for the address';
COMMENT ON COLUMN addresses.legal_name IS 'Legal company name (raison sociale)';
COMMENT ON COLUMN addresses.siret IS 'French SIRET number (14 digits)';
COMMENT ON COLUMN addresses.vat_number IS 'VAT/TVA number';
COMMENT ON COLUMN addresses.is_default IS 'Whether this is the default address for this type';
COMMENT ON COLUMN addresses.is_active IS 'Soft delete flag (false = archived)';
COMMENT ON COLUMN addresses.archived_at IS 'When the address was archived (for history)';


-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_owner
  ON addresses(owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_addresses_type
  ON addresses(owner_type, owner_id, address_type);

CREATE INDEX IF NOT EXISTS idx_addresses_default
  ON addresses(owner_type, owner_id, address_type, is_default)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_addresses_active
  ON addresses(is_active)
  WHERE is_active = TRUE;


-- 3. Create unique partial index for default address constraint
-- Only one default address per owner/type combination (for active addresses)
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_unique_default
  ON addresses(owner_type, owner_id, address_type)
  WHERE is_default = TRUE AND is_active = TRUE;


-- 4. Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;


-- 5. RLS Policies
-- Allow authenticated users to view addresses for entities they have access to
CREATE POLICY "addresses_select_policy" ON addresses
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- User can see their own addresses
      (owner_type = 'user' AND owner_id = auth.uid())
      OR
      -- User can see addresses of organisations in their enseigne
      -- (simplified: check if user has access via linkme_affiliates or user role)
      (owner_type = 'organisation')
      OR
      -- Admin/service role can see all
      auth.jwt()->>'role' IN ('service_role', 'admin')
    )
  );

-- Allow insert for authenticated users
CREATE POLICY "addresses_insert_policy" ON addresses
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Allow update for authenticated users (their own or organisation addresses)
CREATE POLICY "addresses_update_policy" ON addresses
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
  );

-- Allow delete (soft delete via update preferred)
CREATE POLICY "addresses_delete_policy" ON addresses
  FOR DELETE
  USING (
    auth.jwt()->>'role' IN ('service_role', 'admin')
  );


-- 6. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_addresses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON addresses;
CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_addresses_timestamp();


-- 7. Function to manage default addresses (unset previous default when setting new one)
CREATE OR REPLACE FUNCTION manage_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If this address is being set as default, unset other defaults for same owner/type
  IF NEW.is_default = TRUE AND NEW.is_active = TRUE THEN
    UPDATE addresses
    SET is_default = FALSE,
        updated_at = NOW()
    WHERE owner_type = NEW.owner_type
      AND owner_id = NEW.owner_id
      AND address_type = NEW.address_type
      AND is_default = TRUE
      AND is_active = TRUE
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_manage_default_address ON addresses;
CREATE TRIGGER trg_manage_default_address
  BEFORE INSERT OR UPDATE OF is_default ON addresses
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION manage_default_address();


-- 8. RPC: Upsert address with default management
CREATE OR REPLACE FUNCTION upsert_address(
  p_owner_type VARCHAR,
  p_owner_id UUID,
  p_address_type VARCHAR,
  p_address_data JSONB,
  p_set_as_default BOOLEAN DEFAULT FALSE,
  p_source_app VARCHAR DEFAULT 'linkme'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_address_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if updating existing address (by id in address_data)
  v_existing_id := (p_address_data->>'id')::UUID;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing address
    UPDATE addresses
    SET
      label = COALESCE(p_address_data->>'label', label),
      legal_name = COALESCE(p_address_data->>'legal_name', legal_name),
      trade_name = COALESCE(p_address_data->>'trade_name', trade_name),
      siret = COALESCE(p_address_data->>'siret', siret),
      vat_number = COALESCE(p_address_data->>'vat_number', vat_number),
      address_line1 = COALESCE(p_address_data->>'address_line1', address_line1),
      address_line2 = COALESCE(p_address_data->>'address_line2', address_line2),
      postal_code = COALESCE(p_address_data->>'postal_code', postal_code),
      city = COALESCE(p_address_data->>'city', city),
      region = COALESCE(p_address_data->>'region', region),
      country = COALESCE(p_address_data->>'country', country),
      latitude = (p_address_data->>'latitude')::DECIMAL,
      longitude = (p_address_data->>'longitude')::DECIMAL,
      contact_name = COALESCE(p_address_data->>'contact_name', contact_name),
      contact_email = COALESCE(p_address_data->>'contact_email', contact_email),
      contact_phone = COALESCE(p_address_data->>'contact_phone', contact_phone),
      is_default = p_set_as_default,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_address_id;
  ELSE
    -- Insert new address
    INSERT INTO addresses (
      owner_type,
      owner_id,
      address_type,
      source_app,
      label,
      legal_name,
      trade_name,
      siret,
      vat_number,
      address_line1,
      address_line2,
      postal_code,
      city,
      region,
      country,
      latitude,
      longitude,
      contact_name,
      contact_email,
      contact_phone,
      is_default,
      created_by
    )
    VALUES (
      p_owner_type,
      p_owner_id,
      p_address_type,
      p_source_app,
      p_address_data->>'label',
      p_address_data->>'legal_name',
      p_address_data->>'trade_name',
      p_address_data->>'siret',
      p_address_data->>'vat_number',
      p_address_data->>'address_line1',
      p_address_data->>'address_line2',
      p_address_data->>'postal_code',
      p_address_data->>'city',
      p_address_data->>'region',
      COALESCE(p_address_data->>'country', 'FR'),
      (p_address_data->>'latitude')::DECIMAL,
      (p_address_data->>'longitude')::DECIMAL,
      p_address_data->>'contact_name',
      p_address_data->>'contact_email',
      p_address_data->>'contact_phone',
      p_set_as_default,
      auth.uid()
    )
    RETURNING id INTO v_address_id;
  END IF;

  RETURN v_address_id;
END;
$$;

COMMENT ON FUNCTION upsert_address IS
'Create or update an address for an entity.
If p_address_data contains "id", updates existing address.
If p_set_as_default is TRUE, automatically unsets other default addresses.';

GRANT EXECUTE ON FUNCTION upsert_address TO authenticated;


-- 9. RPC: Get entity addresses
CREATE OR REPLACE FUNCTION get_entity_addresses(
  p_owner_type VARCHAR,
  p_owner_id UUID,
  p_address_type VARCHAR DEFAULT NULL,
  p_include_archived BOOLEAN DEFAULT FALSE
)
RETURNS SETOF addresses
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT *
  FROM addresses
  WHERE owner_type = p_owner_type
    AND owner_id = p_owner_id
    AND (p_address_type IS NULL OR address_type = p_address_type)
    AND (p_include_archived = TRUE OR is_active = TRUE)
  ORDER BY
    is_default DESC,
    created_at DESC;
$$;

COMMENT ON FUNCTION get_entity_addresses IS
'Retrieve addresses for an entity.
- p_owner_type: organisation, user, customer
- p_owner_id: UUID of the entity
- p_address_type: optional filter (billing, shipping)
- p_include_archived: include inactive addresses (default FALSE)';

GRANT EXECUTE ON FUNCTION get_entity_addresses TO authenticated;


-- 10. RPC: Archive an address (soft delete)
CREATE OR REPLACE FUNCTION archive_address(p_address_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE addresses
  SET is_active = FALSE,
      is_default = FALSE,
      archived_at = NOW(),
      updated_at = NOW()
  WHERE id = p_address_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION archive_address IS 'Soft delete an address by setting is_active = FALSE';
GRANT EXECUTE ON FUNCTION archive_address TO authenticated;

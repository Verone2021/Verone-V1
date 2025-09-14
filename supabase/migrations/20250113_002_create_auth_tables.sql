-- Migration: Create Auth Tables and Organisations
-- Phase 2: Core authentication and organisation tables
-- Depends on: 001_create_base_types (types already created)

-- Organisations table (SIMPLIFIED for MVP, EVOLUTIONARY for future)
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type organisation_type DEFAULT 'internal',

  -- Essential contact
  email VARCHAR(255),
  country VARCHAR(2) DEFAULT 'FR',

  -- Simple status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT org_slug_format CHECK (slug ~ '^[a-z0-9\-]+$'),
  CONSTRAINT org_name_length CHECK (length(name) >= 2)
);

-- NOTE: user_organisation_assignments REMOVED for MVP
-- Will be added in Phase 3 when needed for suppliers/customers

-- User profiles (simplified)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role_type NOT NULL,
  user_type user_type DEFAULT 'staff',
  scopes TEXT[] DEFAULT '{}',
  partner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add FK constraint to product_groups now that organisations exists
ALTER TABLE product_groups
ADD CONSTRAINT fk_product_groups_organisation
FOREIGN KEY (source_organisation_id) REFERENCES organisations(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organisations_slug ON organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisations_active ON organisations(is_active);
CREATE INDEX IF NOT EXISTS idx_organisations_type ON organisations(type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(user_type);
-- Migration: Create Organisations & Auth Structure
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organisation status enum
DO $$ BEGIN
  CREATE TYPE organisation_status_type AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User role enum (consolidated)
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('owner', 'admin', 'catalog_manager', 'sales', 'partner_manager');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  -- Contact & Legal
  email VARCHAR(255),
  phone VARCHAR(50),
  website TEXT,

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'FR',

  -- Business
  siret VARCHAR(14),
  vat_number VARCHAR(50),

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Status
  status organisation_status_type DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT org_slug_format CHECK (slug ~ '^[a-z0-9\-]+$'),
  CONSTRAINT org_name_length CHECK (length(name) >= 2)
);

-- User organisation assignments
CREATE TABLE IF NOT EXISTS user_organisation_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES auth.users(id),
  organisation_id UUID NOT NULL REFERENCES organisations(id),

  -- Role & Permissions
  role user_role_type NOT NULL,
  scopes TEXT[] DEFAULT '{}', -- ['security:manage', 'users:manage', etc.]

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(user_id, organisation_id)
);

-- User profiles (simplified)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role_type NOT NULL,
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

CREATE TRIGGER trigger_update_user_assignments_updated_at
  BEFORE UPDATE ON user_organisation_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organisations_slug ON organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisations_status ON organisations(status);
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON user_organisation_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_org ON user_organisation_assignments(organisation_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
-- Script d'application complète des migrations Vérone
-- À exécuter dans l'éditeur SQL de Supabase Dashboard

-- ============================================
-- MIGRATION 1: Catalogue Tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE product_status_type AS ENUM ('draft', 'active', 'inactive', 'discontinued');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE availability_status_type AS ENUM ('in_stock', 'out_of_stock', 'preorder', 'coming_soon', 'discontinued');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE package_type AS ENUM ('single', 'pack', 'bulk', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('owner', 'admin', 'catalog_manager', 'sales', 'partner_manager');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  level INTEGER DEFAULT 0 CHECK (level >= 0 AND level <= 5),

  -- External mappings for feeds
  google_category_id INTEGER,
  facebook_category VARCHAR(255),

  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table (core)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id),

  -- Basic info
  sku VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,

  -- Pricing (in cents)
  price_ht INTEGER NOT NULL CHECK (price_ht >= 0),
  price_ttc INTEGER GENERATED ALWAYS AS (price_ht * 120 / 100) STORED, -- 20% VAT
  cost_price INTEGER CHECK (cost_price >= 0),

  -- Status
  status product_status_type DEFAULT 'draft',
  availability_status availability_status_type DEFAULT 'in_stock',

  -- Images
  primary_image_url TEXT,
  image_urls TEXT[],

  -- Meta & SEO
  meta_title VARCHAR(255),
  meta_description TEXT,

  -- Business
  brand VARCHAR(255),
  manufacturer VARCHAR(255),
  origin_country VARCHAR(2) DEFAULT 'FR',

  -- Physical
  weight DECIMAL(10,3), -- kg
  dimensions JSONB, -- {length, width, height, unit}

  -- Packaging
  package_type package_type DEFAULT 'single',
  min_order_quantity INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MIGRATION 2: Auth & Organizations
-- ============================================

-- Organisation status enum
DO $$ BEGIN
  CREATE TYPE organisation_status_type AS ENUM ('active', 'inactive', 'suspended');
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

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User profiles extending auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),

  -- Business
  job_title VARCHAR(100),
  department VARCHAR(100),

  -- Settings
  preferences JSONB DEFAULT '{}',
  avatar_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User organisation assignments
CREATE TABLE IF NOT EXISTS user_organisation_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- Role and permissions
  role user_role_type NOT NULL,
  permissions JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(user_id, organisation_id)
);

-- ============================================
-- MIGRATION 3: RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organisation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role_type AS $$
BEGIN
  RETURN (
    SELECT role
    FROM user_organisation_assignments
    WHERE user_organisation_assignments.user_id = get_user_role.user_id
    AND is_active = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_organisation_id(user_id UUID DEFAULT auth.uid())
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_organisation_assignments.user_id = get_user_organisation_id.user_id
    AND is_active = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for organisations
CREATE POLICY "users_can_view_own_organisation" ON organisations
  FOR SELECT USING (
    id = get_user_organisation_id()
  );

-- RLS Policies for products
CREATE POLICY "users_can_view_products" ON products
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (status IN ('active') OR get_user_role() IN ('owner', 'admin', 'catalog_manager'))
  );

CREATE POLICY "catalog_managers_can_manage_products" ON products
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- RLS Policies for categories
CREATE POLICY "users_can_view_categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "catalog_managers_can_manage_categories" ON categories
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- ============================================
-- MIGRATION 4: Seed Data
-- ============================================

-- Insert default organisation
INSERT INTO organisations (id, name, slug, email, country, status)
VALUES (
  'a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e0',
  'Vérone',
  'verone',
  'veronebyromeo@gmail.com',
  'FR',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, display_order) VALUES
('Canapés', 'canapes', 1),
('Tables', 'tables', 2),
('Chaises', 'chaises', 3),
('Éclairage', 'eclairage', 4),
('Décoration', 'decoration', 5),
('Rangement', 'rangement', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify tables created
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organisations', 'user_profiles', 'user_organisation_assignments', 'categories', 'products')
ORDER BY tablename;
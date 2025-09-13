-- ============================================================================
-- VÉRONE BACK OFFICE - SCRIPT D'APPLICATION DES MIGRATIONS
-- ============================================================================
-- À exécuter dans l'ordre dans Supabase Dashboard > SQL Editor
-- OU via CLI Supabase : supabase migration up
-- ============================================================================

-- MIGRATION 1: CREATE_CATALOGUE_TABLES
-- Statut: À appliquer
-- Description: Tables catalogue de base + types + index

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

DO $$ BEGIN
  CREATE TYPE language_type AS ENUM ('fr', 'en', 'pt');
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
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT categories_no_self_parent CHECK (id != parent_id)
);

-- Product groups
CREATE TABLE IF NOT EXISTS product_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,

  -- Classification
  category_id UUID NOT NULL REFERENCES categories(id),
  brand VARCHAR(100),

  -- Status
  status product_status_type DEFAULT 'draft',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT product_groups_name_check CHECK (length(name) >= 2),
  CONSTRAINT product_groups_slug_check CHECK (slug ~ '^[a-z0-9\-]+$')
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,

  -- Unique identification
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,

  -- Pricing (in centimes for precision)
  price_ht INTEGER NOT NULL,
  cost_price INTEGER,
  tax_rate DECIMAL(4,4) DEFAULT 0.2000,

  -- Availability
  status availability_status_type DEFAULT 'in_stock',
  condition VARCHAR(20) DEFAULT 'new' CHECK (condition IN ('new', 'refurbished', 'used')),

  -- Attributes & Variants (JSONB for flexibility)
  variant_attributes JSONB DEFAULT '{}',
  dimensions JSONB,
  weight DECIMAL(8,2),

  -- Media
  primary_image_url TEXT NOT NULL,
  gallery_images TEXT[] DEFAULT '{}',
  video_url TEXT,

  -- External references
  supplier_reference VARCHAR(100),
  gtin VARCHAR(20),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Business constraints
  CONSTRAINT products_sku_format CHECK (sku ~ '^[A-Z0-9\-]+$'),
  CONSTRAINT products_price_positive CHECK (price_ht > 0),
  CONSTRAINT products_cost_positive CHECK (cost_price IS NULL OR cost_price > 0),
  CONSTRAINT products_weight_positive CHECK (weight IS NULL OR weight > 0),
  CONSTRAINT products_gtin_format CHECK (gtin IS NULL OR gtin ~ '^[0-9]+$')
);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role_type NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  partner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,

  -- Configuration
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Metadata
  season VARCHAR(100),
  style_tags TEXT[] DEFAULT '{}',

  -- Ownership
  created_by UUID NOT NULL REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Essential indexes
CREATE INDEX IF NOT EXISTS idx_product_groups_status ON product_groups(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ============================================================================
-- IMPORTANT: EXÉCUTER CETTE COMMANDE POUR VÉRIFIER QUE TOUT EST OK
-- ============================================================================
SELECT 'Migration 1 applied successfully!' as status;

-- Vérification des tables créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('categories', 'product_groups', 'products', 'user_profiles', 'collections')
ORDER BY table_name;
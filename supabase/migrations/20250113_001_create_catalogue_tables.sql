-- Migration: Create Base Types and Extensions
-- Phase 1: Foundation types and extensions needed by all other migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base types (used across all modules)
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('owner', 'admin', 'catalog_manager', 'sales', 'partner_manager');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('staff', 'supplier', 'customer', 'partner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE organisation_type AS ENUM ('internal', 'supplier', 'customer', 'partner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE language_type AS ENUM ('fr', 'en', 'pt');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Catalogue-specific types
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

-- Category translations
CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language language_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category_id, language)
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

  -- Traceability (Business Rules: all Vérone products have source_organisation_id = 1)
  source_organisation_id UUID, -- Will add FK constraint after organisations table is created
  created_by_type user_type DEFAULT 'staff',

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

-- Product packages (flexible packaging system)
CREATE TABLE IF NOT EXISTS product_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Package configuration
  name VARCHAR(100) NOT NULL,
  type package_type NOT NULL,
  
  -- Quantities
  base_quantity INTEGER NOT NULL DEFAULT 1,
  min_order_quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Pricing (exclusive: either discount_rate or unit_price_ht)
  discount_rate DECIMAL(4,4),
  unit_price_ht INTEGER,
  
  -- Metadata
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Business constraints
  CONSTRAINT pkg_quantity_positive CHECK (base_quantity > 0),
  CONSTRAINT pkg_moq_positive CHECK (min_order_quantity > 0),
  CONSTRAINT pkg_moq_logical CHECK (min_order_quantity <= base_quantity),
  CONSTRAINT pkg_discount_range CHECK (discount_rate IS NULL OR (discount_rate >= 0 AND discount_rate < 0.5)),
  CONSTRAINT pkg_price_positive CHECK (unit_price_ht IS NULL OR unit_price_ht > 0),
  CONSTRAINT pkg_pricing_exclusive CHECK (
    (discount_rate IS NULL AND unit_price_ht IS NULL) OR
    (discount_rate IS NOT NULL AND unit_price_ht IS NULL) OR
    (discount_rate IS NULL AND unit_price_ht IS NOT NULL)
  )
);

-- Product translations
CREATE TABLE IF NOT EXISTS product_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language language_type NOT NULL,
  
  -- Translated content
  name VARCHAR(255) NOT NULL,
  description TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Translated attributes
  variant_attributes JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(product_id, language)
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

-- Collection translations
CREATE TABLE IF NOT EXISTS collection_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  language language_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, language)
);

-- Collection products association
CREATE TABLE IF NOT EXISTS collection_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
  
  -- Organization
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, product_group_id)
);

-- Note: user_profiles table will be created in migration 002

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_groups_status ON product_groups(status);
CREATE INDEX IF NOT EXISTS idx_product_groups_category ON product_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_product_groups_source_org ON product_groups(source_organisation_id);
CREATE INDEX IF NOT EXISTS idx_product_groups_created_by_type ON product_groups(created_by_type);
CREATE INDEX IF NOT EXISTS idx_product_groups_created_at ON product_groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_group_id ON products(product_group_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_attrs ON products USING GIN(variant_attributes);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- Composite index for feeds
CREATE INDEX IF NOT EXISTS idx_products_feeds ON products(status, product_group_id) 
WHERE status IN ('in_stock', 'preorder', 'coming_soon');

CREATE INDEX IF NOT EXISTS idx_packages_product_id ON product_packages(product_id);
CREATE INDEX IF NOT EXISTS idx_packages_type ON product_packages(type);
CREATE INDEX IF NOT EXISTS idx_packages_active ON product_packages(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_packages_default ON product_packages(product_id, is_default) WHERE is_default = TRUE;

-- Unique constraint: one default package per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_unique_default 
ON product_packages(product_id) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_collections_creator ON collections(created_by);

CREATE INDEX IF NOT EXISTS idx_collection_products_coll ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_prod ON collection_products(product_group_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_order ON collection_products(collection_id, display_order);
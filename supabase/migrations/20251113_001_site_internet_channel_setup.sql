-- =====================================================
-- Migration: Canal Site Internet - Extensions Tables
-- =====================================================
-- Date: 2025-11-13
-- Description: Création canal site internet via extensions tables existantes
-- Approche: RÉUTILISATION 100% architecture Google Merchant (0 nouvelle table)
-- Author: Claude Code + Romeo Dos Santos

-- =====================================================
-- PARTIE 1: Extensions Table sales_channels
-- =====================================================

-- Ajouter colonnes configuration site web
ALTER TABLE sales_channels
  ADD COLUMN IF NOT EXISTS domain_url TEXT,
  ADD COLUMN IF NOT EXISTS site_name TEXT,
  ADD COLUMN IF NOT EXISTS site_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS default_meta_title TEXT,
  ADD COLUMN IF NOT EXISTS default_meta_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::JSONB;

-- Commentaires documentation
COMMENT ON COLUMN sales_channels.domain_url IS 'URL domaine site (ex: https://verone.fr)';
COMMENT ON COLUMN sales_channels.site_name IS 'Nom complet site (ex: Vérone - Mobilier & Décoration Design)';
COMMENT ON COLUMN sales_channels.site_logo_url IS 'URL logo site (Supabase Storage)';
COMMENT ON COLUMN sales_channels.default_meta_title IS 'Template meta title (ex: Vérone | {page})';
COMMENT ON COLUMN sales_channels.default_meta_description IS 'Meta description par défaut site (max 160 caractères)';
COMMENT ON COLUMN sales_channels.meta_keywords IS 'Array keywords SEO (ex: [mobilier, design, décoration])';
COMMENT ON COLUMN sales_channels.contact_email IS 'Email contact principal site';
COMMENT ON COLUMN sales_channels.contact_phone IS 'Téléphone contact principal site';
COMMENT ON COLUMN sales_channels.config IS 'Configuration extensible JSON (analytics, social_links, features, shipping)';

-- =====================================================
-- PARTIE 2: Extensions Table products
-- =====================================================

-- Ajouter colonnes SEO et publication
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS is_published_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS publication_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unpublication_date TIMESTAMPTZ;

-- Contrainte unicité slug (après génération automatique)
-- Note: Ajouté après génération slugs (migration 002) pour éviter erreur NULL
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_published_online
  ON products(is_published_online) WHERE is_published_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_publication_date
  ON products(publication_date) WHERE publication_date IS NOT NULL;

-- Commentaires documentation
COMMENT ON COLUMN products.slug IS 'URL-friendly identifier (ex: fauteuil-milo-velours-bleu-a3f4b2c8)';
COMMENT ON COLUMN products.meta_title IS 'SEO title par défaut (peut être override par channel_product_metadata)';
COMMENT ON COLUMN products.meta_description IS 'Meta description par défaut (peut être override par channel_product_metadata)';
COMMENT ON COLUMN products.is_published_online IS 'Visible sur site internet (indépendant product_status)';
COMMENT ON COLUMN products.publication_date IS 'Date publication produit site (optionnel)';
COMMENT ON COLUMN products.unpublication_date IS 'Date dépublication automatique (optionnel)';

-- =====================================================
-- PARTIE 3: Extensions Table collections
-- =====================================================

-- Ajouter visibilité par canal (optionnel - NULL = tous canaux)
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS visible_channels UUID[];

-- Index GIN pour array search performant
CREATE INDEX IF NOT EXISTS idx_collections_visible_channels
  ON collections USING GIN (visible_channels);

COMMENT ON COLUMN collections.visible_channels IS 'Array UUID canaux où collection visible (NULL = tous canaux, [] = aucun canal)';

-- =====================================================
-- PARTIE 4: Extensions Table categories
-- =====================================================

-- Vérifier si colonnes existent déjà (migration defensive)
DO $$
BEGIN
  -- meta_title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'categories'
      AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_title TEXT;
  END IF;

  -- meta_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'categories'
      AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_description TEXT;
  END IF;

  -- is_visible_menu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'categories'
      AND column_name = 'is_visible_menu'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_visible_menu BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

COMMENT ON COLUMN categories.meta_title IS 'SEO title catégorie (max 60 caractères)';
COMMENT ON COLUMN categories.meta_description IS 'Meta description catégorie (max 160 caractères)';
COMMENT ON COLUMN categories.is_visible_menu IS 'Visible dans menu navigation site internet';

-- Index performance
CREATE INDEX IF NOT EXISTS idx_categories_is_visible_menu
  ON categories(is_visible_menu) WHERE is_visible_menu = TRUE;

-- =====================================================
-- PARTIE 5: Renommer Canal ecommerce → site_internet
-- =====================================================

-- Renommer code + name (idempotent via WHERE)
UPDATE sales_channels
SET
  code = 'site_internet',
  name = 'Site Internet Vérone',
  description = 'E-commerce principal Vérone - Boutique en ligne haut de gamme mobilier & décoration',
  display_order = 1,
  icon_name = 'Globe'
WHERE code = 'ecommerce';

-- Si canal ecommerce n'existait pas, le créer
INSERT INTO sales_channels (
  code,
  name,
  description,
  is_active,
  display_order,
  icon_name,
  created_at,
  updated_at
)
SELECT
  'site_internet',
  'Site Internet Vérone',
  'E-commerce principal Vérone - Boutique en ligne haut de gamme mobilier & décoration',
  TRUE,
  1,
  'Globe',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM sales_channels WHERE code IN ('site_internet', 'ecommerce')
);

-- =====================================================
-- PARTIE 6: Configuration Initiale Canal Site Internet
-- =====================================================

-- UPDATE configuration site (idempotent)
UPDATE sales_channels
SET
  domain_url = COALESCE(domain_url, 'https://verone.fr'),
  site_name = COALESCE(site_name, 'Vérone - Mobilier & Décoration Design'),
  default_meta_title = COALESCE(default_meta_title, 'Vérone | {page}'),
  default_meta_description = COALESCE(
    default_meta_description,
    'Découvrez notre collection de mobilier et décoration design haut de gamme. Livraison France et Europe.'
  ),
  meta_keywords = COALESCE(
    meta_keywords,
    ARRAY['mobilier', 'décoration', 'design', 'haut de gamme', 'intérieur', 'contemporain']
  ),
  contact_email = COALESCE(contact_email, 'contact@verone.fr'),
  contact_phone = COALESCE(contact_phone, '+33 1 23 45 67 89'),
  config = COALESCE(
    config,
    jsonb_build_object(
      'analytics', jsonb_build_object(
        'vercel_enabled', true,
        'google_analytics_id', null,
        'google_tag_manager_id', null
      ),
      'social_links', jsonb_build_object(
        'instagram', 'https://instagram.com/verone',
        'facebook', null,
        'tiktok', null
      ),
      'features', jsonb_build_object(
        'enable_wishlist', true,
        'enable_reviews', true,
        'enable_live_chat', false
      ),
      'shipping', jsonb_build_object(
        'free_shipping_threshold', 500.00,
        'regions', jsonb_build_array('FR', 'BE', 'LU', 'CH')
      )
    )
  ),
  updated_at = NOW()
WHERE code = 'site_internet';

-- =====================================================
-- PARTIE 7: Vérifications finales
-- =====================================================

DO $$
DECLARE
  v_channel_exists BOOLEAN;
  v_channel_id UUID;
  v_products_count INTEGER;
  v_collections_count INTEGER;
  v_categories_count INTEGER;
BEGIN
  -- Vérifier canal site_internet créé/renommé
  SELECT EXISTS (
    SELECT 1 FROM sales_channels WHERE code = 'site_internet'
  ) INTO v_channel_exists;

  IF v_channel_exists THEN
    SELECT id INTO v_channel_id FROM sales_channels WHERE code = 'site_internet';
  END IF;

  -- Compter entités
  SELECT COUNT(*) INTO v_products_count FROM products;
  SELECT COUNT(*) INTO v_collections_count FROM collections;
  SELECT COUNT(*) INTO v_categories_count FROM categories;

  -- Rapport migration
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 001 terminée: Canal Site Internet';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '  - Canal site_internet: %', CASE WHEN v_channel_exists THEN '✅ CRÉÉ/RENOMMÉ' ELSE '❌ ERREUR' END;
  RAISE NOTICE '  - Canal ID: %', v_channel_id;
  RAISE NOTICE '';
  RAISE NOTICE '📊 COLONNES AJOUTÉES:';
  RAISE NOTICE '  - sales_channels: +9 colonnes (domain_url, site_name, config JSONB, etc.)';
  RAISE NOTICE '  - products: +6 colonnes (slug, meta_title, is_published_online, etc.)';
  RAISE NOTICE '  - collections: +1 colonne (visible_channels[])';
  RAISE NOTICE '  - categories: +3 colonnes (meta_title, meta_description, is_visible_menu)';
  RAISE NOTICE '';
  RAISE NOTICE '🗄️ ENTITÉS SYSTÈME:';
  RAISE NOTICE '  - Produits: % (slugs à générer via migration 002)', v_products_count;
  RAISE NOTICE '  - Collections: %', v_collections_count;
  RAISE NOTICE '  - Catégories: %', v_categories_count;
  RAISE NOTICE '';
  RAISE NOTICE '🏗️ ARCHITECTURE:';
  RAISE NOTICE '  - 0 NOUVELLE TABLE créée (100%% réutilisation existant)';
  RAISE NOTICE '  - Réutilise: channel_product_metadata, channel_pricing';
  RAISE NOTICE '  - Pattern: Identique Google Merchant (extensibilité)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Migration 002: Génération slugs automatiques (fonction slugify)';
  RAISE NOTICE '  2. Migration 003: Fonction RPC get_site_internet_products()';
  RAISE NOTICE '  3. Back-Office: Pages /canaux-vente/site-internet/*';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

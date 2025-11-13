-- =====================================================
-- SCRIPT SQL FUSIONNÉ : Canal Site Internet COMPLET
-- =====================================================
-- Date: 2025-11-13
-- Description: Fusion des 3 migrations site internet en 1 script
-- À exécuter via Supabase Dashboard > SQL Editor
-- Author: Claude Code + Romeo Dos Santos
--
-- MIGRATIONS FUSIONNÉES:
--   - 20251113_001_site_internet_channel_setup.sql
--   - 20251113_002b_generate_product_slugs.sql
--   - 20251113_003_site_internet_products_rpc.sql
--
-- INSTRUCTIONS:
--   1. Copier ce script complet
--   2. Aller sur https://supabase.com/dashboard > Votre projet
--   3. SQL Editor > New Query
--   4. Coller et exécuter
--   5. Vérifier les RAISE NOTICE dans l'output pour confirmer succès
-- =====================================================

BEGIN;

-- =====================================================
-- MIGRATION 001: Extensions Tables (19 colonnes)
-- =====================================================

-- Table: sales_channels (+9 colonnes)
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

-- Table: products (+6 colonnes)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS is_published_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS publication_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unpublication_date TIMESTAMPTZ;

-- Table: collections (+1 colonne)
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS visible_channels UUID[];

-- Table: categories (+3 colonnes avec protection)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_title TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE categories ADD COLUMN meta_description TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'is_visible_menu'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_visible_menu BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Indexes performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_published_online
  ON products(is_published_online) WHERE is_published_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_publication_date
  ON products(publication_date) WHERE publication_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_visible_channels
  ON collections USING GIN (visible_channels);
CREATE INDEX IF NOT EXISTS idx_categories_is_visible_menu
  ON categories(is_visible_menu) WHERE is_visible_menu = TRUE;

-- Renommer/créer canal site_internet
UPDATE sales_channels
SET
  code = 'site_internet',
  name = 'Site Internet Vérone',
  description = 'E-commerce principal Vérone - Boutique en ligne haut de gamme mobilier & décoration',
  display_order = 1,
  icon_name = 'Globe',
  updated_at = NOW()
WHERE code = 'ecommerce';

INSERT INTO sales_channels (
  code, name, description, is_active, display_order, icon_name, created_at, updated_at
)
SELECT
  'site_internet',
  'Site Internet Vérone',
  'E-commerce principal Vérone - Boutique en ligne haut de gamme mobilier & décoration',
  TRUE, 1, 'Globe', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM sales_channels WHERE code IN ('site_internet', 'ecommerce')
);

-- Configuration initiale canal
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
        'facebook', null
      ),
      'features', jsonb_build_object(
        'enable_wishlist', true,
        'enable_reviews', true
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
-- MIGRATION 002: Génération Slugs
-- =====================================================

-- Fonction slugify()
CREATE OR REPLACE FUNCTION slugify(text_input TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  result TEXT;
BEGIN
  result := LOWER(TRIM(text_input));
  result := TRANSLATE(result,
    'àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ',
    'aaaaaaeceeeeiiiinooooooouuuuyy'
  );
  result := REGEXP_REPLACE(result, '[^a-z0-9]+', '-', 'g');
  result := TRIM(BOTH '-' FROM result);
  result := SUBSTRING(result FROM 1 FOR 200);
  RETURN result;
END;
$$;

-- Générer slugs produits existants
UPDATE products
SET
  slug = slugify(name) || '-' || SUBSTRING(id::TEXT FROM 1 FOR 8),
  updated_at = NOW()
WHERE slug IS NULL;

-- Contrainte unique slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique
  ON products(slug) WHERE slug IS NOT NULL;

-- Trigger auto-génération slug
CREATE OR REPLACE FUNCTION trigger_generate_product_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    NEW.slug := slugify(NEW.name) || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_product_slug_on_insert ON products;
CREATE TRIGGER trg_generate_product_slug_on_insert
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_product_slug();

-- Fonction helper régénérer slug
CREATE OR REPLACE FUNCTION regenerate_product_slug(product_id_param UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  product_name TEXT;
  new_slug TEXT;
BEGIN
  SELECT name INTO product_name FROM products WHERE id = product_id_param;
  IF product_name IS NULL THEN
    RAISE EXCEPTION 'Produit % non trouvé', product_id_param;
  END IF;
  new_slug := slugify(product_name) || '-' || SUBSTRING(product_id_param::TEXT FROM 1 FOR 8);
  UPDATE products SET slug = new_slug, updated_at = NOW() WHERE id = product_id_param;
  RETURN new_slug;
END;
$$;

-- =====================================================
-- MIGRATION 003: Fonctions RPC
-- =====================================================

-- RPC: get_site_internet_products()
CREATE OR REPLACE FUNCTION get_site_internet_products()
RETURNS TABLE (
  product_id UUID, sku TEXT, name TEXT, slug TEXT, status TEXT,
  seo_title TEXT, seo_meta_description TEXT, metadata JSONB,
  price_ht NUMERIC, price_ttc NUMERIC, price_source TEXT,
  primary_image_url TEXT, image_urls TEXT[],
  is_published BOOLEAN, publication_date TIMESTAMPTZ,
  has_variants BOOLEAN, variants_count INTEGER,
  is_eligible BOOLEAN, ineligibility_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.sku, p.name, p.slug, p.status,
    COALESCE(cpm.custom_title, cpm.metadata->>'seo_title', p.meta_title, p.name) AS seo_title,
    COALESCE(cpm.custom_description, cpm.metadata->>'seo_meta_description', p.meta_description, LEFT(p.description, 160)) AS seo_meta_description,
    COALESCE(cpm.metadata, '{}'::JSONB) AS metadata,
    COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) AS price_ht,
    COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) * 1.20 AS price_ttc,
    CASE WHEN cp.custom_price_ht IS NOT NULL THEN 'channel_pricing' ELSE 'base_price' END AS price_source,
    (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1) AS primary_image_url,
    ARRAY(SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC) AS image_urls,
    p.is_published_online AS is_published,
    p.publication_date,
    EXISTS(SELECT 1 FROM variant_groups vg WHERE vg.product_id = p.id) AS has_variants,
    COALESCE((SELECT COUNT(*)::INTEGER FROM product_variants pv WHERE pv.variant_group_id IN (SELECT id FROM variant_groups WHERE product_id = p.id)), 0) AS variants_count,
    (p.status = 'active' AND p.is_published_online = TRUE AND p.slug IS NOT NULL AND COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) > 0 AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)) AS is_eligible,
    ARRAY(SELECT reason FROM (
      SELECT 'Produit inactif' AS reason WHERE p.status != 'active'
      UNION ALL SELECT 'Non publié en ligne' WHERE p.is_published_online = FALSE
      UNION ALL SELECT 'Slug manquant' WHERE p.slug IS NULL
      UNION ALL SELECT 'Prix manquant ou invalide' WHERE COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) IS NULL OR COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) <= 0
      UNION ALL SELECT 'Aucune image' WHERE NOT EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
    ) reasons) AS ineligibility_reasons
  FROM products p
  LEFT JOIN channel_product_metadata cpm ON cpm.product_id = p.id AND cpm.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
  LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet') AND cp.is_active = TRUE
  ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: get_site_internet_product_detail()
CREATE OR REPLACE FUNCTION get_site_internet_product_detail(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'product', (
      SELECT json_build_object(
        'id', p.id, 'sku', p.sku, 'name', p.name, 'slug', p.slug,
        'description', p.description, 'status', p.status,
        'is_published_online', p.is_published_online,
        'publication_date', p.publication_date,
        'seo_title', COALESCE(cpm.custom_title, cpm.metadata->>'seo_title', p.meta_title, p.name),
        'seo_meta_description', COALESCE(cpm.custom_description, cpm.metadata->>'seo_meta_description', p.meta_description, LEFT(p.description, 160)),
        'price_ht', COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)),
        'price_ttc', COALESCE(cp.custom_price_ht, (SELECT pli.price_ht FROM price_list_items pli JOIN price_lists pl ON pl.id = pli.price_list_id WHERE pli.product_id = p.id AND pli.is_active = TRUE AND pl.is_active = TRUE AND pl.list_type = 'base' ORDER BY pl.priority ASC LIMIT 1)) * 1.20,
        'images', (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'is_primary', pi.is_primary, 'display_order', pi.display_order) ORDER BY pi.display_order ASC) FROM product_images pi WHERE pi.product_id = p.id)
      )
      FROM products p
      LEFT JOIN channel_product_metadata cpm ON cpm.product_id = p.id AND cpm.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
      LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet') AND cp.is_active = TRUE
      WHERE p.id = p_product_id
    ),
    'variants', (
      SELECT json_agg(
        json_build_object(
          'variant_group_id', vg.id, 'group_name', vg.name, 'group_type', vg.variant_type,
          'variants', (SELECT json_agg(json_build_object('id', pv.id, 'sku', pv.sku, 'option_value', pv.option_value, 'price_ht', pv.price_ht, 'stock_quantity', pv.stock_quantity, 'is_active', pv.is_active, 'display_order', pv.display_order) ORDER BY pv.display_order ASC) FROM product_variants pv WHERE pv.variant_group_id = vg.id)
        )
      )
      FROM variant_groups vg WHERE vg.product_id = p_product_id
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: get_site_internet_config()
CREATE OR REPLACE FUNCTION get_site_internet_config()
RETURNS JSON AS $$
DECLARE
  v_config JSON;
BEGIN
  SELECT json_build_object(
    'id', id, 'code', code, 'name', name, 'description', description,
    'domain_url', domain_url, 'site_name', site_name, 'site_logo_url', site_logo_url,
    'default_meta_title', default_meta_title, 'default_meta_description', default_meta_description,
    'meta_keywords', meta_keywords, 'contact_email', contact_email, 'contact_phone', contact_phone,
    'config', config, 'is_active', is_active, 'created_at', created_at, 'updated_at', updated_at
  ) INTO v_config
  FROM sales_channels WHERE code = 'site_internet';
  RETURN v_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- =====================================================
-- RAPPORT FINAL
-- =====================================================

DO $$
DECLARE
  v_products_count INTEGER;
  v_products_with_slug INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_products_count FROM products;
  SELECT COUNT(*) INTO v_products_with_slug FROM products WHERE slug IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATIONS SITE INTERNET APPLIQUÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '  - Canal site_internet: ✅ CRÉÉ/CONFIGURÉ';
  RAISE NOTICE '  - Colonnes ajoutées: 19 (sales_channels +9, products +6, collections +1, categories +3)';
  RAISE NOTICE '  - Produits avec slug: % / % (%.0f%%)',
    v_products_with_slug, v_products_count,
    CASE WHEN v_products_count > 0 THEN (v_products_with_slug::FLOAT / v_products_count * 100) ELSE 0 END;
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FONCTIONS CRÉÉES:';
  RAISE NOTICE '  - slugify(text)';
  RAISE NOTICE '  - trigger_generate_product_slug()';
  RAISE NOTICE '  - regenerate_product_slug(uuid)';
  RAISE NOTICE '  - get_site_internet_products()';
  RAISE NOTICE '  - get_site_internet_product_detail(uuid)';
  RAISE NOTICE '  - get_site_internet_config()';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Régénérer types TypeScript: supabase gen types typescript --local';
  RAISE NOTICE '  2. Vérifier type-check: npm run type-check';
  RAISE NOTICE '  3. Tester UI: npm run dev → /canaux-vente/site-internet';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

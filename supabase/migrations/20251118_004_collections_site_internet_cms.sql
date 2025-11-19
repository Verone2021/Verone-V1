-- ================================================================================================
-- 🛍️ MIGRATION : Extensions Collections pour E-Commerce Site Internet
-- ================================================================================================
-- Version: 2.0
-- Date: 2025-11-18
-- Objectif: Ajouter TOUS les champs nécessaires pour CMS e-commerce collections
-- ================================================================================================

BEGIN;

-- ================================================================================================
-- ÉTAPE 1 : Table brands (Marques Collections)
-- ================================================================================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Données initiales brands
INSERT INTO brands (name, slug, description) VALUES
  ('Vérone Original', 'verone-original', 'Collections exclusives Vérone'),
  ('Maison du Monde', 'maison-du-monde', 'Marque partenaire mobilier et décoration'),
  ('Habitat', 'habitat', 'Marque partenaire design britannique'),
  ('IKEA', 'ikea', 'Marque partenaire mobilier accessible'),
  ('Autre', 'autre', 'Marque non référencée')
ON CONFLICT (slug) DO NOTHING;

-- Index brands
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

COMMENT ON TABLE brands IS 'Marques pour collections e-commerce (Maison du Monde, Habitat, etc.)';

-- ================================================================================================
-- ÉTAPE 2 : Enum Season (Saisons)
-- ================================================================================================

DO $$ BEGIN
  CREATE TYPE season_type AS ENUM ('spring', 'summer', 'autumn', 'winter', 'all_year');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE season_type IS 'Saisons collections (🌸 Printemps, 🌞 Été, 🍂 Automne, ❄️ Hiver, 📅 Toute saison)';

-- ================================================================================================
-- ÉTAPE 3 : Ajout Colonnes E-commerce à collections
-- ================================================================================================

ALTER TABLE collections
  -- 🔗 URL & SEO
  ADD COLUMN IF NOT EXISTS slug TEXT,

  -- 🚀 Publication
  ADD COLUMN IF NOT EXISTS is_published_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unpublication_date TIMESTAMPTZ,

  -- 🏷️ Taxonomie
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS season season_type DEFAULT 'all_year',
  ADD COLUMN IF NOT EXISTS event_tags TEXT[] DEFAULT '{}',

  -- 📊 Affichage
  ADD COLUMN IF NOT EXISTS sort_order_site INTEGER DEFAULT 100,

  -- 📝 Contenu E-commerce
  ADD COLUMN IF NOT EXISTS description_long TEXT,
  ADD COLUMN IF NOT EXISTS selling_points TEXT[] DEFAULT '{}';

-- ================================================================================================
-- ÉTAPE 4 : Indexes Performance
-- ================================================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_is_published_online ON collections(is_published_online) WHERE is_published_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_collections_brand_id ON collections(brand_id);
CREATE INDEX IF NOT EXISTS idx_collections_season ON collections(season);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order_site ON collections(sort_order_site);

-- Index composite pour requêtes site internet (performance)
CREATE INDEX IF NOT EXISTS idx_collections_site_internet_published
  ON collections(is_published_online, sort_order_site, publication_date)
  WHERE is_published_online = TRUE AND is_active = TRUE;

-- ================================================================================================
-- ÉTAPE 5 : Contraintes Business
-- ================================================================================================

-- Contrainte: slug doit être kebab-case (lowercase, tirets uniquement)
ALTER TABLE collections
  DROP CONSTRAINT IF EXISTS collections_slug_kebab_case;

ALTER TABLE collections
  ADD CONSTRAINT collections_slug_kebab_case
  CHECK (slug IS NULL OR slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Contrainte: selling_points max 5 items
ALTER TABLE collections
  DROP CONSTRAINT IF EXISTS collections_selling_points_max_5;

ALTER TABLE collections
  ADD CONSTRAINT collections_selling_points_max_5
  CHECK (array_length(selling_points, 1) IS NULL OR array_length(selling_points, 1) <= 5);

-- Contrainte: description_long max 2000 caractères (validation app-side aussi)
ALTER TABLE collections
  DROP CONSTRAINT IF EXISTS collections_description_long_max_length;

ALTER TABLE collections
  ADD CONSTRAINT collections_description_long_max_length
  CHECK (description_long IS NULL OR length(description_long) <= 2000);

-- ================================================================================================
-- ÉTAPE 6 : Trigger Auto-Generate Slug (si vide à l'insertion/update)
-- ================================================================================================

CREATE OR REPLACE FUNCTION auto_generate_collection_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Si slug vide ou null, générer depuis name
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    -- Générer base slug depuis name
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          unaccent(NEW.name),
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Retirer caractères spéciaux
        ),
        '\s+', '-', 'g'  -- Remplacer espaces par tirets
      )
    );

    -- Nettoyer tirets multiples/début/fin
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');

    final_slug := base_slug;

    -- Si slug existe déjà, ajouter suffixe numérique
    WHILE EXISTS (
      SELECT 1 FROM collections
      WHERE slug = final_slug
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS collections_auto_slug ON collections;
CREATE TRIGGER collections_auto_slug
  BEFORE INSERT OR UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION auto_generate_collection_slug();

-- ================================================================================================
-- ÉTAPE 7 : RLS Policies (Lecture publique pour site internet)
-- ================================================================================================

-- Policy: Lecture publique des collections publiées (pour site internet anon/auth)
DROP POLICY IF EXISTS "collections_public_select_published" ON collections;
CREATE POLICY "collections_public_select_published" ON collections
  FOR SELECT TO anon, authenticated
  USING (
    is_published_online = TRUE
    AND is_active = TRUE
    AND visibility = 'public'
    AND (unpublication_date IS NULL OR unpublication_date > now())
  );

-- Note: Policies admin/owner existantes (create/update/delete) restent inchangées

-- ================================================================================================
-- ÉTAPE 8 : RPC Function get_site_internet_collections()
-- ================================================================================================

CREATE OR REPLACE FUNCTION get_site_internet_collections()
RETURNS TABLE (
  collection_id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  description_long TEXT,
  selling_points TEXT[],

  -- Taxonomie
  brand_id UUID,
  brand_name TEXT,
  brand_logo TEXT,
  season season_type,
  event_tags TEXT[],

  -- Images
  cover_image_url TEXT,
  cover_image_alt TEXT,

  -- Métadonnées
  meta_title TEXT,
  meta_description TEXT,
  sort_order_site INTEGER,
  publication_date TIMESTAMPTZ,
  product_count INTEGER,

  -- Prix calculés
  min_price NUMERIC,
  max_price NUMERIC,

  -- Éligibilité
  is_eligible BOOLEAN,
  ineligibility_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS collection_id,
    c.name,
    c.slug,
    c.description,
    c.description_long,
    c.selling_points,

    -- Taxonomie
    c.brand_id,
    b.name AS brand_name,
    b.logo_url AS brand_logo,
    c.season,
    c.event_tags,

    -- Image primaire depuis collection_images
    ci.public_url AS cover_image_url,
    ci.alt_text AS cover_image_alt,

    -- Métadonnées
    c.meta_title,
    c.meta_description,
    c.sort_order_site,
    c.publication_date,
    c.product_count,

    -- Prix min/max calculés depuis produits
    (SELECT MIN(p.cost_price) FROM products p
     JOIN collection_products cp ON p.id = cp.product_id
     WHERE cp.collection_id = c.id AND p.product_status = 'active') AS min_price,

    (SELECT MAX(p.cost_price) FROM products p
     JOIN collection_products cp ON p.id = cp.product_id
     WHERE cp.collection_id = c.id AND p.product_status = 'active') AS max_price,

    -- Éligibilité (toutes conditions remplies)
    (
      c.is_active = TRUE
      AND c.is_published_online = TRUE
      AND c.slug IS NOT NULL
      AND ci.public_url IS NOT NULL
      AND c.product_count > 0
    ) AS is_eligible,

    -- Raisons inéligibilité
    ARRAY(
      SELECT reason FROM (
        SELECT 'Collection inactive' AS reason WHERE c.is_active = FALSE
        UNION ALL SELECT 'Non publiée en ligne' WHERE c.is_published_online = FALSE
        UNION ALL SELECT 'Slug manquant' WHERE c.slug IS NULL
        UNION ALL SELECT 'Image de couverture manquante' WHERE ci.public_url IS NULL
        UNION ALL SELECT 'Aucun produit' WHERE c.product_count = 0
      ) reasons
    ) AS ineligibility_reasons

  FROM collections c
  LEFT JOIN brands b ON c.brand_id = b.id
  LEFT JOIN collection_images ci ON c.id = ci.collection_id AND ci.is_primary = true
  WHERE c.is_active = TRUE
    AND c.is_published_online = TRUE
    AND (c.unpublication_date IS NULL OR c.unpublication_date > now())
  ORDER BY c.sort_order_site ASC, c.publication_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_site_internet_collections() IS
  'RPC: Récupère collections publiées site internet avec prix calculés et éligibilité';

-- ================================================================================================
-- ÉTAPE 9 : RPC Function get_site_internet_collection_detail(slug)
-- ================================================================================================

CREATE OR REPLACE FUNCTION get_site_internet_collection_detail(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'collection', (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'description', c.description,
        'description_long', c.description_long,
        'selling_points', c.selling_points,
        'cover_image_url', ci.public_url,
        'cover_image_alt', ci.alt_text,
        'brand', json_build_object('id', b.id, 'name', b.name, 'logo_url', b.logo_url),
        'season', c.season,
        'event_tags', c.event_tags,
        'product_count', c.product_count,
        'meta_title', c.meta_title,
        'meta_description', c.meta_description
      )
      FROM collections c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN collection_images ci ON c.id = ci.collection_id AND ci.is_primary = true
      WHERE c.slug = p_slug
        AND c.is_published_online = TRUE
        AND c.is_active = TRUE
    ),
    'products', (
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'sku', p.sku,
          'name', p.name,
          'slug', p.slug,
          'primary_image_url', (
            SELECT pi.url
            FROM product_images pi
            WHERE pi.product_id = p.id AND pi.is_primary = TRUE
            ORDER BY pi.display_order ASC
            LIMIT 1
          ),
          'price_ht', p.cost_price,
          'position', colp.position
        )
        ORDER BY colp.position ASC
      )
      FROM collection_products colp
      JOIN products p ON p.id = colp.product_id
      WHERE colp.collection_id = (SELECT id FROM collections WHERE slug = p_slug)
        AND p.product_status = 'active'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_site_internet_collection_detail(TEXT) IS
  'RPC: Détails collection + produits associés pour page /collections/[slug]';

-- ================================================================================================
-- ÉTAPE 10 : Commentaires Documentation
-- ================================================================================================

COMMENT ON COLUMN collections.slug IS 'URL-friendly unique identifier (kebab-case, auto-généré depuis name)';
COMMENT ON COLUMN collections.is_published_online IS 'Publication site internet (distinct de is_active back-office)';
COMMENT ON COLUMN collections.publication_date IS 'Date de première publication site internet';
COMMENT ON COLUMN collections.unpublication_date IS 'Date de dépublication automatique (optionnel)';
COMMENT ON COLUMN collections.brand_id IS 'Marque collection (FK brands, ex: Maison du Monde)';
COMMENT ON COLUMN collections.season IS 'Saison collection (spring|summer|autumn|winter|all_year)';
COMMENT ON COLUMN collections.event_tags IS 'Tags événements spéciaux (christmas, valentine, black_friday, etc.)';
COMMENT ON COLUMN collections.sort_order_site IS 'Ordre affichage site internet (0=top, 999=bottom)';
COMMENT ON COLUMN collections.description_long IS 'Description longue e-commerce (max 2000 char, markdown supporté)';
COMMENT ON COLUMN collections.selling_points IS 'Points de vente clés (max 5 bullet points)';

COMMIT;

-- ================================================================================================
-- ✅ MIGRATION TERMINÉE
-- ================================================================================================
-- Next steps:
-- 1. Régénérer types TypeScript : supabase gen types typescript --local
-- 2. Créer ManageSiteInternetCollectionModal.tsx (4 onglets)
-- 3. Créer hook use-collection-site-internet.ts
-- 4. Modifier page collections back-office (button "Site Internet")
-- ================================================================================================

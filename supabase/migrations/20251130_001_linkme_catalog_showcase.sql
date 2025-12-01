-- ============================================================================
-- Migration: LinkMe Catalogue Général et Collections Vitrines
-- Date: 2025-11-30
-- Description: Ajoute les tables pour le catalogue général LinkMe et les
--              collections vitrines publiques
-- ============================================================================

-- ============================================================================
-- 1. TABLE: linkme_catalog_products
-- Catalogue général des produits disponibles sur LinkMe
-- ============================================================================

CREATE TABLE IF NOT EXISTS linkme_catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Visibilité
  is_enabled BOOLEAN DEFAULT true,           -- Visible sur LinkMe (affiliés connectés)
  is_public_showcase BOOLEAN DEFAULT false,  -- Visible vitrine (visiteurs non connectés)

  -- Configuration marge affilié
  max_margin_rate NUMERIC(5,2) DEFAULT 20.00,      -- Plafond marge affilié (%)
  min_margin_rate NUMERIC(5,2) DEFAULT 0.00,       -- Marge minimum (%)
  suggested_margin_rate NUMERIC(5,2) DEFAULT 10.00, -- Marge suggérée (%)

  -- Metadata custom pour LinkMe
  custom_title TEXT,
  custom_description TEXT,
  custom_selling_points TEXT[],

  -- Commission LinkMe (override global)
  linkme_commission_rate NUMERIC(5,2),  -- NULL = utiliser défaut global

  -- Statistiques
  views_count INTEGER DEFAULT 0,
  selections_count INTEGER DEFAULT 0,  -- Nombre de sélections incluant ce produit

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte unique sur product_id
  UNIQUE(product_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_linkme_catalog_enabled
  ON linkme_catalog_products(is_enabled) WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_linkme_catalog_public
  ON linkme_catalog_products(is_public_showcase) WHERE is_public_showcase = true;

CREATE INDEX IF NOT EXISTS idx_linkme_catalog_featured
  ON linkme_catalog_products(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_linkme_catalog_product
  ON linkme_catalog_products(product_id);

CREATE INDEX IF NOT EXISTS idx_linkme_catalog_display_order
  ON linkme_catalog_products(display_order);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_linkme_catalog_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_linkme_catalog_products_updated_at ON linkme_catalog_products;
CREATE TRIGGER trigger_linkme_catalog_products_updated_at
  BEFORE UPDATE ON linkme_catalog_products
  FOR EACH ROW
  EXECUTE FUNCTION update_linkme_catalog_products_updated_at();

-- ============================================================================
-- 2. TABLE: linkme_showcase_collections
-- Collections vitrines thématiques pour visiteurs non connectés
-- ============================================================================

CREATE TABLE IF NOT EXISTS linkme_showcase_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Configuration
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Style/Layout
  layout_type TEXT DEFAULT 'grid' CHECK (layout_type IN ('grid', 'carousel', 'featured')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_linkme_showcase_collections_active
  ON linkme_showcase_collections(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_linkme_showcase_collections_slug
  ON linkme_showcase_collections(slug);

CREATE INDEX IF NOT EXISTS idx_linkme_showcase_collections_order
  ON linkme_showcase_collections(display_order);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_linkme_showcase_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_linkme_showcase_collections_updated_at ON linkme_showcase_collections;
CREATE TRIGGER trigger_linkme_showcase_collections_updated_at
  BEFORE UPDATE ON linkme_showcase_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_linkme_showcase_collections_updated_at();

-- ============================================================================
-- 3. TABLE: linkme_showcase_collection_items
-- Items des collections vitrines (produits dans une collection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS linkme_showcase_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES linkme_showcase_collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte unique: un produit ne peut être qu'une fois dans une collection
  UNIQUE(collection_id, product_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_linkme_showcase_items_collection
  ON linkme_showcase_collection_items(collection_id);

CREATE INDEX IF NOT EXISTS idx_linkme_showcase_items_product
  ON linkme_showcase_collection_items(product_id);

CREATE INDEX IF NOT EXISTS idx_linkme_showcase_items_order
  ON linkme_showcase_collection_items(collection_id, display_order);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE linkme_catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkme_showcase_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkme_showcase_collection_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- RLS: linkme_catalog_products
-- ----------------------------------------

-- Staff peut tout faire (back-office)
DROP POLICY IF EXISTS linkme_catalog_products_staff_all ON linkme_catalog_products;
CREATE POLICY linkme_catalog_products_staff_all ON linkme_catalog_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
    )
  );

-- Lecture publique pour produits enabled (affiliés connectés peuvent voir)
DROP POLICY IF EXISTS linkme_catalog_products_public_read ON linkme_catalog_products;
CREATE POLICY linkme_catalog_products_public_read ON linkme_catalog_products
  FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Lecture anon pour produits public_showcase (vitrine publique)
DROP POLICY IF EXISTS linkme_catalog_products_anon_read ON linkme_catalog_products;
CREATE POLICY linkme_catalog_products_anon_read ON linkme_catalog_products
  FOR SELECT
  TO anon
  USING (is_public_showcase = true AND is_enabled = true);

-- ----------------------------------------
-- RLS: linkme_showcase_collections
-- ----------------------------------------

-- Staff peut tout faire
DROP POLICY IF EXISTS linkme_showcase_collections_staff_all ON linkme_showcase_collections;
CREATE POLICY linkme_showcase_collections_staff_all ON linkme_showcase_collections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
    )
  );

-- Lecture publique pour collections actives
DROP POLICY IF EXISTS linkme_showcase_collections_public_read ON linkme_showcase_collections;
CREATE POLICY linkme_showcase_collections_public_read ON linkme_showcase_collections
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ----------------------------------------
-- RLS: linkme_showcase_collection_items
-- ----------------------------------------

-- Staff peut tout faire
DROP POLICY IF EXISTS linkme_showcase_collection_items_staff_all ON linkme_showcase_collection_items;
CREATE POLICY linkme_showcase_collection_items_staff_all ON linkme_showcase_collection_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
    )
  );

-- Lecture publique pour items de collections actives
DROP POLICY IF EXISTS linkme_showcase_collection_items_public_read ON linkme_showcase_collection_items;
CREATE POLICY linkme_showcase_collection_items_public_read ON linkme_showcase_collection_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_showcase_collections c
      WHERE c.id = collection_id AND c.is_active = true
    )
  );

-- ============================================================================
-- 5. RPC FUNCTIONS
-- ============================================================================

-- Fonction pour récupérer les produits du catalogue LinkMe (affiliés connectés)
CREATE OR REPLACE FUNCTION get_linkme_catalog_products_for_affiliate(p_affiliate_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  is_enabled BOOLEAN,
  is_public_showcase BOOLEAN,
  max_margin_rate NUMERIC,
  min_margin_rate NUMERIC,
  suggested_margin_rate NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  custom_selling_points TEXT[],
  linkme_commission_rate NUMERIC,
  views_count INTEGER,
  selections_count INTEGER,
  display_order INTEGER,
  is_featured BOOLEAN,
  -- Product fields
  product_name TEXT,
  product_reference TEXT,
  product_price_ht NUMERIC,
  product_image_url TEXT,
  product_stock_real NUMERIC,
  product_is_active BOOLEAN,
  product_family_name TEXT,
  product_category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lcp.id,
    lcp.product_id,
    lcp.is_enabled,
    lcp.is_public_showcase,
    lcp.max_margin_rate,
    lcp.min_margin_rate,
    lcp.suggested_margin_rate,
    lcp.custom_title,
    lcp.custom_description,
    lcp.custom_selling_points,
    lcp.linkme_commission_rate,
    lcp.views_count,
    lcp.selections_count,
    lcp.display_order,
    lcp.is_featured,
    p.name AS product_name,
    p.reference AS product_reference,
    p.price_ht AS product_price_ht,
    p.primary_image_url AS product_image_url,
    p.stock_real AS product_stock_real,
    p.is_active AS product_is_active,
    f.name AS product_family_name,
    c.name AS product_category_name
  FROM linkme_catalog_products lcp
  JOIN products p ON p.id = lcp.product_id
  LEFT JOIN families f ON f.id = p.family_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE lcp.is_enabled = true
    AND p.is_active = true
    AND p.stock_real > 0
  ORDER BY lcp.is_featured DESC, lcp.display_order ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les produits vitrine (visiteurs non connectés)
CREATE OR REPLACE FUNCTION get_linkme_showcase_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  max_margin_rate NUMERIC,
  suggested_margin_rate NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  custom_selling_points TEXT[],
  display_order INTEGER,
  is_featured BOOLEAN,
  -- Product fields
  product_name TEXT,
  product_reference TEXT,
  product_price_ht NUMERIC,
  product_image_url TEXT,
  product_family_name TEXT,
  product_category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lcp.id,
    lcp.product_id,
    lcp.max_margin_rate,
    lcp.suggested_margin_rate,
    lcp.custom_title,
    lcp.custom_description,
    lcp.custom_selling_points,
    lcp.display_order,
    lcp.is_featured,
    p.name AS product_name,
    p.reference AS product_reference,
    p.price_ht AS product_price_ht,
    p.primary_image_url AS product_image_url,
    f.name AS product_family_name,
    c.name AS product_category_name
  FROM linkme_catalog_products lcp
  JOIN products p ON p.id = lcp.product_id
  LEFT JOIN families f ON f.id = p.family_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE lcp.is_public_showcase = true
    AND lcp.is_enabled = true
    AND p.is_active = true
    AND p.stock_real > 0
  ORDER BY lcp.is_featured DESC, lcp.display_order ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les collections vitrines avec leurs produits
CREATE OR REPLACE FUNCTION get_linkme_showcase_collections_with_products()
RETURNS TABLE (
  collection_id UUID,
  collection_name TEXT,
  collection_slug TEXT,
  collection_description TEXT,
  collection_image_url TEXT,
  collection_layout_type TEXT,
  collection_display_order INTEGER,
  products JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS collection_id,
    c.name AS collection_name,
    c.slug AS collection_slug,
    c.description AS collection_description,
    c.image_url AS collection_image_url,
    c.layout_type AS collection_layout_type,
    c.display_order AS collection_display_order,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', COALESCE(lcp.custom_title, p.name),
          'reference', p.reference,
          'price_ht', p.price_ht,
          'image_url', p.primary_image_url,
          'max_margin_rate', lcp.max_margin_rate,
          'suggested_margin_rate', lcp.suggested_margin_rate,
          'display_order', ci.display_order
        ) ORDER BY ci.display_order
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) AS products
  FROM linkme_showcase_collections c
  LEFT JOIN linkme_showcase_collection_items ci ON ci.collection_id = c.id
  LEFT JOIN products p ON p.id = ci.product_id AND p.is_active = true AND p.stock_real > 0
  LEFT JOIN linkme_catalog_products lcp ON lcp.product_id = p.id AND lcp.is_enabled = true
  WHERE c.is_active = true
  GROUP BY c.id, c.name, c.slug, c.description, c.image_url, c.layout_type, c.display_order
  ORDER BY c.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

GRANT SELECT ON linkme_catalog_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON linkme_catalog_products TO authenticated;

GRANT SELECT ON linkme_showcase_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON linkme_showcase_collections TO authenticated;

GRANT SELECT ON linkme_showcase_collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON linkme_showcase_collection_items TO authenticated;

GRANT EXECUTE ON FUNCTION get_linkme_catalog_products_for_affiliate(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_showcase_products() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_showcase_collections_with_products() TO anon, authenticated;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE linkme_catalog_products IS 'Catalogue général des produits disponibles sur LinkMe - contrôle visibilité et marges';
COMMENT ON TABLE linkme_showcase_collections IS 'Collections vitrines thématiques pour visiteurs non connectés';
COMMENT ON TABLE linkme_showcase_collection_items IS 'Association produits-collections vitrines';

COMMENT ON COLUMN linkme_catalog_products.is_enabled IS 'Produit visible pour les affiliés connectés';
COMMENT ON COLUMN linkme_catalog_products.is_public_showcase IS 'Produit visible sur la vitrine publique (non connectés)';
COMMENT ON COLUMN linkme_catalog_products.max_margin_rate IS 'Plafond de marge que l''affilié peut appliquer (%)';
COMMENT ON COLUMN linkme_catalog_products.linkme_commission_rate IS 'Commission LinkMe pour ce produit (NULL = défaut global)';

COMMENT ON COLUMN linkme_showcase_collections.layout_type IS 'Type de layout: grid, carousel, ou featured';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

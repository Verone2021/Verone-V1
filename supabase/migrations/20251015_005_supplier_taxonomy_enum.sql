-- ============================================================================
-- Migration: Taxonomie Fournisseurs - ENUM supplier_segment_type
-- Date: 2025-10-15
-- Description: Implémente une taxonomie structurée pour classifier les
--              fournisseurs par segment stratégique (criticality matrix)
--              et par catégorie de produits vendus
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Créer ENUM pour supplier_segment
-- ============================================================================

-- Créer le type ENUM pour les segments fournisseurs
-- Basé sur best practices procurement (Criticality Matrix + Supplier Segmentation)
CREATE TYPE supplier_segment_type AS ENUM (
  'strategic',   -- Fournisseurs stratégiques: produits uniques, haute valeur, partenariats long-terme
  'preferred',   -- Fournisseurs préférés: qualité premium, fiabilité, 80% volume achats
  'approved',    -- Fournisseurs validés: qualité acceptable, utilisation ponctuelle, backup
  'commodity',   -- Fournisseurs commodité: produits standards, facilement remplaçables, prix compétitifs
  'artisan'      -- Artisans spécialisés: savoir-faire unique, production limitée, sur-mesure
);

COMMENT ON TYPE supplier_segment_type IS
'Segmentation stratégique des fournisseurs basée sur criticality matrix:
- strategic: Produits exclusifs, co-développement, partenariats stratégiques
- preferred: Fournisseurs privilégiés, qualité constante, relation long-terme
- approved: Fournisseurs validés mais utilisation ponctuelle
- commodity: Produits standards/génériques, multi-sourcing
- artisan: Savoir-faire artisanal unique, pièces exclusives';

-- ============================================================================
-- PARTIE 2: Convertir column supplier_segment existante en ENUM
-- ============================================================================

-- Backup des valeurs actuelles (si existantes)
-- Note: La column est actuellement VARCHAR(50) et probablement vide

-- Convertir la column en ENUM type
-- USING clause permet la conversion VARCHAR → ENUM
ALTER TABLE organisations
ALTER COLUMN supplier_segment TYPE supplier_segment_type
USING (
  CASE
    WHEN supplier_segment IS NULL THEN NULL
    WHEN supplier_segment = 'strategic' THEN 'strategic'::supplier_segment_type
    WHEN supplier_segment = 'preferred' THEN 'preferred'::supplier_segment_type
    WHEN supplier_segment = 'approved' THEN 'approved'::supplier_segment_type
    WHEN supplier_segment = 'commodity' THEN 'commodity'::supplier_segment_type
    WHEN supplier_segment = 'artisan' THEN 'artisan'::supplier_segment_type
    ELSE NULL  -- Valeurs non reconnues = NULL
  END
);

-- La column reste nullable (segments optionnels)
-- Valeur par défaut peut être ajoutée si besoin: DEFAULT 'approved'::supplier_segment_type

-- ============================================================================
-- PARTIE 3: Table de référence pour supplier_categories
-- ============================================================================

-- Créer table pour stocker les catégories de produits fournisseurs
-- Permet autocomplete UI + évolution taxonomie sans migration
CREATE TABLE IF NOT EXISTS supplier_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  label_fr VARCHAR(100) NOT NULL,
  label_en VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50), -- Nom de l'icône Lucide (ex: "Sofa", "Lamp")
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE supplier_categories IS
'Table de référence pour les catégories de produits vendus par les fournisseurs.
Utilisée pour autocomplete UI et classification multidimensionnelle.
Un fournisseur peut avoir plusieurs catégories (relation many-to-many possible).';

-- Index pour performance
CREATE INDEX idx_supplier_categories_active ON supplier_categories(is_active) WHERE is_active = true;
CREATE INDEX idx_supplier_categories_order ON supplier_categories(display_order, code);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_supplier_categories_updated_at
  BEFORE UPDATE ON supplier_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PARTIE 4: Insérer les catégories de base (taxonomie initiale)
-- ============================================================================

INSERT INTO supplier_categories (code, label_fr, label_en, description, icon_name, display_order) VALUES
  ('furniture_indoor', 'Mobilier intérieur', 'Indoor Furniture', 'Chaises, tables, canapés, armoires, bureaux', 'Sofa', 10),
  ('furniture_outdoor', 'Mobilier extérieur', 'Outdoor Furniture', 'Salons de jardin, transats, parasols', 'TreeDeciduous', 20),
  ('lighting', 'Luminaires & Éclairage', 'Lighting', 'Lampes, suspensions, appliques, lustres', 'Lamp', 30),
  ('textiles_fabrics', 'Textiles & Tissus', 'Textiles & Fabrics', 'Tissus ameublement, rideaux, coussins', 'Shirt', 40),
  ('decorative_objects', 'Objets décoratifs', 'Decorative Objects', 'Vases, sculptures, figurines, bougeoirs', 'Sparkles', 50),
  ('art_sculptures', 'Art & Sculptures', 'Art & Sculptures', 'Œuvres d''art, sculptures design', 'Paintbrush', 60),
  ('mirrors_frames', 'Miroirs & Cadres', 'Mirrors & Frames', 'Miroirs décoratifs, cadres photos/tableaux', 'Frame', 70),
  ('rugs_carpets', 'Tapis & Moquettes', 'Rugs & Carpets', 'Tapis décoratifs, runners, carpettes', 'Grid2x2', 80),
  ('wall_coverings', 'Revêtements muraux', 'Wall Coverings', 'Papiers peints, panneaux décoratifs', 'WallpaperRoll', 90),
  ('tableware', 'Arts de la table', 'Tableware', 'Vaisselle, couverts, verrerie premium', 'UtensilsCrossed', 100),
  ('hardware_accessories', 'Quincaillerie & Accessoires', 'Hardware & Accessories', 'Poignées, patères, fixations design', 'Wrench', 110),
  ('packaging_logistics', 'Emballage & Logistique', 'Packaging & Logistics', 'Emballages protecteurs, colis premium', 'Package', 120),
  ('raw_materials', 'Matières premières', 'Raw Materials', 'Bois, métaux, tissus bruts, composants', 'Package2', 130)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PARTIE 5: RLS Policies pour supplier_categories
-- ============================================================================

-- Enable RLS
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique pour tous les utilisateurs authentifiés
CREATE POLICY "Allow read supplier_categories for authenticated users"
ON supplier_categories FOR SELECT
TO authenticated
USING (true);

-- Policy: Seuls owner/admin peuvent modifier
CREATE POLICY "Allow write supplier_categories for owner/admin"
ON supplier_categories FOR ALL
TO authenticated
USING (get_user_role() = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))
WITH CHECK (get_user_role() = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]));

-- ============================================================================
-- PARTIE 6: Améliorer les indexes existants
-- ============================================================================

-- Drop index existant supplier_search (sera recréé avec ENUM)
DROP INDEX IF EXISTS idx_organisations_supplier_search;

-- Recréer avec ENUM type pour meilleure performance
CREATE INDEX idx_organisations_supplier_search_v2
ON organisations(type, supplier_segment, preferred_supplier, is_active)
WHERE type = 'supplier'::organisation_type;

-- Index pour filtrage par catégorie
CREATE INDEX idx_organisations_supplier_category
ON organisations(supplier_category)
WHERE supplier_category IS NOT NULL AND type = 'supplier'::organisation_type;

-- ============================================================================
-- Notes:
-- - supplier_segment est maintenant un ENUM (validation DB-level)
-- - supplier_category reste VARCHAR pour flexibilité (multi-catégories: "furniture_indoor,lighting")
-- - Table supplier_categories fournit les valeurs de référence pour autocomplete UI
-- - Index optimisés pour filtrage segment + category
-- - RLS policies permettent lecture publique, write admin uniquement
-- ============================================================================

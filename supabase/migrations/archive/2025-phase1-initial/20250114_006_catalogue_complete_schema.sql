-- Migration Catalogue Vérone : Schema Complet + Airtable Mapping
-- Version 1.0 - 14 Janvier 2025
-- Basé sur ERD manifests + structure Airtable existante (248 produits)

-- =====================================================
-- 1. TYPES & ENUMS
-- =====================================================

-- Statuts produits (mapping Airtable "Statut")
CREATE TYPE product_status_type AS ENUM (
    'draft',           -- Brouillon
    'active',          -- Actif
    'inactive',        -- Inactif
    'discontinued',    -- Discontinué
    'in_stock',        -- En stock (Airtable)
    'out_of_stock',    -- Rupture stock
    'preorder',        -- Sur commande
    'coming_soon'      -- Arrivage prévu
);

-- Types de conditionnement (business rules)
CREATE TYPE package_type AS ENUM (
    'single',          -- Unité (par défaut)
    'pack',            -- Pack prédéfini
    'bulk',            -- Vrac/Palette
    'custom'           -- Sur mesure
);

-- Types d'achat (mapping Airtable "Type achat")
CREATE TYPE purchase_type AS ENUM (
    'dropshipping',    -- Drop shipping
    'stock',           -- Stock physique
    'on_demand'        -- Sur commande
);

-- =====================================================
-- 2. TABLES HIÉRARCHIE CATÉGORIES
-- =====================================================

-- Familles (niveau 1) - Ex: Mobilier, Décoration, Éclairage
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- SEO & Marketing
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Contraintes
    CONSTRAINT families_name_length CHECK (length(name) >= 2),
    CONSTRAINT families_slug_format CHECK (slug ~ '^[a-z0-9\-]+$')
);

-- Catégories (niveau 2) - Ex: Vases, Coussins, Chaises
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Mappings externes pour feeds
    google_category_id INTEGER,
    facebook_category VARCHAR(255),

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes
    UNIQUE(family_id, slug),
    CONSTRAINT categories_name_length CHECK (length(name) >= 2)
);

-- Sous-catégories (niveau 3) - Ex: Vases céramique, Coussins décoratifs
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes
    UNIQUE(category_id, slug),
    CONSTRAINT subcategories_name_length CHECK (length(name) >= 2)
);

-- =====================================================
-- 3. TABLES FOURNISSEURS
-- =====================================================

-- Fournisseurs (mapping Airtable "Fournisseur")
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,

    -- Contact (structure flexible)
    contact_info JSONB DEFAULT '{}', -- {email, phone, address, website, contact_person}

    -- Conditions commerciales
    payment_terms VARCHAR(100),      -- "30 jours fin de mois"
    delivery_time_days INTEGER,      -- Délai livraison moyen
    minimum_order_amount DECIMAL(10,2), -- MOQ en euros
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Performance & Notes
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5), -- Note /5
    notes TEXT,                      -- Notes internes

    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    is_preferred BOOLEAN DEFAULT FALSE, -- Fournisseur privilégié

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 4. TABLES PRODUITS CORE
-- =====================================================

-- Groupes de produits (variantes regroupées)
CREATE TABLE product_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    name VARCHAR(255) NOT NULL,              -- "Vase Côme" (base commune)
    description TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,       -- URL-friendly

    -- Classification
    subcategory_id UUID REFERENCES subcategories(id), -- Lien hiérarchie

    -- Brand & Origine
    brand VARCHAR(100) DEFAULT 'Vérone',     -- Marque
    supplier_id UUID REFERENCES suppliers(id),

    -- Statut & Visibilité
    status product_status_type DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,       -- Produit vedette

    -- SEO & URLs
    meta_title VARCHAR(255),
    meta_description TEXT,
    canonical_url TEXT,                      -- URL canonique externe

    -- Organisation
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    organisation_id UUID REFERENCES organisations(id),

    -- Contraintes business
    CONSTRAINT product_groups_name_length CHECK (length(name) >= 2),
    CONSTRAINT product_groups_slug_format CHECK (slug ~ '^[a-z0-9\-]+$')
);

-- Produits individuels (variantes spécifiques)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,

    -- Identification unique
    sku VARCHAR(100) NOT NULL UNIQUE,        -- "VER-VAS-COM-BLA-001"
    internal_ref VARCHAR(100),               -- Airtable "Ref interne" (8001)
    supplier_ref VARCHAR(100),               -- Airtable "Ref fournisseur" (013987)

    -- Nom complet avec variante
    name VARCHAR(255) NOT NULL,              -- "Vase Côme Blanc"
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    -- Prix & Coûts (en centimes pour précision)
    cost_price_cents INTEGER,               -- Airtable "Prix achat HT" × 100
    selling_price_ht_cents INTEGER NOT NULL, -- Prix vente HT × 100
    selling_price_ttc_cents INTEGER,        -- Prix TTC calculé
    tax_rate DECIMAL(4,4) DEFAULT 0.2000,   -- Taux TVA

    -- Variantes & Attributs (mapping Airtable "Couleur", "Matières")
    variant_attributes JSONB DEFAULT '{}',   -- {color: "Blanc", material: "Céramique", size: "M"}

    -- Dimensions & Poids (mapping Airtable "Dimension", "Kg")
    dimensions JSONB,                        -- {length: 14, width: 5, height: 21, unit: "cm"}
    weight_kg DECIMAL(8,3),                  -- 0.630 kg

    -- Images (migration depuis Airtable "Image" + "Google drive")
    primary_image_url TEXT NOT NULL,         -- Image principale obligatoire
    gallery_images TEXT[] DEFAULT '{}',      -- Array URLs images additionnelles
    google_drive_folder_url TEXT,            -- Lien dossier Google Drive

    -- Stock & Disponibilité
    stock_quantity INTEGER DEFAULT 0,
    stock_alert_threshold INTEGER DEFAULT 5, -- Airtable "Seuil d'alerte"
    moq INTEGER DEFAULT 1,                   -- Airtable "MOQ"

    -- Statut & Disponibilité
    status product_status_type DEFAULT 'draft',
    availability_status VARCHAR(50),         -- Statut détaillé

    -- Informations produit (mapping champs Airtable)
    unit_type VARCHAR(50) DEFAULT 'piece',   -- Airtable "Unité"
    purchase_type purchase_type,             -- Airtable "Type achat"
    external_url TEXT,                       -- Airtable "URL" (lien fournisseur)

    -- Marketing & Canaux (mapping Airtable "Canaux de Vente et Prix")
    sales_channels JSONB DEFAULT '{}',       -- Configuration canaux vente
    whatsapp_enabled BOOLEAN DEFAULT FALSE,  -- Airtable "Whatsapp ?"

    -- Validation workflow (mapping Airtable validations)
    sample_validated BOOLEAN DEFAULT FALSE,  -- "Validation Échantillon"
    sourcing_validated BOOLEAN DEFAULT FALSE, -- "Validation Sourcing"

    -- Classification secondaire (mapping Airtable "Pièces habitation")
    room_types TEXT[] DEFAULT '{}',          -- ["salon", "chambre", "cuisine"]

    -- Références externes
    gtin VARCHAR(20),                        -- Code-barres EAN13/UPC
    airtable_record_id VARCHAR(50),          -- ID original Airtable (pour migration)

    -- Organisation & RLS
    organisation_id UUID REFERENCES organisations(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Contraintes business
    CONSTRAINT products_sku_format CHECK (sku ~ '^[A-Z0-9\-]+$'),
    CONSTRAINT products_selling_price_positive CHECK (selling_price_ht_cents > 0),
    CONSTRAINT products_cost_price_positive CHECK (cost_price_cents IS NULL OR cost_price_cents > 0),
    CONSTRAINT products_weight_positive CHECK (weight_kg IS NULL OR weight_kg > 0),
    CONSTRAINT products_moq_positive CHECK (moq > 0),
    CONSTRAINT products_stock_non_negative CHECK (stock_quantity >= 0)
);

-- =====================================================
-- 5. CONDITIONNEMENTS & PACKAGES
-- =====================================================

-- Packages produits (conditionnements flexibles selon business rules)
CREATE TABLE product_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Configuration package
    name VARCHAR(100) NOT NULL,              -- "Pack 4 vases", "Unité", "Palette 50"
    type package_type NOT NULL,
    description TEXT,

    -- Quantités
    base_quantity INTEGER NOT NULL DEFAULT 1, -- Nb unités dans package
    min_order_quantity INTEGER NOT NULL DEFAULT 1, -- MOQ pour ce package
    max_order_quantity INTEGER,              -- Limite max (optionnel)

    -- Pricing (exclusif : discount OU prix fixe)
    discount_rate DECIMAL(5,4),              -- Remise (0.1500 = 15%)
    unit_price_ht_cents INTEGER,             -- Prix unitaire spécifique × 100

    -- Configuration
    is_default BOOLEAN DEFAULT FALSE,        -- Package par défaut (1 par produit)
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,

    -- GTIN spécifique package (business rules)
    gtin_package VARCHAR(20),                -- GTIN-14 avec indicateur

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes business
    CONSTRAINT pkg_quantity_positive CHECK (base_quantity > 0),
    CONSTRAINT pkg_moq_positive CHECK (min_order_quantity > 0),
    CONSTRAINT pkg_moq_logical CHECK (min_order_quantity <= base_quantity),
    CONSTRAINT pkg_max_logical CHECK (max_order_quantity IS NULL OR max_order_quantity >= base_quantity),
    CONSTRAINT pkg_discount_range CHECK (discount_rate IS NULL OR (discount_rate >= 0 AND discount_rate < 0.5)),
    CONSTRAINT pkg_price_positive CHECK (unit_price_ht_cents IS NULL OR unit_price_ht_cents > 0),
    CONSTRAINT pkg_pricing_exclusive CHECK (
        (discount_rate IS NULL AND unit_price_ht_cents IS NULL) OR  -- Auto pricing
        (discount_rate IS NOT NULL AND unit_price_ht_cents IS NULL) OR  -- Discount
        (discount_rate IS NULL AND unit_price_ht_cents IS NOT NULL)     -- Fixed price
    )
);

-- =====================================================
-- 6. COLLECTIONS & CATALOGUES
-- =====================================================

-- Collections (catalogues partagés)
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,

    -- Partage & Visibilité
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255) UNIQUE,         -- Token sécurisé pour partage

    -- Configuration partage (JSONB flexible)
    share_config JSONB DEFAULT '{}',         -- {expires_at, password, show_prices, client_type}

    -- Branding personnalisé (pour catalogues clients)
    branding_config JSONB DEFAULT '{}',      -- {logo_url, colors, client_name, custom_header}

    -- Métadonnées
    season VARCHAR(100),                     -- "Automne 2024", "Collection Printemps"
    style_tags TEXT[] DEFAULT '{}',          -- ["moderne", "minimaliste", "boheme"]
    target_audience VARCHAR(50),             -- "particuliers", "professionnels", "both"

    -- Analytics
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,

    -- Organisation & Propriété
    created_by UUID NOT NULL REFERENCES auth.users(id),
    organisation_id UUID REFERENCES organisations(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes
    UNIQUE(organisation_id, slug)
);

-- Liaison Collections ↔ Groupes Produits
CREATE TABLE collection_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,

    -- Organisation dans collection
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,       -- Produit vedette de la collection

    -- Personnalisation dans collection
    custom_name VARCHAR(255),                -- Nom personnalisé dans cette collection
    custom_description TEXT,                 -- Description spécifique collection
    custom_price_override INTEGER,           -- Prix override pour cette collection (centimes)

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes
    UNIQUE(collection_id, product_group_id)
);

-- =====================================================
-- 7. INDEX PERFORMANCE
-- =====================================================

-- Index familles/catégories/sous-catégories
CREATE INDEX idx_families_active ON families(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_categories_family ON categories(family_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_subcategories_active ON subcategories(is_active) WHERE is_active = TRUE;

-- Index fournisseurs
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_suppliers_preferred ON suppliers(is_preferred) WHERE is_preferred = TRUE;

-- Index product_groups
CREATE INDEX idx_product_groups_status ON product_groups(status);
CREATE INDEX idx_product_groups_subcategory ON product_groups(subcategory_id);
CREATE INDEX idx_product_groups_supplier ON product_groups(supplier_id);
CREATE INDEX idx_product_groups_featured ON product_groups(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_product_groups_organisation ON product_groups(organisation_id);
CREATE INDEX idx_product_groups_created ON product_groups(created_at DESC);

-- Index products (critiques pour performance)
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_internal_ref ON products(internal_ref);
CREATE INDEX idx_products_supplier_ref ON products(supplier_ref);
CREATE INDEX idx_products_group ON products(product_group_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_organisation ON products(organisation_id);
CREATE INDEX idx_products_airtable_id ON products(airtable_record_id); -- Pour migration
CREATE INDEX idx_products_variant_attrs ON products USING GIN(variant_attributes);
CREATE INDEX idx_products_updated ON products(updated_at DESC);

-- Index composé pour feeds (performance critique)
CREATE INDEX idx_products_feeds_export ON products(status, product_group_id, organisation_id)
WHERE status IN ('active', 'in_stock', 'preorder');

-- Index packages
CREATE INDEX idx_packages_product ON product_packages(product_id);
CREATE INDEX idx_packages_type ON product_packages(type);
CREATE INDEX idx_packages_active ON product_packages(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_packages_default ON product_packages(product_id, is_default) WHERE is_default = TRUE;

-- Contrainte unique : un seul package par défaut par produit
CREATE UNIQUE INDEX idx_packages_unique_default
ON product_packages(product_id) WHERE is_default = TRUE;

-- Index collections
CREATE INDEX idx_collections_public ON collections(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_collections_featured ON collections(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_collections_creator ON collections(created_by);
CREATE INDEX idx_collections_organisation ON collections(organisation_id);
CREATE INDEX idx_collections_share_token ON collections(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_collections_updated ON collections(updated_at DESC);

-- Index collection_products
CREATE INDEX idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX idx_collection_products_product ON collection_products(product_group_id);
CREATE INDEX idx_collection_products_order ON collection_products(collection_id, display_order);

-- =====================================================
-- 8. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction : mise à jour timestamp automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application triggers updated_at
CREATE TRIGGER trigger_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subcategories_updated_at
    BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_product_groups_updated_at
    BEFORE UPDATE ON product_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_product_packages_updated_at
    BEFORE UPDATE ON product_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 9. FONCTIONS BUSINESS
-- =====================================================

-- Fonction : calcul prix TTC
CREATE OR REPLACE FUNCTION calculate_price_ttc(price_ht_cents INTEGER, tax_rate DECIMAL)
RETURNS INTEGER AS $$
BEGIN
    RETURN ROUND(price_ht_cents * (1 + tax_rate));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction : calcul prix package
CREATE OR REPLACE FUNCTION calculate_package_price(
    base_price_ht_cents INTEGER,
    base_quantity INTEGER,
    discount_rate DECIMAL DEFAULT NULL,
    unit_price_override_cents INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
    -- Prix fixe défini
    IF unit_price_override_cents IS NOT NULL THEN
        RETURN unit_price_override_cents * base_quantity;
    END IF;

    -- Prix avec remise
    IF discount_rate IS NOT NULL THEN
        RETURN ROUND(base_price_ht_cents * base_quantity * (1 - discount_rate));
    END IF;

    -- Prix automatique (sans remise)
    RETURN base_price_ht_cents * base_quantity;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction : génération SKU automatique
CREATE OR REPLACE FUNCTION generate_sku(
    family_code VARCHAR(3),
    product_code VARCHAR(3),
    color_code VARCHAR(3),
    material_code VARCHAR(3),
    size_code VARCHAR DEFAULT NULL
)
RETURNS VARCHAR(20) AS $$
DECLARE
    sku VARCHAR(20);
BEGIN
    sku := UPPER(family_code || '-' || product_code || '-' || color_code || '-' || material_code);

    IF size_code IS NOT NULL THEN
        sku := sku || '-' || UPPER(size_code);
    END IF;

    RETURN sku;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS sur toutes les tables principales
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

-- Fonction helper : récupérer rôle utilisateur
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()),
    'guest'::TEXT
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Fonction helper : vérifier appartenance organisation
CREATE OR REPLACE FUNCTION user_belongs_to_organisation(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organisation_assignments
    WHERE user_id = auth.uid() AND organisation_id = org_id
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Policies principales (templates - à adapter selon besoins)

-- Politique générale : accès selon rôle et organisation
CREATE POLICY "catalogue_access" ON product_groups
  FOR ALL USING (
    -- Rôles avec accès complet
    get_user_role() IN ('owner', 'admin', 'catalog_manager') OR
    -- Ou membre de l'organisation
    user_belongs_to_organisation(organisation_id) OR
    -- Ou produits publics pour sales
    (get_user_role() = 'sales' AND status = 'active')
  );

CREATE POLICY "products_access" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_groups pg
      WHERE pg.id = product_group_id
      AND (
        get_user_role() IN ('owner', 'admin', 'catalog_manager') OR
        user_belongs_to_organisation(pg.organisation_id) OR
        (get_user_role() = 'sales' AND pg.status = 'active' AND status IN ('active', 'in_stock', 'preorder'))
      )
    )
  );

-- Collections : créateur + admins + public selon configuration
CREATE POLICY "collections_access" ON collections
  FOR ALL USING (
    created_by = auth.uid() OR
    get_user_role() IN ('owner', 'admin') OR
    user_belongs_to_organisation(organisation_id) OR
    (is_public = true AND auth.role() IS NOT NULL)
  );

-- =====================================================
-- 11. DONNÉES SEED INITIALES
-- =====================================================

-- Familles par défaut
INSERT INTO families (name, slug, description, sort_order) VALUES
('Décoration', 'decoration', 'Articles décoratifs et accessoires', 1),
('Mobilier', 'mobilier', 'Meubles et mobilier d''intérieur', 2),
('Éclairage', 'eclairage', 'Luminaires et éclairage décoratif', 3),
('Textile', 'textile', 'Coussins, rideaux et textiles d''ameublement', 4);

-- Catégories par défaut pour Décoration
INSERT INTO categories (family_id, name, slug, description, sort_order, google_category_id)
SELECT f.id, 'Vases', 'vases', 'Vases et contenants décoratifs', 1, 696
FROM families f WHERE f.slug = 'decoration';

INSERT INTO categories (family_id, name, slug, description, sort_order, google_category_id)
SELECT f.id, 'Accessoires', 'accessoires', 'Accessoires et objets déco', 2, 696
FROM families f WHERE f.slug = 'decoration';

-- Catégories pour Textile
INSERT INTO categories (family_id, name, slug, description, sort_order, google_category_id)
SELECT f.id, 'Coussins', 'coussins', 'Coussins décoratifs', 1, 3394
FROM families f WHERE f.slug = 'textile';

-- Sous-catégories pour Vases
INSERT INTO subcategories (category_id, name, slug, description, sort_order)
SELECT c.id, 'Vases céramique', 'vases-ceramique', 'Vases en céramique et terre cuite', 1
FROM categories c WHERE c.slug = 'vases';

INSERT INTO subcategories (category_id, name, slug, description, sort_order)
SELECT c.id, 'Vases verre', 'vases-verre', 'Vases en verre et cristal', 2
FROM categories c WHERE c.slug = 'vases';

-- Sous-catégories pour Coussins
INSERT INTO subcategories (category_id, name, slug, description, sort_order)
SELECT c.id, 'Coussins décoratifs', 'coussins-decoratifs', 'Coussins d''ornement et décoration', 1
FROM categories c WHERE c.slug = 'coussins';

-- Fournisseur par défaut (mapping Airtable "6 - Opjet")
INSERT INTO suppliers (name, contact_info, payment_terms, delivery_time_days, is_active, is_preferred) VALUES
('Opjet',
 '{"website": "https://www.opjet.com", "email": "contact@opjet.com", "phone": "+33 1 XX XX XX XX"}',
 '30 jours fin de mois',
 7,
 true,
 true);

-- =====================================================
-- COMMENTAIRES & DOCUMENTATION
-- =====================================================

COMMENT ON TABLE families IS 'Familles produits niveau 1 - grandes divisions du catalogue';
COMMENT ON TABLE categories IS 'Catégories niveau 2 - sections principales par famille';
COMMENT ON TABLE subcategories IS 'Sous-catégories niveau 3 - classification fine des produits';
COMMENT ON TABLE suppliers IS 'Fournisseurs et partenaires commerciaux';
COMMENT ON TABLE product_groups IS 'Groupes de produits regroupant les variantes';
COMMENT ON TABLE products IS 'Produits individuels avec variantes spécifiques';
COMMENT ON TABLE product_packages IS 'Conditionnements flexibles par produit';
COMMENT ON TABLE collections IS 'Collections et catalogues partagés';
COMMENT ON TABLE collection_products IS 'Association produits-collections avec personnalisation';

COMMENT ON COLUMN products.cost_price_cents IS 'Prix achat HT en centimes (mapping Airtable Prix achat HT indicatif)';
COMMENT ON COLUMN products.internal_ref IS 'Référence interne (mapping Airtable Ref interne)';
COMMENT ON COLUMN products.supplier_ref IS 'Référence fournisseur (mapping Airtable Ref fournisseur)';
COMMENT ON COLUMN products.variant_attributes IS 'Attributs variantes JSON (mapping Couleur, Matières)';
COMMENT ON COLUMN products.dimensions IS 'Dimensions produit JSON (mapping Dimension)';
COMMENT ON COLUMN products.weight_kg IS 'Poids en kg (mapping Kg)';
COMMENT ON COLUMN products.stock_alert_threshold IS 'Seuil alerte stock (mapping Seuil d''alerte)';
COMMENT ON COLUMN products.airtable_record_id IS 'ID record Airtable original pour migration';

-- =====================================================
-- FIN MIGRATION
-- =====================================================

-- Log de migration
INSERT INTO public.migration_logs (migration_name, status, details) VALUES (
  '20250114_006_catalogue_complete_schema',
  'completed',
  'Schema catalogue complet créé : 9 tables principales, 24 index, RLS, fonctions business, données seed'
) ON CONFLICT DO NOTHING;
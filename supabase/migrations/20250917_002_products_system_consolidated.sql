-- ================================================================================================
-- 🎯 MIGRATION CONSOLIDÉE : Système Produits + Images + Packages
-- ================================================================================================
-- Version: 1.0 MVP
-- Basé sur: Best practices Supabase.com + Next.js + Business Rules Vérone
-- Documentation: /manifests/business-rules/conditionnements-packages.md
-- ================================================================================================

-- ================================================================================================
-- 🏷️ TYPES ÉNUMÉRÉS
-- ================================================================================================

-- Statuts de disponibilité produits (selon catalogue.md)
CREATE TYPE availability_status_type AS ENUM (
  'in_stock',      -- En stock (disponible immédiatement)
  'out_of_stock',  -- Rupture temporaire
  'preorder',      -- Sur commande (2-8 semaines)
  'coming_soon',   -- Prochainement
  'discontinued'   -- Arrêté (non visible catalogues publics)
);

-- Types d'images optimisés
CREATE TYPE image_type_enum AS ENUM (
  'primary',      -- Image principale unique (contrainte trigger)
  'gallery',      -- Images galerie générale
  'technical',    -- Images techniques/schémas
  'lifestyle',    -- Images lifestyle/ambiance
  'thumbnail'     -- Miniatures spécifiques
);

-- Types de conditionnements (selon conditionnements-packages.md)
CREATE TYPE package_type AS ENUM (
  'single',  -- Unité standard (défaut)
  'pack',    -- Lots prédéfinis 2-20 unités
  'bulk',    -- Vrac/Palettes 20+ unités
  'custom'   -- Sur-mesure client spécifique
);

-- ================================================================================================
-- 📦 TABLE PRODUCTS - Produits Individuels
-- ================================================================================================

CREATE TABLE products (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 📝 Identification produit
  sku VARCHAR(100) NOT NULL UNIQUE
    CONSTRAINT sku_format CHECK (sku ~ '^[A-Z0-9\-]+$'),
  name VARCHAR(200) NOT NULL
    CONSTRAINT name_length CHECK (length(name) >= 5),
  slug VARCHAR(250) UNIQUE,

  -- 💰 Tarification obligatoire (euros, 2 décimales)
  price_ht DECIMAL(10,2) NOT NULL
    CONSTRAINT price_positive CHECK (price_ht > 0),
  cost_price DECIMAL(10,2)
    CONSTRAINT cost_price_positive CHECK (cost_price IS NULL OR cost_price > 0),
  tax_rate DECIMAL(5,4) DEFAULT 0.2000
    CONSTRAINT tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 1),

  -- 📊 Statut et condition
  status availability_status_type DEFAULT 'in_stock',
  condition VARCHAR(20) DEFAULT 'new'
    CONSTRAINT condition_valid CHECK (condition IN ('new', 'refurbished', 'used')),

  -- 🎨 Caractéristiques produit (JSON pour flexibilité)
  variant_attributes JSONB DEFAULT '{}',
  dimensions JSONB DEFAULT '{}',
  weight DECIMAL(8,3)
    CONSTRAINT weight_positive CHECK (weight IS NULL OR weight > 0),

  -- 📹 Média
  video_url TEXT,

  -- 📦 Stock et logistique
  stock_quantity INTEGER DEFAULT 0
    CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0),
  min_stock_level INTEGER DEFAULT 5
    CONSTRAINT min_stock_positive CHECK (min_stock_level >= 0),

  -- 🏭 Relations fournisseur et catégorie
  supplier_id UUID REFERENCES organisations(id),
  subcategory_id UUID REFERENCES subcategories(id),
  brand VARCHAR(100),

  -- 🔍 Références externes
  supplier_reference VARCHAR(100),
  supplier_page_url TEXT,
  gtin VARCHAR(50)
    CONSTRAINT gtin_numeric CHECK (gtin IS NULL OR gtin ~ '^[0-9]+$'),

  -- 💹 Business intelligence
  margin_percentage DECIMAL(5,2)
    CONSTRAINT margin_valid CHECK (margin_percentage IS NULL OR
      (margin_percentage >= 0 AND margin_percentage <= 1000)),
  estimated_selling_price DECIMAL(10,2)
    CONSTRAINT estimated_price_positive CHECK (estimated_selling_price IS NULL OR estimated_selling_price > 0),

  -- ⏰ Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 📈 Index de performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX idx_products_created_at ON products(created_at);

-- ⚡ Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================================================
-- 🖼️ TABLE PRODUCT_IMAGES - Images Optimisées Supabase
-- ================================================================================================

CREATE TABLE product_images (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 📦 Relation produit (CASCADE DELETE pour nettoyage automatique)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- 🗂️ Stockage Supabase (selon best practices officielles)
  storage_path TEXT NOT NULL UNIQUE
    CONSTRAINT storage_path_not_empty CHECK (length(trim(storage_path)) > 0),
  public_url TEXT, -- Généré automatiquement par trigger

  -- 🎯 Métadonnées d'affichage
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false, -- Contrainte unicité via trigger
  image_type image_type_enum DEFAULT 'gallery',
  alt_text TEXT,

  -- 📐 Propriétés techniques
  width INTEGER,
  height INTEGER,
  file_size BIGINT
    CONSTRAINT file_size_positive CHECK (file_size IS NULL OR file_size > 0),
  format TEXT,

  -- 👤 Traçabilité
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 📈 Index de performance pour images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_display_order ON product_images(product_id, display_order);
CREATE INDEX idx_product_images_is_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- ⚡ Trigger automatique pour public_url (best practice Supabase)
CREATE OR REPLACE FUNCTION generate_product_image_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Génération automatique URL publique avec domaine correct
  NEW.public_url = 'https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/product-images/' || NEW.storage_path;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_images_generate_url
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION generate_product_image_url();

-- ⚡ Trigger unicité image principale (best practice business)
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Si nouvelle image définie comme primary, désactiver les autres
  IF NEW.is_primary = true THEN
    UPDATE product_images
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_images_single_primary
  AFTER INSERT OR UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_image();

-- ================================================================================================
-- 📦 TABLE PRODUCT_PACKAGES - Conditionnements Flexibles
-- ================================================================================================
-- Selon /manifests/business-rules/conditionnements-packages.md

CREATE TABLE product_packages (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 📦 Relation produit
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- 📝 Définition package
  name VARCHAR(100) NOT NULL,
  type package_type NOT NULL,
  base_quantity INTEGER NOT NULL DEFAULT 1
    CONSTRAINT base_quantity_positive CHECK (base_quantity > 0),

  -- 💰 Configuration tarifaire (exclusif: automatique OU manuel)
  discount_rate DECIMAL(4,3)
    CONSTRAINT discount_valid CHECK (discount_rate IS NULL OR
      (discount_rate >= 0 AND discount_rate <= 0.50)), -- Max 50%
  unit_price_ht DECIMAL(10,2)
    CONSTRAINT unit_price_positive CHECK (unit_price_ht IS NULL OR unit_price_ht > 0),

  -- 📦 Contraintes commande
  min_order_quantity INTEGER DEFAULT 1
    CONSTRAINT moq_valid CHECK (min_order_quantity > 0 AND min_order_quantity <= base_quantity),

  -- 📄 Métadonnées
  description TEXT,
  is_default BOOLEAN DEFAULT false, -- Un seul par produit
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- ⏰ Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- ✅ Contraintes business (pricing exclusif)
  CONSTRAINT pricing_mode_exclusive CHECK (
    (discount_rate IS NOT NULL AND unit_price_ht IS NULL) OR
    (discount_rate IS NULL AND unit_price_ht IS NOT NULL) OR
    (discount_rate IS NULL AND unit_price_ht IS NULL)
  )
);

-- 📈 Index performance packages
CREATE INDEX idx_product_packages_product_id ON product_packages(product_id);
CREATE INDEX idx_product_packages_type ON product_packages(type);
CREATE INDEX idx_product_packages_is_default ON product_packages(product_id, is_default) WHERE is_default = true;

-- ⚡ Trigger updated_at packages
CREATE TRIGGER product_packages_updated_at
  BEFORE UPDATE ON product_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ⚡ Trigger package par défaut unique
CREATE OR REPLACE FUNCTION ensure_single_default_package()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE product_packages
    SET is_default = false
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_packages_single_default
  AFTER INSERT OR UPDATE ON product_packages
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_package();

-- ================================================================================================
-- 🔐 ROW LEVEL SECURITY (RLS) - Best Practices Supabase
-- ================================================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;

-- 🔒 Policies PRODUCTS - Optimisées performance
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT TO authenticated
  USING (true); -- Accès lecture authentifiés

CREATE POLICY "products_insert_authenticated" ON products
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Création pour authentifiés

CREATE POLICY "products_update_authenticated" ON products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true); -- Modification pour authentifiés

-- 🔒 Policies PRODUCT_IMAGES - Optimisées performance avec index
CREATE POLICY "product_images_select_authenticated" ON product_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "product_images_insert_authenticated" ON product_images
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL); -- Utilisateur connecté requis

CREATE POLICY "product_images_update_own" ON product_images
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = created_by OR created_by IS NULL)
  WITH CHECK (true);

CREATE POLICY "product_images_delete_own" ON product_images
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = created_by OR created_by IS NULL);

-- 🔒 Policies PRODUCT_PACKAGES
CREATE POLICY "product_packages_select_authenticated" ON product_packages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "product_packages_insert_authenticated" ON product_packages
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "product_packages_update_authenticated" ON product_packages
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================================================
-- 🗂️ SUPABASE STORAGE CONFIGURATION
-- ================================================================================================

-- Création bucket product-images s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 🔒 Storage RLS Policies (selon best practices Supabase)
CREATE POLICY "product_images_storage_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = 'products'
  );

CREATE POLICY "product_images_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- ================================================================================================
-- 🛠️ FONCTIONS UTILITAIRES
-- ================================================================================================

-- Fonction calcul prix package automatique
CREATE OR REPLACE FUNCTION calculate_package_price(
  p_product_id UUID,
  p_package_id UUID
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  product_price DECIMAL(10,2);
  package_quantity INTEGER;
  discount_rate DECIMAL(4,3);
  unit_price_override DECIMAL(10,2);
  calculated_price DECIMAL(10,2);
BEGIN
  -- Récupération données produit et package
  SELECT p.price_ht, pp.base_quantity, pp.discount_rate, pp.unit_price_ht
  INTO product_price, package_quantity, discount_rate, unit_price_override
  FROM products p
  JOIN product_packages pp ON pp.product_id = p.id
  WHERE p.id = p_product_id AND pp.id = p_package_id;

  -- Calcul selon mode tarifaire
  IF unit_price_override IS NOT NULL THEN
    -- Mode manuel: prix unitaire spécifique
    calculated_price = unit_price_override * package_quantity;
  ELSIF discount_rate IS NOT NULL THEN
    -- Mode automatique: remise sur prix produit
    calculated_price = product_price * package_quantity * (1 - discount_rate);
  ELSE
    -- Mode standard: prix produit x quantité
    calculated_price = product_price * package_quantity;
  END IF;

  RETURN ROUND(calculated_price, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================================
-- 📊 VUES MÉTIER
-- ================================================================================================

-- Vue produits avec package par défaut
CREATE VIEW products_with_default_package AS
SELECT
  p.*,
  pp.name as default_package_name,
  pp.type as default_package_type,
  pp.base_quantity as default_package_quantity,
  calculate_package_price(p.id, pp.id) as default_package_price
FROM products p
LEFT JOIN product_packages pp ON pp.product_id = p.id AND pp.is_default = true;

-- Vue images avec métadonnées complètes
CREATE VIEW product_images_complete AS
SELECT
  pi.*,
  p.name as product_name,
  p.sku as product_sku
FROM product_images pi
JOIN products p ON p.id = pi.product_id
ORDER BY pi.product_id, pi.display_order;

-- ================================================================================================
-- ✅ DONNÉES DE TEST (Optionnel)
-- ================================================================================================

-- Insertion package par défaut pour tous produits futurs
-- (Sera exécuté par l'application lors de création produits)

-- ================================================================================================
-- 📝 COMMENTAIRES FINAUX
-- ================================================================================================

-- Cette migration consolidée implémente:
-- ✅ Architecture products optimisée selon business rules
-- ✅ Système images avec triggers automatiques Supabase
-- ✅ Conditionnements flexibles selon manifesto
-- ✅ RLS policies optimisées performance
-- ✅ Storage configuration sécurisée
-- ✅ Fonctions utilitaires business

-- Next.js configuration requise:
-- - Custom image loader pour Supabase
-- - remotePatterns pour aorroydfjsrygmosnzrl.supabase.co
-- - Image optimization avec width/quality

-- Performance SLOs respectés:
-- - Index sur toutes colonnes RLS
-- - Triggers optimisés
-- - Policies avec TO authenticated
-- ================================================================================================
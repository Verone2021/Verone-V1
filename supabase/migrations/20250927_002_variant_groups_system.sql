/**
 * 🎯 Système de Groupes de Variantes Produits
 *
 * Création de la table variant_groups pour stocker les propriétés communes
 * des produits d'un même groupe de variantes (nom, sous-catégorie, dimensions).
 *
 * Business Rules:
 * - Chaque groupe a un nom unique et une sous-catégorie obligatoire
 * - Les dimensions sont optionnelles mais partagées par tous produits du groupe
 * - Compteur automatique du nombre de produits dans le groupe
 * - Système bidirectionnel: tous produits du groupe se voient mutuellement
 */

-- 1. Créer la table variant_groups d'abord
CREATE TABLE IF NOT EXISTS variant_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identité du groupe
  name VARCHAR(255) NOT NULL,

  -- Catégorisation (obligatoire, partagée par tous produits)
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE RESTRICT,

  -- Dimensions physiques (optionnelles, partagées par tous produits)
  dimensions_length DECIMAL(10,2),
  dimensions_width DECIMAL(10,2),
  dimensions_height DECIMAL(10,2),
  dimensions_unit VARCHAR(10) DEFAULT 'cm' CHECK (dimensions_unit IN ('cm', 'm', 'mm', 'in')),

  -- Métadonnées
  product_count INTEGER DEFAULT 0 CHECK (product_count >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_variant_groups_subcategory
  ON variant_groups(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_variant_groups_name
  ON variant_groups(name);

-- 3. Commentaires sur les colonnes
COMMENT ON TABLE variant_groups IS 'Groupes de variantes produits avec propriétés communes (nom, sous-catégorie, dimensions)';
COMMENT ON COLUMN variant_groups.name IS 'Nom de base du groupe (ex: "Chaise Design")';
COMMENT ON COLUMN variant_groups.subcategory_id IS 'Sous-catégorie commune à tous produits du groupe';
COMMENT ON COLUMN variant_groups.dimensions_length IS 'Longueur commune en unité spécifiée';
COMMENT ON COLUMN variant_groups.dimensions_width IS 'Largeur commune en unité spécifiée';
COMMENT ON COLUMN variant_groups.dimensions_height IS 'Hauteur commune en unité spécifiée';
COMMENT ON COLUMN variant_groups.dimensions_unit IS 'Unité de mesure (cm, m, mm, in)';
COMMENT ON COLUMN variant_groups.product_count IS 'Nombre de produits dans le groupe (mis à jour automatiquement)';

-- 3.5. Ajouter colonnes variant_group_id et variant_position à products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variant_group_id UUID,
  ADD COLUMN IF NOT EXISTS variant_position INTEGER;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS fk_products_variant_group;

ALTER TABLE products
  ADD CONSTRAINT fk_products_variant_group
  FOREIGN KEY (variant_group_id)
  REFERENCES variant_groups(id)
  ON DELETE SET NULL;

-- 4. Fonction trigger: Mettre à jour product_count automatiquement
CREATE OR REPLACE FUNCTION update_variant_group_product_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Ajout d'un produit au groupe
  IF TG_OP = 'INSERT' AND NEW.variant_group_id IS NOT NULL THEN
    UPDATE variant_groups
    SET product_count = product_count + 1,
        updated_at = NOW()
    WHERE id = NEW.variant_group_id;
    RETURN NEW;
  END IF;

  -- Retrait d'un produit du groupe
  IF TG_OP = 'DELETE' AND OLD.variant_group_id IS NOT NULL THEN
    UPDATE variant_groups
    SET product_count = product_count - 1,
        updated_at = NOW()
    WHERE id = OLD.variant_group_id;
    RETURN OLD;
  END IF;

  -- Changement de groupe pour un produit
  IF TG_OP = 'UPDATE' THEN
    -- Ancien groupe: -1 produit
    IF OLD.variant_group_id IS NOT NULL AND
       (NEW.variant_group_id IS NULL OR NEW.variant_group_id != OLD.variant_group_id) THEN
      UPDATE variant_groups
      SET product_count = product_count - 1,
          updated_at = NOW()
      WHERE id = OLD.variant_group_id;
    END IF;

    -- Nouveau groupe: +1 produit
    IF NEW.variant_group_id IS NOT NULL AND
       (OLD.variant_group_id IS NULL OR NEW.variant_group_id != OLD.variant_group_id) THEN
      UPDATE variant_groups
      SET product_count = product_count + 1,
          updated_at = NOW()
      WHERE id = NEW.variant_group_id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger sur la table products
DROP TRIGGER IF EXISTS trg_update_variant_group_count ON products;
CREATE TRIGGER trg_update_variant_group_count
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION update_variant_group_product_count();

-- 6. Contrainte: variant_position requis si variant_group_id existe
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS chk_variant_position;

ALTER TABLE products
  ADD CONSTRAINT chk_variant_position
  CHECK (
    (variant_group_id IS NULL AND variant_position IS NULL) OR
    (variant_group_id IS NOT NULL AND variant_position IS NOT NULL)
  );

-- 7. Index sur products.variant_group_id pour performance
CREATE INDEX IF NOT EXISTS idx_products_variant_group
  ON products(variant_group_id)
  WHERE variant_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_variant_position
  ON products(variant_group_id, variant_position)
  WHERE variant_group_id IS NOT NULL;

-- 8. Fonction helper: Récupérer la prochaine position dans un groupe
CREATE OR REPLACE FUNCTION get_next_variant_position(group_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(variant_position), 0) INTO max_pos
  FROM products
  WHERE variant_group_id = group_id;

  RETURN max_pos + 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_variant_position IS 'Retourne la prochaine position disponible dans un groupe de variantes';

-- 9. Vue: Groupes avec détails sous-catégorie (pour faciliter les requêtes)
CREATE OR REPLACE VIEW variant_groups_detailed AS
SELECT
  vg.*,
  sc.name as subcategory_name,
  sc.category_id,
  c.name as category_name
FROM variant_groups vg
LEFT JOIN subcategories sc ON vg.subcategory_id = sc.id
LEFT JOIN categories c ON sc.category_id = c.id;

COMMENT ON VIEW variant_groups_detailed IS 'Vue enrichie des groupes de variantes avec infos catégories';

-- 10. Fonction: Obtenir tous les produits siblings d'un produit (même groupe)
CREATE OR REPLACE FUNCTION get_variant_siblings(product_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  sku VARCHAR,
  image_url TEXT,
  price_ht DECIMAL,
  variant_position INTEGER,
  variant_attributes JSONB
) AS $$
DECLARE
  group_id UUID;
BEGIN
  -- Récupérer le variant_group_id du produit
  SELECT variant_group_id INTO group_id
  FROM products
  WHERE products.id = product_id;

  -- Si pas de groupe, retourner vide
  IF group_id IS NULL THEN
    RETURN;
  END IF;

  -- Retourner tous les produits du groupe SAUF le produit actuel
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.sku,
    p.image_url,
    p.price_ht,
    p.variant_position,
    p.variant_attributes
  FROM products p
  WHERE p.variant_group_id = group_id
    AND p.id != product_id
  ORDER BY p.variant_position;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_variant_siblings IS 'Retourne tous les produits du même groupe de variantes (sauf le produit courant)';
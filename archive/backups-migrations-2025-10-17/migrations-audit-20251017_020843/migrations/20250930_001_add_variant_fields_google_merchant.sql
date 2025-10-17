-- Migration: Ajout champs variantes pour compatibilité Google Merchant Center 2024
-- Date: 2025-09-30
-- Description: Ajoute variant_type aux groupes et item_group_id aux produits

-- =====================================================
-- PARTIE 1: Ajout variant_type à variant_groups
-- =====================================================

-- Ajouter la colonne variant_type avec contrainte de type
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS variant_type VARCHAR(50)
CHECK (variant_type IN ('color', 'size', 'material', 'pattern'));

-- Commentaire explicatif
COMMENT ON COLUMN variant_groups.variant_type IS 'Type de variante du groupe (color, size, material, pattern) - Compatible Google Merchant Center';

-- Index pour améliorer les performances de filtrage
CREATE INDEX IF NOT EXISTS idx_variant_groups_type
ON variant_groups(variant_type)
WHERE variant_type IS NOT NULL;

-- =====================================================
-- PARTIE 2: Ajout item_group_id à products
-- =====================================================

-- Ajouter item_group_id pour Google Merchant Center
ALTER TABLE products
ADD COLUMN IF NOT EXISTS item_group_id VARCHAR(255);

-- Commentaire explicatif
COMMENT ON COLUMN products.item_group_id IS 'Identifiant de groupe partagé par toutes les variantes d''un même produit (Google Merchant Center item_group_id)';

-- Index pour améliorer les performances des requêtes par item_group_id
CREATE INDEX IF NOT EXISTS idx_products_item_group_id
ON products(item_group_id)
WHERE item_group_id IS NOT NULL;

-- =====================================================
-- PARTIE 3: Fonction pour synchroniser item_group_id
-- =====================================================

-- Fonction pour synchroniser automatiquement item_group_id avec variant_group_id
CREATE OR REPLACE FUNCTION sync_item_group_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un produit est assigné à un variant_group, copier l'ID comme item_group_id
  IF NEW.variant_group_id IS NOT NULL THEN
    NEW.item_group_id := NEW.variant_group_id::TEXT;
  -- Si retiré du groupe, effacer item_group_id
  ELSIF NEW.variant_group_id IS NULL AND OLD.variant_group_id IS NOT NULL THEN
    NEW.item_group_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour synchronisation automatique
DROP TRIGGER IF EXISTS trigger_sync_item_group_id ON products;
CREATE TRIGGER trigger_sync_item_group_id
  BEFORE INSERT OR UPDATE OF variant_group_id ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_item_group_id();

-- =====================================================
-- PARTIE 4: Mise à jour données existantes
-- =====================================================

-- Synchroniser item_group_id pour les produits déjà assignés à des groupes
UPDATE products
SET item_group_id = variant_group_id::TEXT
WHERE variant_group_id IS NOT NULL
  AND item_group_id IS NULL;

-- =====================================================
-- PARTIE 5: Vérifications finales
-- =====================================================

-- Afficher statistiques de migration
DO $$
DECLARE
  groups_with_type INTEGER;
  products_with_item_group INTEGER;
  products_with_variant_group INTEGER;
BEGIN
  SELECT COUNT(*) INTO groups_with_type
  FROM variant_groups
  WHERE variant_type IS NOT NULL;

  SELECT COUNT(*) INTO products_with_item_group
  FROM products
  WHERE item_group_id IS NOT NULL;

  SELECT COUNT(*) INTO products_with_variant_group
  FROM products
  WHERE variant_group_id IS NOT NULL;

  RAISE NOTICE '✅ Migration terminée:';
  RAISE NOTICE '  - Groupes avec variant_type: %', groups_with_type;
  RAISE NOTICE '  - Produits avec item_group_id: %', products_with_item_group;
  RAISE NOTICE '  - Produits avec variant_group_id: %', products_with_variant_group;
  RAISE NOTICE '  - Compatibilité Google Merchant Center 2024: ✅';
END $$;
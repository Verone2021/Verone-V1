-- Migration : Synchronisation suitable_rooms variant_groups → products
-- Date : 2025-10-26
-- Description : Les pièces d'habitation sont une propriété commune du groupe de variantes
--               qui doit être propagée à tous les produits du groupe, comme dimensions et supplier_id

-- =====================================================================
-- FONCTION : sync_variant_group_suitable_rooms
-- =====================================================================
-- Synchronise suitable_rooms depuis variant_groups vers products
-- Deux scénarios :
-- 1. Produit ajouté à un groupe → copier suitable_rooms du groupe
-- 2. suitable_rooms du groupe modifié → propager à tous produits

CREATE OR REPLACE FUNCTION sync_variant_group_suitable_rooms()
RETURNS TRIGGER AS $$
BEGIN
  -- Scénario 1 : Produit ajouté à un groupe (INSERT ou UPDATE de variant_group_id)
  IF TG_TABLE_NAME = 'products' THEN
    IF NEW.variant_group_id IS NOT NULL THEN
      -- Copier suitable_rooms du groupe vers le produit
      UPDATE products
      SET suitable_rooms = (
        SELECT suitable_rooms
        FROM variant_groups
        WHERE id = NEW.variant_group_id
      )
      WHERE id = NEW.id;
    END IF;
  END IF;

  -- Scénario 2 : suitable_rooms du groupe modifié (UPDATE sur variant_groups)
  IF TG_TABLE_NAME = 'variant_groups' THEN
    IF OLD.suitable_rooms IS DISTINCT FROM NEW.suitable_rooms THEN
      -- Propager suitable_rooms à tous les produits du groupe
      UPDATE products
      SET suitable_rooms = NEW.suitable_rooms
      WHERE variant_group_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGER 1 : Sur products (ajout/modification de variant_group_id)
-- =====================================================================
DROP TRIGGER IF EXISTS trigger_sync_suitable_rooms_on_product ON products;
CREATE TRIGGER trigger_sync_suitable_rooms_on_product
  AFTER INSERT OR UPDATE OF variant_group_id ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_variant_group_suitable_rooms();

-- =====================================================================
-- TRIGGER 2 : Sur variant_groups (modification de suitable_rooms)
-- =====================================================================
DROP TRIGGER IF EXISTS trigger_sync_suitable_rooms_on_group ON variant_groups;
CREATE TRIGGER trigger_sync_suitable_rooms_on_group
  AFTER UPDATE OF suitable_rooms ON variant_groups
  FOR EACH ROW
  EXECUTE FUNCTION sync_variant_group_suitable_rooms();

-- =====================================================================
-- MIGRATION DES DONNÉES EXISTANTES
-- =====================================================================
-- Synchroniser tous les produits existants avec les suitable_rooms de leur groupe
UPDATE products p
SET suitable_rooms = vg.suitable_rooms
FROM variant_groups vg
WHERE p.variant_group_id = vg.id
  AND p.suitable_rooms IS DISTINCT FROM vg.suitable_rooms;

-- Afficher résultat de la synchronisation
DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO synced_count
  FROM products p
  INNER JOIN variant_groups vg ON p.variant_group_id = vg.id;

  RAISE NOTICE 'Migration terminée : % produits synchronisés avec leur groupe de variantes', synced_count;
END $$;

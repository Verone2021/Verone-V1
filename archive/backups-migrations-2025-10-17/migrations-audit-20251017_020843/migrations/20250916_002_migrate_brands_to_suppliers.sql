-- Migration: Remplacer système de marques par fournisseurs liés à organisations
-- Date: 2025-09-16
-- Description: Supprime le champ brand et utilise source_organisation_id pour lier aux fournisseurs

-- 1. Créer des organisations de type 'supplier' pour chaque marque existante
INSERT INTO organisations (name, slug, type, email, country, is_active)
SELECT DISTINCT
  brand as name,
  lower(regexp_replace(
    regexp_replace(
      regexp_replace(brand, '[àáâãäå]', 'a', 'g'),
      '[èéêë]', 'e', 'g'
    ),
    '[^a-z0-9]', '-', 'g'
  )) as slug,
  'supplier'::organisation_type as type,
  NULL as email,
  'FR' as country,
  true as is_active
FROM product_groups
WHERE brand IS NOT NULL
  AND brand != ''
  AND NOT EXISTS (
    SELECT 1 FROM organisations o
    WHERE o.name = product_groups.brand
    AND o.type = 'supplier'
  );

-- 2. Mettre à jour les product_groups pour lier aux nouvelles organisations fournisseurs
UPDATE product_groups
SET source_organisation_id = (
  SELECT o.id
  FROM organisations o
  WHERE o.name = product_groups.brand
  AND o.type = 'supplier'
  LIMIT 1
)
WHERE brand IS NOT NULL
  AND brand != ''
  AND source_organisation_id IS NULL;

-- 3. Vérification - Compter les produits sans fournisseur assigné
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM product_groups
  WHERE brand IS NOT NULL
    AND brand != ''
    AND source_organisation_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE WARNING 'Attention: % product_groups ont encore une marque mais pas de source_organisation_id assigné', orphaned_count;
  ELSE
    RAISE NOTICE 'Migration réussie: tous les product_groups avec une marque ont maintenant un fournisseur assigné';
  END IF;
END $$;

-- 4. Supprimer le champ brand (après vérification)
-- NOTE: Cette étape sera exécutée séparément après validation
-- ALTER TABLE product_groups DROP COLUMN IF EXISTS brand;

-- 5. Mise à jour des RLS policies pour les organisations
-- Permettre la lecture des organisations de type supplier pour tous les utilisateurs authentifiés
CREATE POLICY "Anyone can read supplier organisations"
  ON organisations FOR SELECT
  USING (type = 'supplier'::organisation_type);

-- 6. Index pour optimiser les requêtes fournisseurs
CREATE INDEX IF NOT EXISTS idx_organisations_type_active
  ON organisations (type, is_active)
  WHERE type = 'supplier';

-- 7. Commentaires pour documentation
COMMENT ON COLUMN product_groups.source_organisation_id IS 'Référence vers l''organisation fournisseur (organisations.type = supplier). Remplace l''ancien champ brand.';
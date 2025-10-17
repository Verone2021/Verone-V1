-- Migration finale: Supprimer le champ brand de product_groups
-- Date: 2025-09-16
-- Description: Supprime définitivement le champ brand maintenant que les données sont migrées vers source_organisation_id

-- Vérification avant suppression
DO $$
DECLARE
  unmigrated_count INTEGER;
BEGIN
  -- Compter les enregistrements qui ont encore une brand mais pas d'organisation
  SELECT COUNT(*) INTO unmigrated_count
  FROM product_groups
  WHERE brand IS NOT NULL
    AND brand != ''
    AND source_organisation_id IS NULL;

  IF unmigrated_count > 0 THEN
    RAISE EXCEPTION 'ARRÊT: % product_groups ont encore une marque mais pas de fournisseur assigné. Migration incomplète.', unmigrated_count;
  ELSE
    RAISE NOTICE 'Migration validée: tous les product_groups ont un fournisseur assigné';
  END IF;
END $$;

-- Supprimer le champ brand
ALTER TABLE product_groups DROP COLUMN IF EXISTS brand;

-- Validation post-suppression
DO $$
BEGIN
  -- Vérifier que tous les product_groups ont bien un fournisseur
  IF EXISTS (
    SELECT 1 FROM product_groups
    WHERE source_organisation_id IS NULL
  ) THEN
    RAISE WARNING 'Attention: des product_groups n''ont pas de fournisseur assigné';
  ELSE
    RAISE NOTICE 'Validation réussie: tous les product_groups ont un fournisseur assigné';
  END IF;
END $$;

-- Commentaire de documentation
COMMENT ON COLUMN product_groups.source_organisation_id IS 'Référence vers l''organisation fournisseur (organisations.type = supplier). Remplace l''ancien système de marques (brand).';

-- Log de la migration
INSERT INTO public.migration_logs (operation, description, executed_at)
VALUES (
  'DROP_COLUMN',
  'Suppression définitive du champ brand de product_groups - Migration vers système fournisseurs terminée',
  NOW()
) ON CONFLICT DO NOTHING;
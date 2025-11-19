-- Migration: Ajouter common_eco_tax à variant_groups
-- Date: 2025-11-19
-- Description: Lier l'éco-taxe au prix d'achat dans les groupes de variantes.
--              Lorsque has_common_cost_price = true, l'éco-taxe doit aussi être commune.
-- Règle Métier: L'éco-taxe et le prix d'achat sont TOUJOURS liés.
--               Si le prix est commun au groupe, l'éco-taxe doit aussi être commune.
--               L'éco-taxe peut être 0€ (valeur par défaut).

-- ========================================
-- 1. AJOUTER COLONNE common_eco_tax
-- ========================================

ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS common_eco_tax NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN variant_groups.common_eco_tax IS
  'Taxe éco-responsable commune pour tous les produits du groupe.
   Utilisée uniquement si has_common_cost_price = true.
   S''additionne au prix d''achat fournisseur pour le calcul du coût total.
   Peut être 0€ (valeur par défaut et acceptable).
   Règle: Éco-taxe et prix d''achat sont TOUJOURS liés.';

-- ========================================
-- 2. CRÉER INDEX POUR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_variant_groups_common_eco_tax
  ON variant_groups(common_eco_tax)
  WHERE common_eco_tax IS NOT NULL AND common_eco_tax > 0;

COMMENT ON INDEX idx_variant_groups_common_eco_tax IS
  'Index pour recherche rapide des groupes avec éco-taxe > 0.';

-- ========================================
-- 3. VALIDATION DE LA MIGRATION
-- ========================================

-- Vérifier que la colonne a été ajoutée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variant_groups'
    AND column_name = 'common_eco_tax'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: colonne common_eco_tax non créée';
  END IF;

  RAISE NOTICE 'Migration réussie: common_eco_tax ajoutée à variant_groups';
END $$;

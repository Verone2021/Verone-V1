-- ============================================================================
-- Migration: Ajout du poids commun pour les groupes de variantes
-- ============================================================================
-- Description: Permet de définir un poids commun optionnel hérité par tous
--              les produits d'un groupe de variantes
-- Date: 2025-11-01
-- Author: Claude Code (Vérone Back Office)
-- ============================================================================

-- Ajouter colonne common_weight (optionnel)
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS common_weight DECIMAL(10,2);

-- Index pour recherche/tri par poids
CREATE INDEX IF NOT EXISTS idx_variant_groups_common_weight
  ON variant_groups(common_weight)
  WHERE common_weight IS NOT NULL;

-- Commentaire documentation
COMMENT ON COLUMN variant_groups.common_weight IS
  'Poids commun en kg partagé par tous les produits du groupe (optionnel, peut varier légèrement selon matière/couleur)';

-- ============================================================================
-- Validation
-- ============================================================================
-- Vérifier que la colonne est bien créée:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'variant_groups' AND column_name = 'common_weight';
--
-- Résultat attendu:
-- column_name    | data_type | is_nullable
-- common_weight  | numeric   | YES
-- ============================================================================

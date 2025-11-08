-- ============================================================================
-- Migration: Ajout du flag has_common_weight pour les groupes de variantes
-- ============================================================================
-- Description: Permet de définir si le poids commun est hérité par tous
--              les produits du groupe (pattern identique à has_common_supplier)
-- Date: 2025-11-01
-- Author: Claude Code (Vérone Back Office)
-- ============================================================================

-- Ajouter colonne has_common_weight (flag boolean)
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS has_common_weight BOOLEAN DEFAULT false NOT NULL;

-- Index pour recherche/tri des groupes avec poids commun
CREATE INDEX IF NOT EXISTS idx_variant_groups_has_common_weight
  ON variant_groups(has_common_weight)
  WHERE has_common_weight = true;

-- Commentaire documentation
COMMENT ON COLUMN variant_groups.has_common_weight IS
  'Si true, tous les produits du groupe héritent du common_weight et ne peuvent pas le modifier individuellement. Pattern identique à has_common_supplier.';

-- ============================================================================
-- Validation
-- ============================================================================
-- Vérifier que la colonne est bien créée:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'variant_groups' AND column_name = 'has_common_weight';
--
-- Résultat attendu:
-- column_name         | data_type | column_default | is_nullable
-- has_common_weight   | boolean   | false          | NO
-- ============================================================================

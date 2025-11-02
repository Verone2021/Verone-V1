-- ============================================================================
-- Migration: Ajout du prix d'achat commun pour les groupes de variantes
-- ============================================================================
-- Description: Permet de définir un prix d'achat commun hérité par tous
--              les produits du groupe (pattern identique à has_common_weight)
-- Date: 2025-11-02
-- Author: Claude Code (Vérone Back Office)
-- ============================================================================

-- Ajouter colonne has_common_cost_price (flag boolean)
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS has_common_cost_price BOOLEAN DEFAULT false NOT NULL;

-- Ajouter colonne common_cost_price (valeur numeric)
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS common_cost_price NUMERIC(10, 2);

-- Index pour recherche/tri des groupes avec prix d'achat commun
CREATE INDEX IF NOT EXISTS idx_variant_groups_has_common_cost_price
  ON variant_groups(has_common_cost_price)
  WHERE has_common_cost_price = true;

-- Commentaires documentation
COMMENT ON COLUMN variant_groups.has_common_cost_price IS
  'Si true, tous les produits du groupe héritent du common_cost_price et ne peuvent pas le modifier individuellement. Pattern identique à has_common_weight.';

COMMENT ON COLUMN variant_groups.common_cost_price IS
  'Prix d''achat indicatif commun à tous les produits du groupe. Actif seulement si has_common_cost_price = true. Précision : 2 décimales (0.01 €).';

-- ============================================================================
-- Validation
-- ============================================================================
-- Vérifier que les colonnes sont bien créées:
-- SELECT column_name, data_type, column_default, is_nullable, numeric_precision, numeric_scale
-- FROM information_schema.columns
-- WHERE table_name = 'variant_groups' AND column_name IN ('has_common_cost_price', 'common_cost_price')
-- ORDER BY column_name;
--
-- Résultat attendu:
-- column_name                | data_type | column_default | is_nullable | numeric_precision | numeric_scale
-- has_common_cost_price      | boolean   | false          | NO          | NULL              | NULL
-- common_cost_price          | numeric   | NULL           | YES         | 10                | 2
-- ============================================================================

-- Migration: Ajout du système de génération automatique de SKU pour les groupes de variantes
-- Date: 2025-10-01
-- Description: Ajoute la colonne base_sku aux variant_groups pour permettre la génération automatique
--              des SKU produits selon le pattern {BASE_SKU}-{VALEUR_VARIANTE}

-- ============================================================================
-- ÉTAPE 1: Ajouter la colonne base_sku
-- ============================================================================

ALTER TABLE variant_groups
ADD COLUMN base_sku VARCHAR(50);

COMMENT ON COLUMN variant_groups.base_sku IS 'SKU de base du groupe, utilisé pour générer automatiquement les SKU des produits variantes selon le pattern {BASE_SKU}-{VALEUR}';

-- ============================================================================
-- ÉTAPE 2: Fonction de normalisation pour générer des SKU propres
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_for_sku(text_input TEXT, max_length INT DEFAULT 50)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN UPPER(
    LEFT(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          -- Remplacer les caractères accentués
          TRANSLATE(
            text_input,
            'àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ',
            'aaaeeeeiioouuuycAAAEEEEIIOOUUUYC'
          ),
          '[^A-Za-z0-9]+',  -- Remplacer tout ce qui n'est pas alphanumérique
          '-',
          'g'
        ),
        '^-+|-+$',  -- Supprimer les tirets au début et à la fin
        '',
        'g'
      ),
      max_length
    )
  );
END;
$$;

COMMENT ON FUNCTION normalize_for_sku IS 'Normalise une chaîne de texte pour créer un SKU: majuscules, sans accents, tirets pour séparateurs';

-- ============================================================================
-- ÉTAPE 3: Migrer les données existantes
-- ============================================================================

-- Générer base_sku depuis le nom du groupe pour les groupes existants
UPDATE variant_groups
SET base_sku = normalize_for_sku(name, 30)
WHERE base_sku IS NULL;

-- ============================================================================
-- ÉTAPE 4: Ajouter contraintes et index
-- ============================================================================

-- Contrainte NOT NULL (après avoir migré les données)
ALTER TABLE variant_groups
ALTER COLUMN base_sku SET NOT NULL;

-- Index pour améliorer les performances des recherches par SKU
CREATE INDEX idx_variant_groups_base_sku ON variant_groups(base_sku);

-- ============================================================================
-- ÉTAPE 5: Fonction helper pour générer le SKU complet d'un produit variante
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_variant_product_sku(
  p_base_sku TEXT,
  p_variant_value TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized_base TEXT;
  normalized_variant TEXT;
BEGIN
  -- Normaliser le SKU de base (max 20 caractères)
  normalized_base := normalize_for_sku(p_base_sku, 20);

  -- Normaliser la valeur de variante (max 15 caractères)
  normalized_variant := normalize_for_sku(p_variant_value, 15);

  -- Retourner le pattern complet: {BASE}-{VARIANT}
  RETURN normalized_base || '-' || normalized_variant;
END;
$$;

COMMENT ON FUNCTION generate_variant_product_sku IS 'Génère le SKU complet d''un produit variante selon le pattern {BASE_SKU}-{VALEUR_VARIANTE}';

-- ============================================================================
-- VALIDATION DE LA MIGRATION
-- ============================================================================

-- Vérifier que tous les groupes ont maintenant un base_sku
DO $$
DECLARE
  groups_without_sku INT;
BEGIN
  SELECT COUNT(*) INTO groups_without_sku
  FROM variant_groups
  WHERE base_sku IS NULL;

  IF groups_without_sku > 0 THEN
    RAISE EXCEPTION 'Migration échouée: % groupes sans base_sku', groups_without_sku;
  END IF;

  RAISE NOTICE 'Migration réussie: Tous les groupes ont un base_sku';
END;
$$;

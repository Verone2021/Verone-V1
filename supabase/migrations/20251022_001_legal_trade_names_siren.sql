-- Migration: Distinction Dénomination Sociale vs Nom Commercial + SIREN
-- Date: 2025-10-22
-- Description:
--   Implémente la distinction légale française entre:
--   - legal_name (dénomination sociale) : OBLIGATOIRE, nom enregistré au RCS
--   - trade_name (nom commercial) : OPTIONNEL, nom utilisé publiquement
--   Ajoute également le SIREN (9 chiffres) obligatoire sur factures depuis juillet 2024
--
-- Contexte Business:
--   Une organisation peut avoir une dénomination sociale différente de son nom commercial
--   Exemple: "SAS Meubles Prestige" (legal_name) mais "Déco Luxe Paris" (trade_name)
--   Le SIREN identifie de façon unique l'entreprise en France
--   Le SIRET (déjà existant) = SIREN + numéro d'établissement
--
-- Compatibilité: Pennylane, Sellsy, Abby (PDP 2026)

-- ============================================================================
-- ÉTAPE 1: Renommer la colonne 'name' en 'legal_name'
-- ============================================================================

ALTER TABLE organisations
  RENAME COLUMN name TO legal_name;

COMMENT ON COLUMN organisations.legal_name IS
  'Dénomination sociale officielle enregistrée au RCS (Registre du Commerce et des Sociétés). Obligatoire.';

-- ============================================================================
-- ÉTAPE 2: Ajouter les nouvelles colonnes
-- ============================================================================

-- Nom commercial (optionnel)
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255) NULL;

COMMENT ON COLUMN organisations.trade_name IS
  'Nom commercial utilisé publiquement si différent de la dénomination sociale. Optionnel.';

-- Indicateur de nom commercial différent (pattern checkbox)
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS has_different_trade_name BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN organisations.has_different_trade_name IS
  'Indique si l''organisation utilise un nom commercial différent de sa dénomination sociale.';

-- SIREN (9 chiffres - identifiant unique entreprise)
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS siren VARCHAR(9) NULL;

COMMENT ON COLUMN organisations.siren IS
  'Numéro SIREN (9 chiffres) - Identifiant unique de l''entreprise en France. Obligatoire sur factures depuis juillet 2024.';

-- ============================================================================
-- ÉTAPE 3: Ajouter les contraintes de validation
-- ============================================================================

-- Contrainte SIREN: doit être NULL ou exactement 9 chiffres
ALTER TABLE organisations
  ADD CONSTRAINT check_siren_format
    CHECK (siren IS NULL OR siren ~ '^\d{9}$');

-- Contrainte SIRET: doit être NULL ou exactement 14 chiffres
-- (SIRET existe déjà mais sans contrainte de validation)
ALTER TABLE organisations
  DROP CONSTRAINT IF EXISTS check_siret_format;

ALTER TABLE organisations
  ADD CONSTRAINT check_siret_format
    CHECK (siret IS NULL OR siret ~ '^\d{14}$');

-- Contrainte trade_name: si has_different_trade_name = true, alors trade_name NOT NULL
ALTER TABLE organisations
  ADD CONSTRAINT check_trade_name_consistency
    CHECK (
      (has_different_trade_name = FALSE) OR
      (has_different_trade_name = TRUE AND trade_name IS NOT NULL)
    );

-- ============================================================================
-- ÉTAPE 4: Créer les indexes pour optimiser les performances
-- ============================================================================

-- Index sur legal_name (remplace l'ancien index sur 'name')
DROP INDEX IF EXISTS idx_organisations_name;
CREATE INDEX IF NOT EXISTS idx_organisations_legal_name
  ON organisations(legal_name);

-- Index sur SIREN (uniquement si non NULL)
CREATE INDEX IF NOT EXISTS idx_organisations_siren
  ON organisations(siren)
  WHERE siren IS NOT NULL;

-- Index sur SIRET (uniquement si non NULL) - peut déjà exister
CREATE INDEX IF NOT EXISTS idx_organisations_siret
  ON organisations(siret)
  WHERE siret IS NOT NULL;

-- Index composite pour recherche par nom (legal_name OU trade_name)
CREATE INDEX IF NOT EXISTS idx_organisations_display_name
  ON organisations(legal_name, trade_name);

-- ============================================================================
-- ÉTAPE 5: Créer une fonction helper pour obtenir le nom d'affichage
-- ============================================================================

CREATE OR REPLACE FUNCTION get_organisation_display_name(org organisations)
RETURNS TEXT AS $$
BEGIN
  -- Si l'organisation a un nom commercial différent, le retourner
  -- Sinon, retourner la dénomination sociale
  RETURN COALESCE(
    CASE
      WHEN org.has_different_trade_name AND org.trade_name IS NOT NULL
      THEN org.trade_name
      ELSE org.legal_name
    END,
    org.legal_name
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_organisation_display_name IS
  'Retourne le nom d''affichage préféré : trade_name si défini, sinon legal_name';

-- ============================================================================
-- ÉTAPE 6: Mise à jour des données existantes (si nécessaire)
-- ============================================================================

-- Aucune donnée à migrer car 'name' a été renommé en 'legal_name'
-- Les organisations existantes gardent leur nom actuel comme dénomination sociale

-- ============================================================================
-- VALIDATION DE LA MIGRATION
-- ============================================================================

-- Vérifier que toutes les colonnes existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organisations'
    AND column_name = 'legal_name'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: colonne legal_name non créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organisations'
    AND column_name = 'trade_name'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: colonne trade_name non créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organisations'
    AND column_name = 'siren'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: colonne siren non créée';
  END IF;

  RAISE NOTICE 'Migration 20251022_001 validée avec succès ✅';
END $$;

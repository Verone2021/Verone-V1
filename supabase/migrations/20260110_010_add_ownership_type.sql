-- Migration: add ownership_type to organisations
-- Date: 2026-01-10
-- Description: Ajoute un champ pour distinguer les organisations propres des franchises
-- Valeurs possibles: 'propre', 'franchise', 'succursale'

-- =====================================================================
-- CREER L'ENUM
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organisation_ownership_type') THEN
    CREATE TYPE organisation_ownership_type AS ENUM ('propre', 'franchise', 'succursale');
  END IF;
END
$$;

-- =====================================================================
-- AJOUTER LA COLONNE
-- =====================================================================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS ownership_type organisation_ownership_type;

-- =====================================================================
-- INDEX POUR FILTRAGE RAPIDE
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_organisations_ownership_type
ON organisations(ownership_type) WHERE ownership_type IS NOT NULL;

-- =====================================================================
-- COMMENTAIRE
-- =====================================================================

COMMENT ON COLUMN organisations.ownership_type IS
'Type de propriété: propre (détenu par l''enseigne), franchise, ou succursale';

-- Migration: add_enseigne_organisation_consultations
-- Description: Remplacer organisation_name (TEXT) par enseigne_id et organisation_id (UUID FK)
-- Date: 2025-12-02

BEGIN;

-- 1. Ajouter les nouvelles colonnes (nullable pour l'instant)
ALTER TABLE client_consultations
ADD COLUMN IF NOT EXISTS enseigne_id UUID REFERENCES enseignes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL;

-- 2. Migrer les données existantes
-- Chercher les organisations par legal_name et mettre à jour organisation_id
UPDATE client_consultations cc
SET organisation_id = o.id
FROM organisations o
WHERE cc.organisation_name = o.legal_name
  AND cc.organisation_id IS NULL;

-- 3. Supprimer l'ancienne colonne organisation_name
ALTER TABLE client_consultations
DROP COLUMN IF EXISTS organisation_name;

-- 4. Ajouter contrainte CHECK (au moins un des deux doit être renseigné)
ALTER TABLE client_consultations
ADD CONSTRAINT chk_enseigne_or_organisation
CHECK (enseigne_id IS NOT NULL OR organisation_id IS NOT NULL);

-- 5. Créer index pour performances
CREATE INDEX IF NOT EXISTS idx_client_consultations_enseigne_id
ON client_consultations(enseigne_id) WHERE enseigne_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_consultations_organisation_id
ON client_consultations(organisation_id) WHERE organisation_id IS NOT NULL;

COMMIT;

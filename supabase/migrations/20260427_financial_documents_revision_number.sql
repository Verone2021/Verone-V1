-- Migration: Add revision_number to financial_documents
-- Purpose: Track quote revisions for versionning (BO-FIN-029)
-- A quote superseded gets a new version with revision_number + 1
-- Default 1 for all existing documents

ALTER TABLE financial_documents
  ADD COLUMN IF NOT EXISTS revision_number integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN financial_documents.revision_number IS
  'Numéro de révision du document. Incrémenté à chaque régénération (devis superseded → nouveau devis avec revision_number + 1). Proformas toujours à 1 (hard delete + recréation).';

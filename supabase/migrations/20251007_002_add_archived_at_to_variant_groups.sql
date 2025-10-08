-- Migration: Ajout colonne archived_at pour variant_groups
-- Date: 2025-10-07
-- Description: Permet d'archiver des groupes de variantes avec cascade sur les produits

-- Ajouter colonne archived_at à variant_groups
ALTER TABLE variant_groups
ADD COLUMN archived_at TIMESTAMP;

-- Index pour filtrer efficacement les groupes archivés
CREATE INDEX idx_variant_groups_archived_at ON variant_groups(archived_at) WHERE archived_at IS NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN variant_groups.archived_at IS 'Date d''archivage du groupe. NULL = actif, NOT NULL = archivé';

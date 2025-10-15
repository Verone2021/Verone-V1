-- ============================================================================
-- Migration: Ajout column logo_url à la table organisations
-- Date: 2025-10-15
-- Description: Ajoute la possibilité de stocker un logo pour chaque organisation
--              (suppliers, customers, partners). Le logo est stocké dans
--              Supabase Storage bucket 'organisation-logos' et seul le path
--              est enregistré dans la DB.
-- ============================================================================

-- Ajouter column logo_url à la table organisations
ALTER TABLE organisations
ADD COLUMN logo_url TEXT;

-- Ajouter commentaire pour documentation
COMMENT ON COLUMN organisations.logo_url IS
'Path du logo dans Supabase Storage (bucket: organisation-logos). Format: {organisation_id}/{timestamp}-logo.{ext}';

-- Créer index pour améliorer les requêtes qui filtrent par présence de logo
CREATE INDEX idx_organisations_logo_url ON organisations(logo_url) WHERE logo_url IS NOT NULL;

-- ============================================================================
-- Notes:
-- - La column est nullable car les logos sont optionnels
-- - Chaque organisation ne peut avoir qu'un seul logo (business rule)
-- - Les fichiers sont stockés dans Storage, pas dans la DB (best practice)
-- - L'index partiel optimise les queries "organisations avec logo"
-- ============================================================================

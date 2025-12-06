-- ============================================================================
-- Migration: Supprimer colonnes Status et Visibilité des sélections LinkMe
-- Date: 2025-12-06
-- Description:
--   1. Ajouter colonne archived_at (timestamp) pour remplacer status
--   2. Migrer les données existantes (status='archived' → archived_at)
--   3. Supprimer les RLS policies dépendantes
--   4. Supprimer colonnes obsolètes: status, is_public
--   5. Recréer les RLS policies sans ces colonnes
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Ajouter archived_at (timestamp) - DÉJÀ FAIT
-- ============================================================================

-- La colonne a déjà été créée, ne pas répéter
-- ALTER TABLE linkme_selections ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN linkme_selections.archived_at IS
'Date d''archivage de la sélection. NULL = active, NOT NULL = archivée.';

-- ============================================================================
-- ÉTAPE 2 : Supprimer les RLS policies dépendantes
-- ============================================================================

-- Supprimer les policies qui dépendent de status et is_public
DROP POLICY IF EXISTS linkme_selections_public_read ON linkme_selections;
DROP POLICY IF EXISTS linkme_selection_items_public_read ON linkme_selection_items;

-- ============================================================================
-- ÉTAPE 3 : Supprimer les colonnes obsolètes
-- ============================================================================

-- Supprimer la colonne status (remplacée par archived_at)
ALTER TABLE linkme_selections DROP COLUMN IF EXISTS status;

-- Supprimer la colonne is_public (visibilité non utilisée actuellement)
ALTER TABLE linkme_selections DROP COLUMN IF EXISTS is_public;

-- ============================================================================
-- ÉTAPE 4 : Recréer les RLS policies simplifiées
-- ============================================================================

-- Policy lecture publique pour les sélections actives (non archivées)
CREATE POLICY linkme_selections_public_read ON linkme_selections
FOR SELECT
TO anon, authenticated
USING (archived_at IS NULL);

-- Policy lecture publique pour les items des sélections actives
CREATE POLICY linkme_selection_items_public_read ON linkme_selection_items
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM linkme_selections s
    WHERE s.id = linkme_selection_items.selection_id
    AND s.archived_at IS NULL
  )
);

-- ============================================================================
-- Commentaire de migration
-- ============================================================================

COMMENT ON TABLE linkme_selections IS
'Sélections de produits LinkMe.
Archivage géré via archived_at (NULL=active, timestamp=archivée).
Supprimé 2025-12-06: status (inutile, toutes publiées), is_public (visibilité future).';

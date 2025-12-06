-- ============================================================================
-- Migration: Soft Delete pour linkme_selection_items
-- Date: 2025-12-06
-- Description: Ajoute la colonne deleted_at pour permettre le soft delete
--              des produits dans les sélections LinkMe tout en préservant
--              l'historique des ventes.
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER COLONNE deleted_at
-- ============================================================================

-- Ajouter la colonne deleted_at pour soft delete
-- NULL = produit actif, TIMESTAMP = produit supprimé (soft deleted)
ALTER TABLE linkme_selection_items
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- 2. INDEX POUR PERFORMANCES
-- ============================================================================

-- Index partiel pour filtrer efficacement les produits non-supprimés
-- Optimise les requêtes WHERE deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_linkme_selection_items_active
ON linkme_selection_items(selection_id)
WHERE deleted_at IS NULL;

-- Index sur deleted_at pour requêtes admin (voir les supprimés)
CREATE INDEX IF NOT EXISTS idx_linkme_selection_items_deleted_at
ON linkme_selection_items(deleted_at)
WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- 3. COMMENTAIRES
-- ============================================================================

COMMENT ON COLUMN linkme_selection_items.deleted_at IS
  'Timestamp de suppression (soft delete). NULL = actif, valeur = supprimé. Préserve historique ventes.';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

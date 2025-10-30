-- =====================================================================
-- Migration: Add archived_at to purchase_order_items
-- Description: Ajoute colonne archived_at pour soft-delete échantillons
-- Date: 2025-10-31
-- =====================================================================

-- Ajouter la colonne archived_at (soft delete timestamp)
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour filtrage rapide des échantillons archivés
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_archived_at
  ON purchase_order_items(archived_at)
  WHERE archived_at IS NOT NULL;

-- Commentaire documentation
COMMENT ON COLUMN purchase_order_items.archived_at IS
  'Timestamp d''archivage échantillon (soft delete). NULL = actif, NOT NULL = archivé';

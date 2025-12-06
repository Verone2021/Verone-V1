-- ============================================================================
-- Migration: Cleanup linkme_selection_items (Hard Delete)
-- Date: 2025-12-06
-- Description:
--   1. Supprime les policies RLS dupliquées qui causent des conflits
--   2. Supprime la colonne deleted_at (soft delete non nécessaire)
--   3. L'historique des ventes est préservé dans orders/order_items
-- ============================================================================

-- ============================================================================
-- 1. NETTOYER LES POLICIES DUPLIQUÉES
-- ============================================================================

-- Supprimer les policies individuelles staff (on garde staff_all)
DROP POLICY IF EXISTS linkme_selection_items_staff_delete ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_staff_insert ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_staff_select ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_staff_update ON linkme_selection_items;

-- Supprimer la policy ALL pour affiliés (on garde les policies individuelles)
DROP POLICY IF EXISTS linkme_selection_items_affiliate_own ON linkme_selection_items;

-- ============================================================================
-- 2. SUPPRIMER LA COLONNE deleted_at ET SES INDEX
-- ============================================================================

-- Supprimer les index associés au soft delete
DROP INDEX IF EXISTS idx_linkme_selection_items_active;
DROP INDEX IF EXISTS idx_linkme_selection_items_deleted_at;

-- Supprimer la colonne deleted_at (plus nécessaire)
ALTER TABLE linkme_selection_items DROP COLUMN IF EXISTS deleted_at;

-- ============================================================================
-- 3. COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE linkme_selection_items IS
  'Items dans les sélections LinkMe. Hard delete utilisé car historique ventes dans orders.';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

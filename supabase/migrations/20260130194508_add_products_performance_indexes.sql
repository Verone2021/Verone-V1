-- Migration: Add Performance Indexes for Products Catalogue
-- Date: 2026-01-30
-- Author: Claude (automated)
-- Issue: Performance audit - SLO Catalogue dépassé (2654ms > 2000ms)
--
-- Context:
-- Les requêtes sur products sont lentes car manquent d'indexes sur colonnes filtrées:
-- - subcategory_id (filtre hiérarchique famille > catégorie > sous-catégorie)
-- - archived_at + product_status (filtrage produits actifs)
-- - supplier_id (filtre par fournisseur)
--
-- Gain attendu: ~400-600ms (query optimization)
-- Note: CONCURRENTLY supprimé car MCP Supabase ne supporte pas les transactions

-- Index sur subcategory_id (filtre hiérarchique)
-- Utilisé par TOUS les filtres de catalogue (families, categories, subcategories)
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id
  ON products(subcategory_id)
  WHERE subcategory_id IS NOT NULL;

-- Index composite pour filtres communs (produits actifs)
-- WHERE archived_at IS NULL AND product_status = 'active'
CREATE INDEX IF NOT EXISTS idx_products_active_filter
  ON products(archived_at, product_status)
  WHERE archived_at IS NULL;

-- Index sur supplier_id (filtre par fournisseur)
CREATE INDEX IF NOT EXISTS idx_products_supplier_id
  ON products(supplier_id)
  WHERE supplier_id IS NOT NULL;

-- Index composite avancé pour requêtes catalogue complexes
-- Couvre: sous-catégorie + statut archivé + statut produit
CREATE INDEX IF NOT EXISTS idx_products_catalogue_query
  ON products(subcategory_id, archived_at, product_status)
  WHERE archived_at IS NULL;

-- Commentaires documentation
COMMENT ON INDEX idx_products_subcategory_id IS 'Performance: Accélère filtres hiérarchiques (famille > catégorie > sous-catégorie)';
COMMENT ON INDEX idx_products_active_filter IS 'Performance: Accélère requêtes produits actifs (non-archivés)';
COMMENT ON INDEX idx_products_supplier_id IS 'Performance: Accélère filtres par fournisseur';
COMMENT ON INDEX idx_products_catalogue_query IS 'Performance: Index composite pour requêtes catalogue complexes';

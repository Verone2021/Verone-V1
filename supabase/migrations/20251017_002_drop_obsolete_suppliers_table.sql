-- Migration: Suppression table suppliers obsolète
-- Date: 2025-10-17
-- Raison: Table créée par erreur par MCP, doublon de organisations.type='supplier'
-- Impact: product_drafts et sample_orders utilisent organisations à la place

-- ============================================================================
-- ÉTAPE 1: Supprimer foreign keys pointant vers suppliers
-- ============================================================================

-- 1.1 Drop FK product_drafts.supplier_id → suppliers
ALTER TABLE product_drafts
  DROP CONSTRAINT IF EXISTS product_drafts_supplier_id_fkey;

-- 1.2 Drop FK sample_orders.supplier_id → suppliers
ALTER TABLE sample_orders
  DROP CONSTRAINT IF EXISTS sample_orders_supplier_id_fkey;

-- ============================================================================
-- ÉTAPE 2: Recréer foreign keys vers organisations (source de vérité)
-- ============================================================================

-- 2.1 Recréer FK product_drafts.supplier_id → organisations
ALTER TABLE product_drafts
  ADD CONSTRAINT product_drafts_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES organisations(id)
  ON DELETE SET NULL;

-- 2.2 Recréer FK sample_orders.supplier_id → organisations
ALTER TABLE sample_orders
  ADD CONSTRAINT sample_orders_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES organisations(id)
  ON DELETE SET NULL;

-- ============================================================================
-- ÉTAPE 3: Supprimer la table suppliers obsolète
-- ============================================================================

DROP TABLE IF EXISTS suppliers CASCADE;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Table organisations contient TOUS les types d'entités:
--   - type = 'supplier'      → Fournisseurs
--   - type = 'customer'      → Clients professionnels (B2B)
--   - type = 'service_provider' → Prestataires
--
-- La table suppliers était un doublon obsolète créé par erreur.
-- Toutes les foreign keys pointent maintenant vers organisations (unified).

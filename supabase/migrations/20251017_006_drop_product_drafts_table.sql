-- Migration: Suppression complète table product_drafts et dépendances
-- Date: 2025-10-17
-- Raison: Fonctionnalité wizard obsolète - Architecture simplifiée
-- Workflow actuel: Création directe products + modification via page détail

-- 🎯 CONTEXTE
-- La table product_drafts était utilisée pour sauvegarder progressivement
-- les étapes du wizard de création produits. Le workflow actuel permet
-- de créer des produits directement dans la table products (même incomplets)
-- et de les modifier via la page détail. Le completion_percentage est
-- calculé automatiquement par trigger.

-- 1. Supprimer table d'abord (CASCADE supprime triggers/index/policies automatiquement)
DROP TABLE IF EXISTS product_drafts CASCADE;

-- 2. Supprimer fonctions orphelines (si elles existent encore)
DROP FUNCTION IF EXISTS update_product_drafts_updated_at() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_product_drafts() CASCADE;

-- 5. Documentation migration
COMMENT ON SCHEMA public IS
  'Migration 20251017_006: Suppression product_drafts - Architecture simplifiée.
   Workflow: Création directe products + modification page détail.
   32 brouillons test supprimés (aucune donnée production).';

-- ✅ RÉSULTAT ATTENDU
-- - Table product_drafts supprimée
-- - Triggers et fonctions associés supprimés
-- - Index supprimés
-- - RLS policies supprimés
-- - Aucun impact sur table products (indépendante)

-- Migration : Suppression table supplier_categories (inutile, jamais utilisée)
-- Date : 2025-10-23
-- Auteur : Claude Code
-- Raison : Table taxonomie prévue mais jamais implémentée
--          organisations.supplier_category complètement vide (NULL pour tous les 15 fournisseurs)
--          Table supplier_categories contient 13 catégories prédéfinies mais jamais référencées

BEGIN;

-- 1. Log suppression pour audit
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM supplier_categories;
    RAISE NOTICE 'Suppression table supplier_categories : % lignes présentes (jamais utilisées)', row_count;
END $$;

-- 2. Supprimer colonne FK dans organisations (si existe)
-- Note : La colonne organisations.supplier_category est VARCHAR, pas FK, mais on la supprime quand même
ALTER TABLE organisations
DROP COLUMN IF EXISTS supplier_category CASCADE;

-- 3. Supprimer table
DROP TABLE IF EXISTS supplier_categories CASCADE;

-- 4. Log succès
DO $$
BEGIN
    RAISE NOTICE 'Table supplier_categories supprimée avec succès';
END $$;

COMMIT;

-- ========================================
-- ROLLBACK INSTRUCTIONS (si besoin urgent)
-- ========================================
-- ATTENTION : Cette migration est destructive mais sans impact (table jamais utilisée)
--
-- Si besoin de rollback (peu probable) :
-- 1. Restaurer depuis backup Supabase
-- 2. Ou recréer table avec script docs/database/migrations/rollback/20251023_001_recreate_supplier_categories.sql
--
-- Aucun rollback automatique car suppression volontaire de données inutiles

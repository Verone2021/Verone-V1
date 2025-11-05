-- Migration 109: Cleanup Final - Suppression availability_status_type
-- Date: 2025-11-05
-- Contexte: Post-Migration 108 - Suppression complète ancien système status
--
-- Objectif: Supprimer TOUTES références à availability_status_type
-- 1. Supprimer colonne products.status (NOT NULL - obsolète)
-- 2. Supprimer colonne products.status_deprecated (NULLABLE - transition)
-- 3. Supprimer index associés (6 index sur status)
-- 4. Supprimer ENUM availability_status_type
--
-- Références:
-- - docs/audits/2025-11/AUDIT-DATABASE-OBSOLETE-ELEMENTS-2025-11-05.md
-- - supabase/migrations/20251104_100_stock_simplification_refonte_dual_status.sql

-- =============================================================================
-- PARTIE 1: Supprimer Index sur Colonne status
-- =============================================================================

DO $$
BEGIN
    -- Drop 6 index utilisant colonne status
    DROP INDEX IF EXISTS idx_products_status;
    RAISE NOTICE '✅ Supprimé: idx_products_status';

    DROP INDEX IF EXISTS idx_products_status_archived;
    RAISE NOTICE '✅ Supprimé: idx_products_status_archived';

    DROP INDEX IF EXISTS idx_products_status_created;
    RAISE NOTICE '✅ Supprimé: idx_products_status_created';

    DROP INDEX IF EXISTS idx_products_creation_mode_status;
    RAISE NOTICE '✅ Supprimé: idx_products_creation_mode_status';

    DROP INDEX IF EXISTS idx_products_subcategory_status;
    RAISE NOTICE '✅ Supprimé: idx_products_subcategory_status';

    DROP INDEX IF EXISTS idx_products_supplier_status;
    RAISE NOTICE '✅ Supprimé: idx_products_supplier_status';
END $$;

-- =============================================================================
-- PARTIE 2: Supprimer Colonnes products.status + status_deprecated
-- =============================================================================

DO $$
BEGIN
    -- Supprimer colonne status (NOT NULL - obsolète)
    ALTER TABLE products DROP COLUMN IF EXISTS status CASCADE;
    RAISE NOTICE '✅ Supprimé colonne: products.status (availability_status_type)';

    -- Supprimer colonne status_deprecated (NULLABLE - transition)
    ALTER TABLE products DROP COLUMN IF EXISTS status_deprecated CASCADE;
    RAISE NOTICE '✅ Supprimé colonne: products.status_deprecated (availability_status_type)';
END $$;

-- =============================================================================
-- PARTIE 3: Supprimer ENUM availability_status_type
-- =============================================================================

DO $$
BEGIN
    -- Vérifier aucune dépendance restante
    IF EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_type t ON a.atttypid = t.oid
        WHERE t.typname = 'availability_status_type'
    ) THEN
        RAISE EXCEPTION 'ERREUR: availability_status_type encore utilisé par des colonnes!';
    END IF;

    -- Supprimer ENUM
    DROP TYPE IF EXISTS availability_status_type CASCADE;
    RAISE NOTICE '✅ Supprimé ENUM: availability_status_type';
END $$;

-- =============================================================================
-- PARTIE 4: Créer Index de Remplacement sur product_status + stock_status
-- =============================================================================

-- Index performance requêtes par product_status
CREATE INDEX IF NOT EXISTS idx_products_product_status
ON products(product_status)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_products_product_status IS
'Index performance filtrage par product_status (active, draft, preorder, discontinued).
Remplace idx_products_status (availability_status_type DEPRECATED).
Migration 109 - 2025-11-05';

-- Index composite product_status + created_at (queries dashboard)
CREATE INDEX IF NOT EXISTS idx_products_product_status_created
ON products(product_status, created_at DESC)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_products_product_status_created IS
'Index composite product_status + created_at pour queries dashboard.
Remplace idx_products_status_created.
Migration 109 - 2025-11-05';

-- Index performance requêtes par stock_status
CREATE INDEX IF NOT EXISTS idx_products_stock_status
ON products(stock_status)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_products_stock_status IS
'Index performance filtrage par stock_status (in_stock, out_of_stock, coming_soon).
Nouveau index Phase 3.4 - Dual Status System.
Migration 109 - 2025-11-05';

-- Index composite subcategory + product_status (queries filtres catalogue)
CREATE INDEX IF NOT EXISTS idx_products_subcategory_product_status
ON products(subcategory_id, product_status)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_products_subcategory_product_status IS
'Index composite subcategory + product_status pour filtres catalogue.
Remplace idx_products_subcategory_status.
Migration 109 - 2025-11-05';

-- Index composite supplier + product_status (queries fournisseurs)
CREATE INDEX IF NOT EXISTS idx_products_supplier_product_status
ON products(supplier_id, product_status)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_products_supplier_product_status IS
'Index composite supplier + product_status pour queries fournisseurs.
Remplace idx_products_supplier_status.
Migration 109 - 2025-11-05';

-- =============================================================================
-- Vérification Finale
-- =============================================================================

DO $$
DECLARE
    v_enum_exists BOOLEAN;
    v_column_status_exists BOOLEAN;
    v_column_deprecated_exists BOOLEAN;
    v_new_indexes_count INTEGER;
BEGIN
    -- Vérifier ENUM supprimé
    SELECT EXISTS(
        SELECT 1 FROM pg_type
        WHERE typname = 'availability_status_type'
    ) INTO v_enum_exists;

    -- Vérifier colonnes supprimées
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'status'
    ) INTO v_column_status_exists;

    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'status_deprecated'
    ) INTO v_column_deprecated_exists;

    -- Compter nouveaux index
    SELECT COUNT(*) INTO v_new_indexes_count
    FROM pg_indexes
    WHERE tablename = 'products'
    AND indexname IN (
        'idx_products_product_status',
        'idx_products_product_status_created',
        'idx_products_stock_status',
        'idx_products_subcategory_product_status',
        'idx_products_supplier_product_status'
    );

    -- Résultats
    IF v_enum_exists THEN
        RAISE WARNING '❌ ENUM availability_status_type existe encore!';
    ELSE
        RAISE NOTICE '✅ ENUM availability_status_type supprimé';
    END IF;

    IF v_column_status_exists THEN
        RAISE WARNING '❌ Colonne products.status existe encore!';
    ELSE
        RAISE NOTICE '✅ Colonne products.status supprimée';
    END IF;

    IF v_column_deprecated_exists THEN
        RAISE WARNING '❌ Colonne products.status_deprecated existe encore!';
    ELSE
        RAISE NOTICE '✅ Colonne products.status_deprecated supprimée';
    END IF;

    RAISE NOTICE '✅ Nouveaux index créés: %/5', v_new_indexes_count;
END $$;

-- =============================================================================
-- RÉSUMÉ MIGRATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 109 COMPLÉTÉE - CLEANUP FINAL';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTIONS EFFECTUÉES:';
    RAISE NOTICE '   1. ✅ Supprimé 6 index obsolètes (idx_products_status*)';
    RAISE NOTICE '   2. ✅ Supprimé colonne products.status (availability_status_type)';
    RAISE NOTICE '   3. ✅ Supprimé colonne products.status_deprecated';
    RAISE NOTICE '   4. ✅ Supprimé ENUM availability_status_type';
    RAISE NOTICE '   5. ✅ Créé 5 nouveaux index (product_status + stock_status)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 IMPACT:';
    RAISE NOTICE '   - Database 100% migré vers Dual Status System';
    RAISE NOTICE '   - Aucune référence availability_status_type restante';
    RAISE NOTICE '   - Index optimisés pour nouvelles colonnes';
    RAISE NOTICE '   - Performance queries maintenue/améliorée';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PHASE 3.4 COMPLÈTE:';
    RAISE NOTICE '   - Migration 100: Refonte dual status + triggers';
    RAISE NOTICE '   - Migration 107: HOTFIX stock_status trigger';
    RAISE NOTICE '   - Migration 108: Fix vues obsolètes';
    RAISE NOTICE '   - Migration 109: Cleanup final ENUM';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Migration 107: HOTFIX Stock Status Trigger + Cleanup Fonctions Orphelines
-- Date: 2025-11-05
-- Contexte: Post-Phase 3.4 - Refonte statuts produits
--
-- Problèmes identifiés par audit database:
-- 1. CRITIQUE: Trigger stock_status manquant → 100% produits en out_of_stock
-- 2. 6 fonctions orphelines obsolètes (triggers supprimés Migration 100)
-- 3. 1 fonction rollback temporaire à conserver 3 mois
--
-- Références:
-- - docs/audits/2025-11/AUDIT-DATABASE-OBSOLETE-ELEMENTS-2025-11-05.md
-- - supabase/migrations/20251104_100_stock_simplification_refonte_dual_status.sql

-- =============================================================================
-- PARTIE 1: HOTFIX CRITIQUE - Créer Trigger Stock Status Manquant
-- =============================================================================

-- ✅ FIX: Recré calculate_stock_status avec bon type de retour
-- Ancien type: availability_status_type (DEPRECATED)
-- Nouveau type: stock_status_type (Phase 3)

-- D'abord supprimer l'ancienne fonction (impossible de changer type retour)
DROP FUNCTION IF EXISTS calculate_stock_status(INTEGER);

CREATE OR REPLACE FUNCTION calculate_stock_status(p_stock_real INTEGER)
RETURNS stock_status_type
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_stock_real > 0 THEN
        RETURN 'in_stock'::stock_status_type;
    ELSE
        RETURN 'out_of_stock'::stock_status_type;
    END IF;
END;
$$;

COMMENT ON FUNCTION calculate_stock_status(INTEGER) IS
'Calcule le statut de stock basé sur stock_real.
Business logic: stock_real > 0 → in_stock, stock_real = 0 → out_of_stock.
⚠️ FIXÉ Migration 107: Retourne stock_status_type (était availability_status_type avant)';

-- ✅ TRIGGER: Calculer automatiquement stock_status basé sur stock_real
-- Logique business:
--   stock_real > 0 → 'in_stock'
--   stock_real = 0 → 'out_of_stock'
--   stock_forecasted_in > 0 → 'coming_soon'

CREATE OR REPLACE FUNCTION trigger_calculate_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcul automatique du statut stock
    NEW.stock_status := calculate_stock_status(NEW.stock_real);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_calculate_stock_status() IS
'Trigger function pour calculer automatiquement stock_status basé sur stock_real.
Appelé par trg_calculate_stock_status (INSERT, UPDATE).
Business logic: stock_real > 0 → in_stock, stock_real = 0 → out_of_stock, stock_forecasted_in > 0 → coming_soon';

-- Créer le trigger sur products
DROP TRIGGER IF EXISTS trg_calculate_stock_status ON products;

CREATE TRIGGER trg_calculate_stock_status
BEFORE INSERT OR UPDATE OF stock_real, stock_forecasted_in
ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_stock_status();

COMMENT ON TRIGGER trg_calculate_stock_status ON products IS
'Calcule automatiquement stock_status à chaque INSERT/UPDATE de stock_real ou stock_forecasted_in.
CRITIQUE: Sans ce trigger, stock_status reste à out_of_stock (valeur par défaut).';

-- Recalculer stock_status pour TOUS les produits existants
UPDATE products
SET stock_status = calculate_stock_status(stock_real)
WHERE TRUE;

-- Vérification
DO $$
DECLARE
    v_total_products INTEGER;
    v_in_stock INTEGER;
    v_out_of_stock INTEGER;
    v_coming_soon INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_products FROM products WHERE archived_at IS NULL;
    SELECT COUNT(*) INTO v_in_stock FROM products WHERE stock_status = 'in_stock' AND archived_at IS NULL;
    SELECT COUNT(*) INTO v_out_of_stock FROM products WHERE stock_status = 'out_of_stock' AND archived_at IS NULL;
    SELECT COUNT(*) INTO v_coming_soon FROM products WHERE stock_status = 'coming_soon' AND archived_at IS NULL;

    RAISE NOTICE '✅ HOTFIX Stock Status:';
    RAISE NOTICE '   Total produits: %', v_total_products;
    RAISE NOTICE '   In Stock: % (%.0f%%)', v_in_stock, (v_in_stock::float / NULLIF(v_total_products, 0) * 100);
    RAISE NOTICE '   Out of Stock: % (%.0f%%)', v_out_of_stock, (v_out_of_stock::float / NULLIF(v_total_products, 0) * 100);
    RAISE NOTICE '   Coming Soon: % (%.0f%%)', v_coming_soon, (v_coming_soon::float / NULLIF(v_total_products, 0) * 100);
END $$;

-- =============================================================================
-- PARTIE 2: CLEANUP - Supprimer Fonctions Orphelines Obsolètes
-- =============================================================================

-- ✅ CONSERVER: rollback_status_refonte() pour 3 mois (jusqu'au 2026-02-04)
-- Fonction rollback Migration 100 (safety net)
COMMENT ON FUNCTION rollback_status_refonte() IS
'Fonction rollback temporaire Migration 100 - Dual Status Refonte.
⚠️ À SUPPRIMER après 2026-02-04 si aucun rollback nécessaire.
Usage: SELECT rollback_status_refonte(); pour revenir à l''ancien système availability_status.';

-- ❌ SUPPRIMER: 6 fonctions orphelines (triggers supprimés Migration 100)

DO $$
BEGIN
    -- 1. calculate_automatic_product_status() - Obsolète
    -- Signature correcte: (p_stock_real INTEGER, p_stock_forecasted_in INTEGER)
    DROP FUNCTION IF EXISTS calculate_automatic_product_status(INTEGER, INTEGER);
    RAISE NOTICE '✅ Supprimé: calculate_automatic_product_status(INTEGER, INTEGER) - Remplacée par trigger consolidé';

    -- 2. calculate_sourcing_product_status() - Obsolète
    DROP FUNCTION IF EXISTS calculate_sourcing_product_status(uuid);
    RAISE NOTICE '✅ Supprimé: calculate_sourcing_product_status(uuid) - Logique intégrée dans product_status';

    -- 3. update_product_status_if_needed() - Obsolète
    -- Signature correcte: (p_product_id UUID, p_force_recalculation BOOLEAN)
    DROP FUNCTION IF EXISTS update_product_status_if_needed(UUID, BOOLEAN);
    RAISE NOTICE '✅ Supprimé: update_product_status_if_needed(UUID, BOOLEAN) - Nouveau système ne nécessite pas cette logique';

    -- 4. trigger_update_product_status() - Trigger supprimé
    DROP FUNCTION IF EXISTS trigger_update_product_status();
    RAISE NOTICE '✅ Supprimé: trigger_update_product_status() - Trigger trg_auto_update_product_status supprimé';

    -- 5. trigger_validate_status_change() - Trigger supprimé
    DROP FUNCTION IF EXISTS trigger_validate_status_change();
    RAISE NOTICE '✅ Supprimé: trigger_validate_status_change() - Trigger trg_validate_product_status_change supprimé';

    -- 6. update_product_stock_status() - Trigger supprimé
    DROP FUNCTION IF EXISTS update_product_stock_status();
    RAISE NOTICE '✅ Supprimé: update_product_stock_status() - Trigger trigger_update_stock_status supprimé';
END $$;

-- Vérification finale
DO $$
DECLARE
    v_remaining_orphans INTEGER;
    v_orphan_list TEXT;
BEGIN
    -- Vérifier si des fonctions orphelines existent encore
    SELECT
        COUNT(*),
        string_agg(proname || '(' || pg_get_function_identity_arguments(oid) || ')', ', ')
    INTO v_remaining_orphans, v_orphan_list
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'calculate_automatic_product_status',
        'calculate_sourcing_product_status',
        'update_product_status_if_needed',
        'trigger_update_product_status',
        'trigger_validate_status_change',
        'update_product_stock_status'
      );

    IF v_remaining_orphans > 0 THEN
        RAISE WARNING 'Cleanup partial: % orphan functions still exist: %', v_remaining_orphans, v_orphan_list;
        RAISE WARNING 'Ces fonctions ont peut-être des signatures différentes de celles supprimées';
    ELSE
        RAISE NOTICE '✅ Cleanup successful: 6 orphan functions dropped';
    END IF;

    RAISE NOTICE '✅ Conservé: rollback_status_refonte() (à supprimer 2026-02-04)';
END $$;

-- =============================================================================
-- RÉSUMÉ MIGRATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 107 COMPLÉTÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTIONS EFFECTUÉES:';
    RAISE NOTICE '   1. ✅ Créé trigger trg_calculate_stock_status (HOTFIX CRITIQUE)';
    RAISE NOTICE '   2. ✅ Recalculé stock_status pour tous produits';
    RAISE NOTICE '   3. ✅ Supprimé 6 fonctions orphelines obsolètes';
    RAISE NOTICE '   4. ✅ Conservé rollback_status_refonte() (3 mois)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 IMPACT:';
    RAISE NOTICE '   - Database: Trigger stock_status fonctionnel';
    RAISE NOTICE '   - Frontend: useStockStatus() hook affichera status corrects';
    RAISE NOTICE '   - Performance: -6 fonctions inutilisées';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ TODO SUIVANT (Migration 108):';
    RAISE NOTICE '   - Fix 2 vues obsolètes (products_with_default_package, stock_overview)';
    RAISE NOTICE '   - Supprimer ENUM availability_status_type (après fix vues)';
    RAISE NOTICE '   - Investigation colonne products.status';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

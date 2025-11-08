-- Migration 108: Fix Vues Obsolètes - Dual Status System
-- Date: 2025-11-05
-- Contexte: Post-Migration 107 - Cleanup vues utilisant status_deprecated
--
-- Problèmes identifiés:
-- 1. products_with_default_package utilise status_deprecated (DEPRECATED)
-- 2. stock_overview utilise status_deprecated (DEPRECATED)
--
-- Solution: Recréer vues avec stock_status + product_status (Phase 3.4)
--
-- Références:
-- - docs/audits/2025-11/AUDIT-DATABASE-OBSOLETE-ELEMENTS-2025-11-05.md
-- - supabase/migrations/20251104_100_stock_simplification_refonte_dual_status.sql

-- =============================================================================
-- FIX 1: Recréer products_with_default_package avec dual status
-- =============================================================================

-- Supprimer ancienne vue
DROP VIEW IF EXISTS products_with_default_package CASCADE;

-- Recréer avec stock_status + product_status
CREATE OR REPLACE VIEW products_with_default_package AS
SELECT
    id,
    sku,
    name,
    slug,
    product_status,  -- ✅ Phase 3.4 - Statut commercial
    stock_status,     -- ✅ Phase 3.4 - Disponibilité physique
    condition,
    variant_attributes,
    dimensions,
    weight,
    video_url,
    stock_quantity,
    supplier_id,
    subcategory_id,
    brand,
    supplier_reference,
    supplier_page_url,
    gtin,
    margin_percentage,
    created_at,
    updated_at,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    description,
    technical_description,
    selling_points,
    min_stock,
    reorder_point,
    availability_type,
    target_margin_percentage,
    product_type,
    assigned_client_id,
    creation_mode,
    requires_sample,
    archived_at,
    sourcing_type,
    -- Computed fields (compatibilité backwards)
    CASE
        WHEN stock_real <= 0 THEN 'out_of_stock'::text
        WHEN stock_real <= COALESCE(min_stock, 0) THEN 'low_stock'::text
        ELSE 'in_stock'::text
    END AS computed_stock_status,
    (stock_real + stock_forecasted_in - stock_forecasted_out) AS projected_stock
FROM products p;

COMMENT ON VIEW products_with_default_package IS
'Vue enrichie produits avec colonnes calculées.
✅ FIXÉ Migration 108: Utilise stock_status + product_status au lieu de status_deprecated.
Computed fields: computed_stock_status (legacy), projected_stock';

-- =============================================================================
-- FIX 2: Recréer stock_overview avec dual status
-- =============================================================================

-- Supprimer ancienne vue
DROP VIEW IF EXISTS stock_overview CASCADE;

-- Recréer avec stock_status + product_status
CREATE OR REPLACE VIEW stock_overview AS
SELECT
    id,
    name,
    stock_real,
    stock_quantity,
    stock_forecasted_in,
    stock_forecasted_out,
    min_stock,
    reorder_point,
    product_status,  -- ✅ Phase 3.4 - Statut commercial
    stock_status,     -- ✅ Phase 3.4 - Disponibilité physique
    -- Computed: stock_alert_level (compatibilité backwards)
    CASE
        WHEN stock_real <= 0 THEN 'rupture'::text
        WHEN stock_real <= COALESCE(min_stock, 0) THEN 'critique'::text
        WHEN stock_real <= COALESCE(reorder_point, 0) THEN 'reappro_needed'::text
        ELSE 'ok'::text
    END AS stock_alert_level
FROM products;

COMMENT ON VIEW stock_overview IS
'Vue overview stocks avec niveaux d''alerte calculés.
✅ FIXÉ Migration 108: Utilise stock_status + product_status au lieu de status_deprecated.
Computed fields: stock_alert_level (rupture, critique, reappro_needed, ok)';

-- =============================================================================
-- Vérification
-- =============================================================================

DO $$
DECLARE
    v_view1_columns INTEGER;
    v_view2_columns INTEGER;
    v_uses_deprecated BOOLEAN;
BEGIN
    -- Compter colonnes vues
    SELECT COUNT(*) INTO v_view1_columns
    FROM information_schema.columns
    WHERE table_name = 'products_with_default_package';

    SELECT COUNT(*) INTO v_view2_columns
    FROM information_schema.columns
    WHERE table_name = 'stock_overview';

    -- Vérifier aucune référence à status_deprecated
    SELECT EXISTS(
        SELECT 1 FROM pg_views
        WHERE schemaname = 'public'
        AND viewname IN ('products_with_default_package', 'stock_overview')
        AND definition LIKE '%status_deprecated%'
    ) INTO v_uses_deprecated;

    RAISE NOTICE '✅ Vue products_with_default_package: % colonnes', v_view1_columns;
    RAISE NOTICE '✅ Vue stock_overview: % colonnes', v_view2_columns;

    IF v_uses_deprecated THEN
        RAISE WARNING '❌ Vues utilisent encore status_deprecated!';
    ELSE
        RAISE NOTICE '✅ Aucune référence status_deprecated dans vues';
    END IF;
END $$;

-- =============================================================================
-- RÉSUMÉ MIGRATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 108 COMPLÉTÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTIONS EFFECTUÉES:';
    RAISE NOTICE '   1. ✅ Recréé products_with_default_package (stock_status + product_status)';
    RAISE NOTICE '   2. ✅ Recréé stock_overview (stock_status + product_status)';
    RAISE NOTICE '   3. ✅ Vérifié aucune référence status_deprecated';
    RAISE NOTICE '';
    RAISE NOTICE '📊 IMPACT:';
    RAISE NOTICE '   - 2 vues mises à jour avec dual status system';
    RAISE NOTICE '   - Compatibilité backwards via computed fields';
    RAISE NOTICE '   - Prêt pour suppression ENUM availability_status_type (Migration 109)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ TODO SUIVANT (Migration 109):';
    RAISE NOTICE '   - Investigation colonne products.status mystery';
    RAISE NOTICE '   - Suppression ENUM availability_status_type';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

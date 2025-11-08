-- Migration 110: Set min_stock Default to 0
-- Date: 2025-11-05
-- Contexte: Configuration seuil minimum stock à 0 par défaut
--
-- Objectifs:
-- 1. Mettre tous les produits existants à min_stock = 0
-- 2. Changer DEFAULT colonne min_stock à 0 (au lieu de NULL/5)
--
-- Raison: Le seuil minimum sera basé sur le prévisionnel (à venir),
-- donc par défaut on part de 0 pour tous les produits.

-- =============================================================================
-- PARTIE 1: Update Produits Existants (16 produits)
-- =============================================================================

DO $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Mettre tous les produits à min_stock = 0
    UPDATE products
    SET min_stock = 0
    WHERE min_stock IS NULL OR min_stock != 0;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RAISE NOTICE '✅ % produits mis à jour avec min_stock = 0', v_updated_count;
END $$;

-- =============================================================================
-- PARTIE 2: Changer DEFAULT Colonne min_stock
-- =============================================================================

DO $$
BEGIN
    -- Changer DEFAULT de NULL à 0
    ALTER TABLE products
    ALTER COLUMN min_stock SET DEFAULT 0;

    RAISE NOTICE '✅ DEFAULT min_stock = 0 configuré';
END $$;

-- =============================================================================
-- PARTIE 3: Vérification
-- =============================================================================

DO $$
DECLARE
    v_products_with_zero INTEGER;
    v_products_with_nonzero INTEGER;
    v_total_products INTEGER;
    v_default_value TEXT;
BEGIN
    -- Compter produits avec min_stock = 0
    SELECT COUNT(*) INTO v_products_with_zero
    FROM products
    WHERE min_stock = 0;

    -- Compter produits avec min_stock != 0
    SELECT COUNT(*) INTO v_products_with_nonzero
    FROM products
    WHERE min_stock IS NOT NULL AND min_stock != 0;

    -- Total produits
    SELECT COUNT(*) INTO v_total_products
    FROM products;

    -- Vérifier DEFAULT value
    SELECT column_default INTO v_default_value
    FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'min_stock';

    -- Résultats
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION MIGRATION 110';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 PRODUITS:';
    RAISE NOTICE '   - Total: %', v_total_products;
    RAISE NOTICE '   - min_stock = 0: %', v_products_with_zero;
    RAISE NOTICE '   - min_stock != 0: %', v_products_with_nonzero;
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  CONFIGURATION:';
    RAISE NOTICE '   - DEFAULT min_stock: %', v_default_value;
    RAISE NOTICE '';

    IF v_products_with_nonzero > 0 THEN
        RAISE WARNING '❌ ATTENTION: % produits ont encore min_stock != 0', v_products_with_nonzero;
    ELSE
        RAISE NOTICE '✅ TOUS les produits ont min_stock = 0';
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- RÉSUMÉ MIGRATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 110 COMPLÉTÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTIONS EFFECTUÉES:';
    RAISE NOTICE '   1. ✅ UPDATE products SET min_stock = 0';
    RAISE NOTICE '   2. ✅ ALTER COLUMN min_stock SET DEFAULT 0';
    RAISE NOTICE '';
    RAISE NOTICE '📊 IMPACT:';
    RAISE NOTICE '   - Tous les produits existants: min_stock = 0';
    RAISE NOTICE '   - Nouveaux produits créés: min_stock = 0 par défaut';
    RAISE NOTICE '';
    RAISE NOTICE '🔮 TODO FUTUR:';
    RAISE NOTICE '   - Implémenter logique "seuil basé sur prévisionnel"';
    RAISE NOTICE '   - Utiliser stock_forecasted_in/out pour calcul automatique';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

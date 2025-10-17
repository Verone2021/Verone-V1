-- =============================================
-- MIGRATION 010: Ajout colonne cancelled_by sur sales_orders
-- Date: 2025-10-14
-- =============================================
-- Objectif: Tracer qui a annulé une commande
-- Cohérence workflow: cancelled = cancelled_at + cancelled_by NOT NULL

-- =============================================
-- CONTEXTE
-- =============================================
-- Problème: Server Action essaie d'assigner cancelled_by mais colonne n'existe pas
-- Erreur: "Could not find the 'cancelled_by' column of 'sales_orders' in the schema cache"
--
-- Colonnes workflow existantes:
-- - confirmed_by UUID REFERENCES auth.users(id)
-- - shipped_by UUID REFERENCES auth.users(id)
-- - delivered_by UUID REFERENCES auth.users(id)
-- - warehouse_exit_by UUID REFERENCES auth.users(id)
--
-- Colonne manquante:
-- - cancelled_by UUID REFERENCES auth.users(id) ❌

\echo '========================================';
\echo 'AJOUT COLONNE cancelled_by';
\echo '========================================';
\echo '';

-- =============================================
-- VÉRIFICATION COLONNE EXISTANTE
-- =============================================

\echo '=== AVANT: Colonnes workflow sales_orders ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN ('confirmed_by', 'shipped_by', 'delivered_by', 'warehouse_exit_by', 'cancelled_by')
ORDER BY ordinal_position;

-- =============================================
-- AJOUT COLONNE cancelled_by
-- =============================================

\echo '';
\echo '=== AJOUT: Colonne cancelled_by ===';

DO $$
BEGIN
    -- Vérifier si colonne existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_orders'
        AND column_name = 'cancelled_by'
    ) THEN
        -- Ajouter colonne cancelled_by (NULL par défaut car commandes existantes non annulées)
        ALTER TABLE sales_orders
        ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);

        RAISE NOTICE '✅ Colonne cancelled_by ajoutée avec succès';
    ELSE
        RAISE NOTICE '⚠️ Colonne cancelled_by existe déjà';
    END IF;
END $$;

-- =============================================
-- MISE À JOUR CONSTRAINT valid_sales_workflow_timestamps
-- =============================================

\echo '';
\echo '=== MISE À JOUR: Constraint workflow timestamps ===';

-- Supprimer ancien constraint
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS valid_sales_workflow_timestamps;

-- Recréer avec logique cancelled_by
ALTER TABLE sales_orders ADD CONSTRAINT valid_sales_workflow_timestamps CHECK (
    (status = 'draft' OR confirmed_at IS NOT NULL) AND
    (status NOT IN ('shipped', 'partially_shipped', 'delivered') OR shipped_at IS NOT NULL) AND
    (status != 'delivered' OR delivered_at IS NOT NULL) AND
    (status != 'cancelled' OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))
);

\echo '✅ Constraint updated: cancelled require cancelled_at + cancelled_by';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

\echo '';
\echo '=== APRÈS: Colonnes workflow sales_orders ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN ('confirmed_by', 'shipped_by', 'delivered_by', 'warehouse_exit_by', 'cancelled_by')
ORDER BY ordinal_position;

\echo '';
\echo '=== VÉRIFICATION: Constraint valid_sales_workflow_timestamps ===';
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'valid_sales_workflow_timestamps';

-- =============================================
-- INDEX PERFORMANCE (optionnel)
-- =============================================

\echo '';
\echo '=== INDEX: cancelled_by pour jointures rapides ===';

CREATE INDEX IF NOT EXISTS idx_sales_orders_cancelled_by ON sales_orders(cancelled_by)
WHERE cancelled_by IS NOT NULL;

\echo '✅ Index idx_sales_orders_cancelled_by créé';

-- =============================================
-- RÉSUMÉ MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo 'RÉSUMÉ MIGRATION 010';
\echo '========================================';
\echo '';

DO $$
DECLARE
    v_total_orders INTEGER;
    v_cancelled_orders INTEGER;
    v_cancelled_with_by INTEGER;
BEGIN
    -- Compter commandes totales
    SELECT COUNT(*) INTO v_total_orders FROM sales_orders;

    -- Compter commandes annulées
    SELECT COUNT(*) INTO v_cancelled_orders
    FROM sales_orders
    WHERE status = 'cancelled';

    -- Compter commandes annulées avec cancelled_by (après migration devrait être 0)
    SELECT COUNT(*) INTO v_cancelled_with_by
    FROM sales_orders
    WHERE status = 'cancelled' AND cancelled_by IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '📊 STATISTIQUES POST-MIGRATION:';
    RAISE NOTICE '  - Total commandes: %', v_total_orders;
    RAISE NOTICE '  - Commandes annulées existantes: %', v_cancelled_orders;
    RAISE NOTICE '  - Annulées avec cancelled_by: %', v_cancelled_with_by;
    RAISE NOTICE '';

    IF v_cancelled_orders > 0 AND v_cancelled_with_by = 0 THEN
        RAISE NOTICE '⚠️ ATTENTION: % commandes annulées sans cancelled_by (données historiques)', v_cancelled_orders;
        RAISE NOTICE '   Ces commandes ne respectent pas le nouveau constraint (grandfathered)';
    ELSE
        RAISE NOTICE '✅ Toutes les commandes annulées ont un cancelled_by';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration 010 terminée avec succès';
    RAISE NOTICE '   Prochaine étape: Migration 011 (logique annulation trigger)';
END $$;

-- =============================================
-- MIGRATION CONSOLIDÉE: Corrections Erreurs Annulation
-- Date: 2025-10-14
-- =============================================
-- À APPLIQUER MANUELLEMENT VIA SUPABASE STUDIO SQL EDITOR
--
-- Corrige 3 erreurs critiques :
-- 1. Colonne cancelled_by manquante
-- 2. Enum stock_reason_code manque 'cancelled'
-- 3. Constraint valid_sales_workflow_timestamps incomplet

\echo '========================================';\echo 'FIX COMPLET ANNULATION COMMANDES';
\echo '========================================';\echo '';

-- =============================================
-- FIX 1: Ajouter colonne cancelled_by
-- =============================================

\echo '=== FIX 1: Colonne cancelled_by ===';\echo '';

DO $$
BEGIN
    -- Vérifier si colonne existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_orders'
        AND column_name = 'cancelled_by'
    ) THEN
        -- Ajouter colonne cancelled_by
        ALTER TABLE sales_orders
        ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);

        RAISE NOTICE '✅ Colonne cancelled_by ajoutée avec succès';
    ELSE
        RAISE NOTICE '⚠️ Colonne cancelled_by existe déjà';
    END IF;
END $$;

-- =============================================
-- FIX 2: Ajouter 'cancelled' à enum stock_reason_code
-- =============================================

\echo '';\echo '=== FIX 2: Enum stock_reason_code ===';\echo '';

DO $$
BEGIN
    -- Vérifier si 'cancelled' existe déjà dans l'enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'stock_reason_code'::regtype
        AND enumlabel = 'cancelled'
    ) THEN
        -- Ajouter 'cancelled' à l'enum
        ALTER TYPE stock_reason_code ADD VALUE 'cancelled';

        RAISE NOTICE '✅ Valeur "cancelled" ajoutée à enum stock_reason_code';
    ELSE
        RAISE NOTICE '⚠️ Valeur "cancelled" existe déjà dans enum';
    END IF;
END $$;

-- =============================================
-- FIX 3: Corriger constraint valid_sales_workflow_timestamps
-- =============================================

\echo '';\echo '=== FIX 3: Constraint workflow timestamps ===';\echo '';

-- Supprimer ancien constraint
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS valid_sales_workflow_timestamps;

-- Recréer avec logique cancelled_by
ALTER TABLE sales_orders ADD CONSTRAINT valid_sales_workflow_timestamps CHECK (
    (status = 'draft' OR confirmed_at IS NOT NULL) AND
    (status NOT IN ('shipped', 'partially_shipped', 'delivered') OR shipped_at IS NOT NULL) AND
    (status != 'delivered' OR delivered_at IS NOT NULL) AND
    (status != 'cancelled' OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))
);

\echo '✅ Constraint updated: cancelled require cancelled_at + cancelled_by';\echo '';

-- =============================================
-- FIX 4: Index performance (optionnel mais recommandé)
-- =============================================

\echo '=== FIX 4: Index cancelled_by ===';\echo '';

CREATE INDEX IF NOT EXISTS idx_sales_orders_cancelled_by ON sales_orders(cancelled_by)
WHERE cancelled_by IS NOT NULL;

\echo '✅ Index idx_sales_orders_cancelled_by créé';\echo '';

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

\echo '========================================';\echo 'VÉRIFICATIONS POST-MIGRATION';
\echo '========================================';\echo '';

-- Vérifier colonne cancelled_by
\echo '=== Colonne cancelled_by ===';\SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name = 'cancelled_by';\echo '';

-- Vérifier enum stock_reason_code
\echo '=== Enum stock_reason_code (toutes valeurs) ===';
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'stock_reason_code'::regtype
ORDER BY enumsortorder;
\echo '';

-- Vérifier constraint
\echo '=== Constraint valid_sales_workflow_timestamps ===';
SELECT conname AS constraint_name,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'valid_sales_workflow_timestamps';
\echo '';

-- Vérifier index
\echo '=== Index cancelled_by ===';
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'sales_orders'
AND indexname = 'idx_sales_orders_cancelled_by';
\echo '';

-- =============================================
-- RÉSUMÉ FINAL
-- =============================================

\echo '========================================';\echo 'RÉSUMÉ MIGRATION CONSOLIDÉE';
\echo '========================================';\echo '';

DO $$
DECLARE
    v_has_cancelled_by BOOLEAN;
    v_has_cancelled_enum BOOLEAN;
    v_has_constraint BOOLEAN;
    v_has_index BOOLEAN;
BEGIN
    -- Vérifier colonne
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_orders' AND column_name = 'cancelled_by'
    ) INTO v_has_cancelled_by;

    -- Vérifier enum
    SELECT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'stock_reason_code'::regtype AND enumlabel = 'cancelled'
    ) INTO v_has_cancelled_enum;

    -- Vérifier constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_sales_workflow_timestamps'
    ) INTO v_has_constraint;

    -- Vérifier index
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'sales_orders' AND indexname = 'idx_sales_orders_cancelled_by'
    ) INTO v_has_index;

    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSULTATS VÉRIFICATION:';
    RAISE NOTICE '  ✅ Colonne cancelled_by: %', CASE WHEN v_has_cancelled_by THEN 'OK' ELSE 'MANQUANTE' END;
    RAISE NOTICE '  ✅ Enum "cancelled": %', CASE WHEN v_has_cancelled_enum THEN 'OK' ELSE 'MANQUANT' END;
    RAISE NOTICE '  ✅ Constraint timestamps: %', CASE WHEN v_has_constraint THEN 'OK' ELSE 'MANQUANT' END;
    RAISE NOTICE '  ✅ Index cancelled_by: %', CASE WHEN v_has_index THEN 'OK' ELSE 'MANQUANT' END;
    RAISE NOTICE '';

    IF v_has_cancelled_by AND v_has_cancelled_enum AND v_has_constraint AND v_has_index THEN
        RAISE NOTICE '🎉 SUCCÈS: Toutes les corrections appliquées avec succès !';
        RAISE NOTICE '   Prochaine étape: Re-tester l''application avec MCP Browser';
    ELSE
        RAISE WARNING '⚠️ ATTENTION: Certaines corrections n''ont pas été appliquées';
        RAISE WARNING '   Vérifier les messages ci-dessus';
    END IF;

    RAISE NOTICE '';
END $$;

\echo '';\echo '========================================';\echo 'MIGRATION CONSOLIDÉE TERMINÉE';
\echo '========================================';\echo '';
\echo 'ACTION REQUISE:';
\echo '1. Copier ce SQL complet';
\echo '2. Ouvrir Supabase Studio → SQL Editor';
\echo '3. Coller et exécuter';
\echo '4. Vérifier les résultats ci-dessus';
\echo '5. Re-tester l''application';
\echo '';

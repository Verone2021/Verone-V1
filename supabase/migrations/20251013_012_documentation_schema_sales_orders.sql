-- =============================================
-- MIGRATION 012: Documentation Schéma Sales Orders (READONLY)
-- Date: 2025-10-13
-- =============================================
-- Objectif: Documenter schéma actuel avant refonte architecture
-- Type: READONLY (SELECT uniquement, aucune modification)
-- Utilité: Informations nécessaires pour migrations 013-016

-- =============================================
-- SECTION 1: COLONNES SALES_ORDERS
-- =============================================

\echo '========================================';
\echo 'DOCUMENTATION SCHÉMA SALES ORDERS';
\echo '========================================';
\echo '';

\echo '=== SECTION 1: Colonnes Table sales_orders ===';
\echo '';

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN (
    'payment_required',
    'payment_status',
    'payment_terms',
    'customer_id',
    'customer_type',
    'ready_for_shipment',
    'warehouse_exit_at',
    'status'
)
ORDER BY ordinal_position;

\echo '';
\echo '--- Colonnes *_by (audit) ---';
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name LIKE '%\_by'
ORDER BY ordinal_position;

\echo '';
\echo '--- Colonnes *_at (timestamps) ---';
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name LIKE '%\_at'
ORDER BY ordinal_position;

-- =============================================
-- SECTION 2: ENUM sales_order_status
-- =============================================

\echo '';
\echo '=== SECTION 2: Enum sales_order_status ===';
\echo '';

SELECT
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = 'sales_order_status'::regtype
ORDER BY enumsortorder;

-- =============================================
-- SECTION 3: ENUM payment_status
-- =============================================

\echo '';
\echo '=== SECTION 3: Enum payment_status (si existe) ===';
\echo '';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        RAISE NOTICE 'Enum payment_status existe:';
        PERFORM enumlabel
        FROM pg_enum
        WHERE enumtypid = 'payment_status'::regtype;
    ELSE
        RAISE NOTICE 'Enum payment_status n''existe pas';
    END IF;
END $$;

SELECT
    enumlabel as payment_status_value,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = 'payment_status'::regtype
ORDER BY enumsortorder;

-- =============================================
-- SECTION 4: COLONNES ORGANISATIONS
-- =============================================

\echo '';
\echo '=== SECTION 4: Colonnes Table organisations ===';
\echo '';

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'organisations'
AND column_name IN (
    'payment_terms',
    'payment_conditions',
    'payment_required',
    'credit_limit',
    'payment_delay_days'
)
ORDER BY ordinal_position;

-- =============================================
-- SECTION 5: TRIGGERS SALES_ORDERS
-- =============================================

\echo '';
\echo '=== SECTION 5: Triggers Actifs sur sales_orders ===';
\echo '';

SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sales_orders'
ORDER BY trigger_name;

\echo '';
\echo '--- Focus: Triggers Stock ---';
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sales_orders'
AND (
    action_statement LIKE '%stock%'
    OR action_statement LIKE '%forecast%'
    OR trigger_name LIKE '%stock%'
)
ORDER BY trigger_name;

-- =============================================
-- SECTION 6: FONCTIONS TRIGGERS SALES_ORDERS
-- =============================================

\echo '';
\echo '=== SECTION 6: Fonctions Triggers Stock ===';
\echo '';

-- Liste fonctions
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    prokind as function_kind
FROM pg_proc
WHERE proname IN (
    'handle_sales_order_stock',
    'create_sales_order_forecast_movements',
    'trg_sales_orders_stock_automation'
)
ORDER BY proname;

-- =============================================
-- SECTION 7: TRIGGERS STOCK_MOVEMENTS
-- =============================================

\echo '';
\echo '=== SECTION 7: Triggers Actifs sur stock_movements ===';
\echo '';

SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'stock_movements'
AND (
    action_statement LIKE '%recalculate%'
    OR action_statement LIKE '%coherence%'
    OR action_statement LIKE '%forecast%'
)
ORDER BY trigger_name;

-- =============================================
-- SECTION 8: CONTRAINTES SALES_ORDERS
-- =============================================

\echo '';
\echo '=== SECTION 8: Contraintes Check sur sales_orders ===';
\echo '';

SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'sales_orders'::regclass
AND contype = 'c'  -- Check constraints
ORDER BY conname;

-- =============================================
-- SECTION 9: FOREIGN KEYS SALES_ORDERS
-- =============================================

\echo '';
\echo '=== SECTION 9: Foreign Keys sales_orders ===';
\echo '';

SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as foreign_key_definition
FROM pg_constraint
WHERE conrelid = 'sales_orders'::regclass
AND contype = 'f'  -- Foreign key constraints
ORDER BY conname;

-- =============================================
-- SECTION 10: DONNÉES EXEMPLE (1 sample)
-- =============================================

\echo '';
\echo '=== SECTION 10: Exemple Données sales_orders ===';
\echo '';

\echo '--- 1 exemple Sales Order ---';
SELECT
    order_number,
    status,
    payment_status,
    customer_type,
    created_at::date,
    confirmed_at IS NOT NULL as has_confirmed_at,
    ready_for_shipment,
    warehouse_exit_at IS NOT NULL as has_warehouse_exit
FROM sales_orders
ORDER BY created_at DESC
LIMIT 1;

\echo '';
\echo '--- 1 exemple Organisation (customer) ---';
SELECT
    name,
    organisation_type,
    id
FROM organisations
WHERE organisation_type = 'customer'
ORDER BY created_at DESC
LIMIT 1;

-- =============================================
-- SECTION 11: ANALYSE ARCHITECTURE ACTUELLE
-- =============================================

\echo '';
\echo '=== SECTION 11: Analyse Architecture ===';
\echo '';

DO $$
DECLARE
    v_payment_required_exists BOOLEAN;
    v_payment_terms_org_exists BOOLEAN;
    v_triggers_count INTEGER;
    v_stock_triggers_count INTEGER;
BEGIN
    -- Check payment_required sur sales_orders
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_orders'
        AND column_name = 'payment_required'
    ) INTO v_payment_required_exists;

    -- Check payment_terms sur organisations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organisations'
        AND column_name IN ('payment_terms', 'payment_conditions')
    ) INTO v_payment_terms_org_exists;

    -- Count triggers sales_orders
    SELECT COUNT(*) INTO v_triggers_count
    FROM information_schema.triggers
    WHERE event_object_table = 'sales_orders';

    -- Count triggers stock sur sales_orders
    SELECT COUNT(*) INTO v_stock_triggers_count
    FROM information_schema.triggers
    WHERE event_object_table = 'sales_orders'
    AND (
        action_statement LIKE '%stock%'
        OR action_statement LIKE '%forecast%'
        OR trigger_name LIKE '%stock%'
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ANALYSE ARCHITECTURE ACTUELLE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Colonne payment_required sur sales_orders: %',
        CASE WHEN v_payment_required_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE 'Colonne payment_terms sur organisations: %',
        CASE WHEN v_payment_terms_org_exists THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers sur sales_orders: %', v_triggers_count;
    RAISE NOTICE 'Triggers STOCK sur sales_orders: %', v_stock_triggers_count;
    RAISE NOTICE '';
    IF v_stock_triggers_count > 1 THEN
        RAISE WARNING '⚠️ DUPLICATION: % triggers stock sur sales_orders (attendu: 1)', v_stock_triggers_count;
        RAISE WARNING '→ Risque création doublons mouvements stock';
        RAISE WARNING '→ Migration 013 nécessaire: DROP triggers doublons';
    ELSE
        RAISE NOTICE '✅ Architecture triggers OK: 1 seul trigger stock';
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 012 exécutée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Type: READONLY (documentation uniquement)';
    RAISE NOTICE '';
    RAISE NOTICE 'Documentation complète:';
    RAISE NOTICE '  - Colonnes sales_orders (payment_required? payment_status?)';
    RAISE NOTICE '  - Colonnes organisations (payment_terms?)';
    RAISE NOTICE '  - Enum sales_order_status et payment_status';
    RAISE NOTICE '  - Triggers actifs (duplication?)';
    RAISE NOTICE '  - Contraintes et foreign keys';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Utilisation: Informations pour migrations 013-016';
    RAISE NOTICE '========================================';
END $$;

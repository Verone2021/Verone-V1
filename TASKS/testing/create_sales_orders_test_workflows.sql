-- =============================================
-- TESTS E2E: Sales Orders - 2 Workflows (Prépaiement + Encours)
-- Date: 2025-10-13
-- =============================================
-- Objectif: Tester 2 workflows distincts avec migrations 013-016
-- Workflow A (PRÉPAIEMENT): confirmed → forecast → paid → real
-- Workflow B (ENCOURS): confirmed → real direct (validation auto)

-- =============================================
-- DONNÉES TEST: Clients & Produits
-- =============================================

-- Client ENCOURS existant
-- e73fcded-af15-4110-8f25-139c31a9fc65 | Pokawa Gare Lyon Part Dieu | prepayment_required=FALSE

-- Produits disponibles (après cleanup)
-- Milo Beige: stock_real=40
-- Milo Bleu: stock_forecasted_in=10 (PO confirmed)

-- =============================================
-- TEST 1: PRÉPAIEMENT - Workflow Complet
-- =============================================

\echo '========================================';
\echo 'TEST SO-PREPAY-001: Workflow Prépaiement Complet';
\echo '========================================';
\echo '';

\echo '--- Création SO Prépaiement (Milo Beige, 5 unités) ---';

INSERT INTO sales_orders (
    order_number,
    customer_id,
    customer_type,
    status,
    payment_status,
    payment_required,  -- TRUE = PRÉPAIEMENT
    total_ttc,
    created_by,
    created_at,
    updated_at
) VALUES (
    'SO-PREPAY-001',
    (SELECT id FROM organisations WHERE name = 'Pokawa Gare Lyon Part Dieu' LIMIT 1),
    'organization',
    'draft',
    'pending',
    TRUE,  -- PRÉPAIEMENT (attente paiement avant livraison)
    2500.00,
    '9eb44c44-16b6-4605-9a1a-5380b58c8ab2',
    NOW(),
    NOW()
);

-- Ajouter item
INSERT INTO sales_order_items (
    sales_order_id,
    product_id,
    quantity,
    unit_price_ht,
    created_at
) VALUES (
    (SELECT id FROM sales_orders WHERE order_number = 'SO-PREPAY-001'),
    (SELECT id FROM products WHERE name = 'Fauteuil Milo - Beige' LIMIT 1),
    5,
    450.00,
    NOW()
);

\echo '✅ SO-PREPAY-001 créée (draft)';

-- =============================================
-- TEST 2: PRÉPAIEMENT - Annulation Forecast
-- =============================================

\echo '';
\echo '========================================';
\echo 'TEST SO-PREPAY-002: Workflow Prépaiement Annulé';
\echo '========================================';
\echo '';

\echo '--- Création SO Prépaiement (Milo Beige, 3 unités) ---';

INSERT INTO sales_orders (
    order_number,
    customer_id,
    customer_type,
    status,
    payment_status,
    payment_required,
    total_ttc,
    created_by,
    created_at,
    updated_at
) VALUES (
    'SO-PREPAY-002',
    (SELECT id FROM organisations WHERE name = 'Pokawa Gare Lyon Part Dieu' LIMIT 1),
    'organization',
    'draft',
    'pending',
    TRUE,  -- PRÉPAIEMENT
    1500.00,
    '9eb44c44-16b6-4605-9a1a-5380b58c8ab2',
    NOW(),
    NOW()
);

INSERT INTO sales_order_items (
    sales_order_id,
    product_id,
    quantity,
    unit_price_ht,
    created_at
) VALUES (
    (SELECT id FROM sales_orders WHERE order_number = 'SO-PREPAY-002'),
    (SELECT id FROM products WHERE name = 'Fauteuil Milo - Beige' LIMIT 1),
    3,
    450.00,
    NOW()
);

\echo '✅ SO-PREPAY-002 créée (draft)';

-- =============================================
-- TEST 3: ENCOURS - Workflow Direct
-- =============================================

\echo '';
\echo '========================================';
\echo 'TEST SO-ENCOURS-001: Workflow Encours Direct';
\echo '========================================';
\echo '';

\echo '--- Création SO Encours (Milo Beige, 10 unités) ---';

INSERT INTO sales_orders (
    order_number,
    customer_id,
    customer_type,
    status,
    payment_status,
    payment_required,  -- FALSE = ENCOURS
    total_ttc,
    created_by,
    created_at,
    updated_at
) VALUES (
    'SO-ENCOURS-001',
    (SELECT id FROM organisations WHERE name = 'Pokawa Gare Lyon Part Dieu' LIMIT 1),
    'organization',
    'draft',
    'pending',
    FALSE,  -- ENCOURS (validation auto + livraison immédiate)
    5000.00,
    '9eb44c44-16b6-4605-9a1a-5380b58c8ab2',
    NOW(),
    NOW()
);

INSERT INTO sales_order_items (
    sales_order_id,
    product_id,
    quantity,
    unit_price_ht,
    created_at
) VALUES (
    (SELECT id FROM sales_orders WHERE order_number = 'SO-ENCOURS-001'),
    (SELECT id FROM products WHERE name = 'Fauteuil Milo - Beige' LIMIT 1),
    10,
    450.00,
    NOW()
);

\echo '✅ SO-ENCOURS-001 créée (draft)';

-- =============================================
-- TEST 4: ENCOURS - Annulation Réelle
-- =============================================

\echo '';
\echo '========================================';
\echo 'TEST SO-ENCOURS-002: Workflow Encours Annulé';
\echo '========================================';
\echo '';

\echo '--- Création SO Encours (Milo Beige, 7 unités) ---';

INSERT INTO sales_orders (
    order_number,
    customer_id,
    customer_type,
    status,
    payment_status,
    payment_required,
    total_ttc,
    created_by,
    created_at,
    updated_at
) VALUES (
    'SO-ENCOURS-002',
    (SELECT id FROM organisations WHERE name = 'Pokawa Gare Lyon Part Dieu' LIMIT 1),
    'organization',
    'draft',
    'pending',
    FALSE,  -- ENCOURS
    3500.00,
    '9eb44c44-16b6-4605-9a1a-5380b58c8ab2',
    NOW(),
    NOW()
);

INSERT INTO sales_order_items (
    sales_order_id,
    product_id,
    quantity,
    unit_price_ht,
    created_at
) VALUES (
    (SELECT id FROM sales_orders WHERE order_number = 'SO-ENCOURS-002'),
    (SELECT id FROM products WHERE name = 'Fauteuil Milo - Beige' LIMIT 1),
    7,
    450.00,
    NOW()
);

\echo '✅ SO-ENCOURS-002 créée (draft)';

-- =============================================
-- VÉRIFICATION DONNÉES CRÉÉES
-- =============================================

\echo '';
\echo '========================================';
\echo 'VÉRIFICATION: 4 SO Test créées';
\echo '========================================';
\echo '';

\echo '--- Sales Orders ---';
SELECT
    order_number,
    status,
    payment_required,
    payment_status,
    total_ttc,
    created_at::date
FROM sales_orders
WHERE order_number LIKE 'SO-PREPAY-%' OR order_number LIKE 'SO-ENCOURS-%'
ORDER BY order_number;

\echo '';
\echo '--- Items ---';
SELECT
    so.order_number,
    p.name as product_name,
    soi.quantity,
    soi.unit_price_ht
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
JOIN products p ON p.id = soi.product_id
WHERE so.order_number LIKE 'SO-PREPAY-%' OR so.order_number LIKE 'SO-ENCOURS-%'
ORDER BY so.order_number;

\echo '';
\echo '--- Stock Milo Beige AVANT Tests ---';
SELECT
    name,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_disponible
FROM products
WHERE name = 'Fauteuil Milo - Beige';

-- =============================================
-- VALIDATION
-- =============================================

DO $$
DECLARE
    v_so_count INTEGER;
    v_prepay_count INTEGER;
    v_encours_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_so_count
    FROM sales_orders
    WHERE order_number LIKE 'SO-PREPAY-%' OR order_number LIKE 'SO-ENCOURS-%';

    SELECT COUNT(*) INTO v_prepay_count
    FROM sales_orders
    WHERE order_number LIKE 'SO-PREPAY-%' AND payment_required = TRUE;

    SELECT COUNT(*) INTO v_encours_count
    FROM sales_orders
    WHERE order_number LIKE 'SO-ENCOURS-%' AND payment_required = FALSE;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDATION CRÉATION SO TEST';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total SO créées: % (attendu: 4)', v_so_count;
    RAISE NOTICE '  - PRÉPAIEMENT (payment_required=TRUE): % (attendu: 2)', v_prepay_count;
    RAISE NOTICE '  - ENCOURS (payment_required=FALSE): % (attendu: 2)', v_encours_count;
    RAISE NOTICE '';

    IF v_so_count = 4 AND v_prepay_count = 2 AND v_encours_count = 2 THEN
        RAISE NOTICE '✅ Création SO Test réussie';
        RAISE NOTICE '';
        RAISE NOTICE 'Tests prêts:';
        RAISE NOTICE '  1. SO-PREPAY-001: draft → confirmed → paid → shipped';
        RAISE NOTICE '  2. SO-PREPAY-002: draft → confirmed → cancelled';
        RAISE NOTICE '  3. SO-ENCOURS-001: draft → confirmed (direct real) → shipped';
        RAISE NOTICE '  4. SO-ENCOURS-002: draft → confirmed (direct real) → cancelled';
    ELSE
        RAISE WARNING '⚠️ Erreur création: SO=%, Prepay=%, Encours=%', v_so_count, v_prepay_count, v_encours_count;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- LOG CRÉATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 4 SO Test créées avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRÉPAIEMENT (2 tests):';
    RAISE NOTICE '  - SO-PREPAY-001: Milo Beige, 5 unités (workflow complet)';
    RAISE NOTICE '  - SO-PREPAY-002: Milo Beige, 3 unités (annulation)';
    RAISE NOTICE '';
    RAISE NOTICE 'ENCOURS (2 tests):';
    RAISE NOTICE '  - SO-ENCOURS-001: Milo Beige, 10 unités (workflow direct)';
    RAISE NOTICE '  - SO-ENCOURS-002: Milo Beige, 7 unités (annulation + restore)';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Exécuter tests E2E (4 workflows)';
    RAISE NOTICE '========================================';
END $$;

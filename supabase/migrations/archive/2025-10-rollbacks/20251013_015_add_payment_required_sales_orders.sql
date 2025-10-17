-- =============================================
-- MIGRATION 015: Ajout colonne payment_required sur sales_orders
-- Date: 2025-10-13
-- =============================================
-- Objectif: Distinguer workflows prépaiement vs encours
-- Workflow A (payment_required=TRUE): confirmed → forecast → paid → real
-- Workflow B (payment_required=FALSE): confirmed → real direct (auto-validation)

-- =============================================
-- ANALYSE BESOIN MÉTIER
-- =============================================

-- Client PRÉPAIEMENT (payment_required=TRUE):
--   1. SO draft → confirmed: stock_forecasted_out augmente (réservation)
--   2. Attend payment_status='paid'
--   3. Paid → warehouse_exit: stock_real diminue + forecast annulé
--
-- Client ENCOURS (payment_required=FALSE):
--   1. SO draft → confirmed: Validation AUTOMATIQUE
--   2. Pas de prévisionnel: stock_real diminue DIRECTEMENT
--   3. Livraison immédiate possible (ready_for_shipment=TRUE)
--
-- Règle métier: Encours = confiance client → validation automatique
--               Prépaiement = sécurité → attente paiement

-- =============================================
-- VÉRIFICATION COLONNE EXISTANTE
-- =============================================

\echo '========================================';
\echo 'AJOUT COLONNE payment_required';
\echo '========================================';
\echo '';

\echo '=== AVANT: Colonnes sales_orders (payment) ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN ('payment_required', 'payment_status', 'payment_terms')
ORDER BY ordinal_position;

-- =============================================
-- AJOUT COLONNE payment_required
-- =============================================

\echo '';
\echo '=== AJOUT: Colonne payment_required ===';

DO $$
BEGIN
    -- Vérifier si colonne existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales_orders'
        AND column_name = 'payment_required'
    ) THEN
        -- Ajouter colonne avec DEFAULT TRUE (sécurité: prépaiement par défaut)
        ALTER TABLE sales_orders
        ADD COLUMN payment_required BOOLEAN DEFAULT TRUE NOT NULL;

        RAISE NOTICE '✅ Colonne payment_required ajoutée (DEFAULT TRUE)';
    ELSE
        RAISE NOTICE '⚠️ Colonne payment_required existe déjà';
    END IF;
END $$;

-- =============================================
-- CALCUL VALEURS INITIALES (depuis organisations)
-- =============================================

\echo '';
\echo '=== CALCUL: Valeurs initiales depuis organisations ===';

-- Stratégie:
-- 1. Si organisation.payment_terms contient 'encours' → payment_required=FALSE
-- 2. Sinon (ou NULL) → payment_required=TRUE (sécurité)

DO $$
DECLARE
    v_updated_encours INTEGER := 0;
    v_updated_prepay INTEGER := 0;
    v_total_so INTEGER := 0;
BEGIN
    -- Compter total SO
    SELECT COUNT(*) INTO v_total_so FROM sales_orders;

    -- Mettre à jour encours (payment_required=FALSE)
    UPDATE sales_orders so
    SET payment_required = FALSE
    FROM organisations org
    WHERE so.customer_id = org.id
    AND org.organisation_type = 'customer'
    AND (
        LOWER(org.payment_terms) LIKE '%encours%'
        OR LOWER(org.payment_terms) LIKE '%credit%'
        OR LOWER(org.payment_conditions) LIKE '%encours%'
    );

    GET DIAGNOSTICS v_updated_encours = ROW_COUNT;

    -- Mettre à jour prépaiement (payment_required=TRUE)
    -- Pas besoin si DEFAULT TRUE déjà appliqué, mais explicite pour les anciennes lignes
    UPDATE sales_orders so
    SET payment_required = TRUE
    FROM organisations org
    WHERE so.customer_id = org.id
    AND org.organisation_type = 'customer'
    AND so.payment_required IS NULL;

    GET DIAGNOSTICS v_updated_prepay = ROW_COUNT;

    RAISE NOTICE '';
    RAISE NOTICE 'Calcul valeurs initiales terminé:';
    RAISE NOTICE '  - Total sales_orders: %', v_total_so;
    RAISE NOTICE '  - Clients ENCOURS (payment_required=FALSE): %', v_updated_encours;
    RAISE NOTICE '  - Clients PRÉPAIEMENT (payment_required=TRUE): %', v_total_so - v_updated_encours;
    RAISE NOTICE '';
END $$;

-- =============================================
-- VÉRIFICATION RÉSULTAT
-- =============================================

\echo '';
\echo '=== APRÈS: Colonne payment_required ajoutée ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name IN ('payment_required', 'payment_status', 'payment_terms')
ORDER BY ordinal_position;

\echo '';
\echo '=== STATISTIQUES: Répartition payment_required ===';
SELECT
    payment_required,
    COUNT(*) as count_orders,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sales_orders
GROUP BY payment_required
ORDER BY payment_required;

-- =============================================
-- EXEMPLES DONNÉES
-- =============================================

\echo '';
\echo '=== EXEMPLES: Sales Orders par type payment ===';

\echo '';
\echo '--- Clients ENCOURS (payment_required=FALSE) ---';
SELECT
    so.order_number,
    org.name as customer_name,
    org.payment_terms,
    so.payment_required,
    so.status,
    so.payment_status
FROM sales_orders so
JOIN organisations org ON org.id = so.customer_id
WHERE so.payment_required = FALSE
ORDER BY so.created_at DESC
LIMIT 3;

\echo '';
\echo '--- Clients PRÉPAIEMENT (payment_required=TRUE) ---';
SELECT
    so.order_number,
    org.name as customer_name,
    org.payment_terms,
    so.payment_required,
    so.status,
    so.payment_status
FROM sales_orders so
JOIN organisations org ON org.id = so.customer_id
WHERE so.payment_required = TRUE
ORDER BY so.created_at DESC
LIMIT 3;

-- =============================================
-- COMMENTAIRE COLONNE
-- =============================================

COMMENT ON COLUMN sales_orders.payment_required IS
'Indique si paiement requis AVANT livraison (workflow prépaiement vs encours).
TRUE = PRÉPAIEMENT: SO confirmed → forecast → payment → real (workflow sécurisé)
FALSE = ENCOURS: SO confirmed → real direct (validation automatique, livraison immédiate)
Calculé depuis organisations.payment_terms lors création SO.
DEFAULT TRUE pour sécurité (prépaiement par défaut si non spécifié).';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 015 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Colonne ajoutée: sales_orders.payment_required';
    RAISE NOTICE '';
    RAISE NOTICE 'Type: BOOLEAN NOT NULL DEFAULT TRUE';
    RAISE NOTICE 'Valeurs:';
    RAISE NOTICE '  - TRUE = Prépaiement (forecast → payment → real)';
    RAISE NOTICE '  - FALSE = Encours (confirmed → real direct)';
    RAISE NOTICE '';
    RAISE NOTICE 'Calcul initial:';
    RAISE NOTICE '  - Depuis organisations.payment_terms';
    RAISE NOTICE '  - ENCOURS: payment_terms LIKE ''%encours%'' → FALSE';
    RAISE NOTICE '  - Autres: DEFAULT TRUE (sécurité)';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Prochaine étape: Migration 016 (rewrite handle_sales_order_stock)';
    RAISE NOTICE '========================================';
END $$;

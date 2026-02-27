-- =============================================
-- REFONTE WORKFLOWS COMMANDES - 2025-10-13
-- =============================================
-- Objectif: Cleanup + Création données test diversifiées
-- Usage: Copier-coller dans Supabase SQL Editor
-- =============================================

\echo '========================================';
\echo 'REFONTE WORKFLOWS - PHASE 1: VÉRIFICATION';
\echo '========================================';
\echo '';

-- Vérifier état actuel
\echo '=== ÉTAT ACTUEL DE LA BASE ===';
SELECT
    'sales_orders' as table_name,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE status = 'draft') as draft,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
    COUNT(*) FILTER (WHERE payment_required = true) as prepayment,
    COUNT(*) FILTER (WHERE payment_required = false) as credit_terms
FROM sales_orders;

SELECT
    'purchase_orders' as table_name,
    COUNT(*) as count
FROM purchase_orders;

SELECT
    'organisations' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE organisation_type = 'customer') as customers,
    COUNT(*) FILTER (WHERE organisation_type = 'supplier') as suppliers
FROM organisations;

SELECT
    'products' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE stock_real > 10) as in_stock,
    COUNT(*) FILTER (WHERE stock_real BETWEEN 1 AND 10) as low_stock,
    COUNT(*) FILTER (WHERE stock_real = 0) as out_of_stock
FROM products;

\echo '';
\echo '========================================';
\echo 'REFONTE WORKFLOWS - PHASE 2: CLEANUP';
\echo '========================================';
\echo '';

-- BACKUP IMPORTANT: Créer backup avant suppression
\echo '⚠️  BACKUP RECOMMENDÉ avant d''ex\u00e9cuter le cleanup!';
\echo '';

-- Supprimer les mouvements stock liés aux commandes
\echo '=== SUPPRESSION: Mouvements stock ===';
DELETE FROM stock_movements
WHERE reference_type IN ('sales_order', 'sales_order_forecast', 'purchase_order', 'purchase_order_forecast');

-- Obtenir le nombre de lignes supprimées
DO $$
DECLARE
    v_deleted_movements INTEGER;
BEGIN
    GET DIAGNOSTICS v_deleted_movements = ROW_COUNT;
    RAISE NOTICE '✅ % mouvements stock supprimés', v_deleted_movements;
END $$;

\echo '=== SUPPRESSION: Commandes clients ===';
DELETE FROM sales_order_items;
DELETE FROM sales_orders;

DO $$
DECLARE
    v_deleted_so INTEGER;
BEGIN
    GET DIAGNOSTICS v_deleted_so = ROW_COUNT;
    RAISE NOTICE '✅ % commandes clients supprimées', v_deleted_so;
END $$;

\echo '=== SUPPRESSION: Commandes fournisseurs ===';
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;

DO $$
DECLARE
    v_deleted_po INTEGER;
BEGIN
    GET DIAGNOSTICS v_deleted_po = ROW_COUNT;
    RAISE NOTICE '✅ % commandes fournisseurs supprimées', v_deleted_po;
END $$;

\echo '=== RESET: Séquences numéros commandes ===';
UPDATE sequences
SET current_value = 1
WHERE sequence_type = 'sales_order';

UPDATE sequences
SET current_value = 1
WHERE sequence_type = 'purchase_order';

RAISE NOTICE '✅ Séquences réinitialisées';

\echo '';
\echo '========================================';
\echo 'REFONTE WORKFLOWS - PHASE 3: ORGANISATIONS B2B';
\echo '========================================';
\echo '';

-- Récupérer l'ID de l'utilisateur admin pour created_by
DO $$
DECLARE
    v_admin_id UUID;
    v_org_id UUID;
BEGIN
    -- Trouver premier utilisateur owner/admin
    SELECT user_id INTO v_admin_id
    FROM user_profiles
    WHERE role IN ('owner', 'admin')
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur admin trouvé';
    END IF;

    RAISE NOTICE 'Utilisateur admin: %', v_admin_id;

    -- ========================================
    -- CLIENTS AVEC ENCOURS (payment_required=FALSE)
    -- ========================================

    \echo '=== CRÉATION: Clients ENCOURS (auto-validation) ===';

    -- Client Encours 1: Hotel Le Luxe (déjà existant normalement)
    -- Vérifier si existe déjà
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE name = 'Hotel Le Luxe') THEN
        INSERT INTO organisations (
            name, slug, organisation_type, email, country, is_active,
            payment_terms, prepayment_required,
            billing_address_line1, billing_city, billing_postal_code, billing_country,
            created_by
        ) VALUES (
            'Hotel Le Luxe',
            'hotel-le-luxe',
            'customer',
            'contact@hotel-le-luxe.fr',
            'FR',
            true,
            'NET30 - Encours autorisé',
            false,
            '45 Avenue des Champs-Élysées',
            'Paris',
            '75008',
            'FR',
            v_admin_id
        );
        RAISE NOTICE '✅ Hotel Le Luxe créé (ENCOURS)';
    ELSE
        -- Mettre à jour pour s'assurer qu'il est bien en encours
        UPDATE organisations
        SET prepayment_required = false,
            payment_terms = 'NET30 - Encours autorisé'
        WHERE name = 'Hotel Le Luxe';
        RAISE NOTICE '✅ Hotel Le Luxe mis à jour (ENCOURS)';
    END IF;

    -- Client Encours 2
    INSERT INTO organisations (
        name, slug, organisation_type, email, country, is_active,
        payment_terms, prepayment_required,
        billing_address_line1, billing_city, billing_postal_code, billing_country,
        created_by
    ) VALUES (
        'Château de Fontainebleau Boutique',
        'chateau-fontainebleau',
        'customer',
        'boutique@chateaudefontainebleau.fr',
        'FR',
        true,
        'NET45 - Encours autorisé',
        false,
        'Place du Général de Gaulle',
        'Fontainebleau',
        '77300',
        'FR',
        v_admin_id
    ) RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Château de Fontainebleau créé (ENCOURS): %', v_org_id;

    -- Client Encours 3
    INSERT INTO organisations (
        name, slug, organisation_type, email, country, is_active,
        payment_terms, prepayment_required,
        billing_address_line1, billing_city, billing_postal_code, billing_country,
        created_by
    ) VALUES (
        'Musée d''Orsay Boutique',
        'musee-orsay',
        'customer',
        'boutique@musee-orsay.fr',
        'FR',
        true,
        'NET60 - Encours autorisé',
        false,
        '1 Rue de la Légion d''Honneur',
        'Paris',
        '75007',
        'FR',
        v_admin_id
    ) RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Musée d''Orsay créé (ENCOURS): %', v_org_id;

    -- Client Encours 4
    INSERT INTO organisations (
        name, slug, organisation_type, email, country, is_active,
        payment_terms, prepayment_required,
        billing_address_line1, billing_city, billing_postal_code, billing_country,
        created_by
    ) VALUES (
        'Grand Hotel du Palais Royal',
        'grand-hotel-palais-royal',
        'customer',
        'achat@grandhotelpalaisroyal.fr',
        'FR',
        true,
        'NET30 - Encours autorisé',
        false,
        '4 Rue de Valois',
        'Paris',
        '75001',
        'FR',
        v_admin_id
    ) RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Grand Hotel du Palais Royal créé (ENCOURS): %', v_org_id;

    -- ========================================
    -- CLIENTS AVEC PRÉPAIEMENT (payment_required=TRUE)
    -- ========================================

    \echo '=== CRÉATION: Clients PRÉPAIEMENT (validation manuelle) ===';

    -- Client Prépaiement 1
    INSERT INTO organisations (
        name, slug, organisation_type, email, country, is_active,
        payment_terms, prepayment_required,
        billing_address_line1, billing_city, billing_postal_code, billing_country,
        created_by
    ) VALUES (
        'Boutique Décor Lyon',
        'boutique-decor-lyon',
        'customer',
        'contact@boutique-decor-lyon.fr',
        'FR',
        true,
        'Prépaiement obligatoire',
        true,
        '15 Rue de la République',
        'Lyon',
        '69002',
        'FR',
        v_admin_id
    ) RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Boutique Décor Lyon créée (PRÉPAIEMENT): %', v_org_id;

    -- Client Prépaiement 2
    INSERT INTO organisations (
        name, slug, organisation_type, email, country, is_active,
        payment_terms, prepayment_required,
        billing_address_line1, billing_city, billing_postal_code, billing_country,
        created_by
    ) VALUES (
        'Maison des Arts Marseille',
        'maison-des-arts-marseille',
        'customer',
        'contact@maisondesar tsmarseille.fr',
        'FR',
        true,
        'Prépaiement obligatoire - 100%',
        true,
        '23 Cours Julien',
        'Marseille',
        '13006',
        'FR',
        v_admin_id
    ) RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Maison des Arts Marseille créée (PRÉPAIEMENT): %', v_org_id;

    -- Client Prépaiement 3
    INSERT INTO organisations (
        name, slug, organisation_type, email, country, is_active,
        payment_terms, prepayment_required,
        billing_address_line1, billing_city, billing_postal_code, billing_country,
        created_by
    ) VALUES (
        'Château de Versailles Boutique',
        'chateau-versailles',
        'customer',
        'boutique@chateauversailles.fr',
        'FR',
        true,
        'Prépaiement 50% - Solde avant livraison',
        true,
        'Place d''Armes',
        'Versailles',
        '78000',
        'FR',
        v_admin_id
    ) RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Château de Versailles créé (PRÉPAIEMENT): %', v_org_id;

    -- Client Prépaiement 4
    INSERT INTO organisations (
        name, slug, organisation_type, email, country, is_active,
        payment_terms, prepayment_required,
        billing_address_line1, billing_city, billing_postal_code, billing_country,
        created_by
    ) VALUES (
        'Galerie d''Art Bordeaux',
        'galerie-art-bordeaux',
        'customer',
        'contact@galerie-bordeaux.fr',
        'FR',
        true,
        'Prépaiement obligatoire',
        true,
        '12 Rue Sainte-Catherine',
        'Bordeaux',
        '33000',
        'FR',
        v_admin_id
    ) RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Galerie d''Art Bordeaux créée (PRÉPAIEMENT): %', v_org_id;

END $$;

\echo '';
\echo '========================================';
\echo 'VÉRIFICATION: Organisations créées';
\echo '========================================';
\echo '';

SELECT
    name,
    payment_terms,
    prepayment_required,
    CASE
        WHEN prepayment_required = false THEN '✅ ENCOURS (auto-validation)'
        ELSE '💳 PRÉPAIEMENT (validation manuelle)'
    END as workflow_type,
    billing_city
FROM organisations
WHERE organisation_type = 'customer'
ORDER BY prepayment_required, name;

\echo '';
\echo '========================================';
\echo '✅ PHASE 3 TERMINÉE';
\echo '========================================';
\echo 'Organisations créées:';
\echo '  - 4 clients ENCOURS (payment_required=FALSE)';
\echo '  - 4 clients PRÉPAIEMENT (payment_required=TRUE)';
\echo '';
\echo 'Prochaine étape: Créer clients B2C et commandes test';
\echo '========================================';

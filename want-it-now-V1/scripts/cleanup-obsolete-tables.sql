-- ==============================================================================
-- SCRIPT DE NETTOYAGE DES TABLES OBSOLÈTES - WANT IT NOW V1
-- ==============================================================================
-- Description: Supprime toutes les tables de l'ancienne architecture incorrecte
-- Date: 18 Janvier 2025
-- ATTENTION: Ce script supprime définitivement des tables et leurs données !
-- ==============================================================================

-- Début de la transaction pour pouvoir annuler si erreur
BEGIN;

-- ==============================================================================
-- 1. SUPPRESSION DES TABLES DÉPENDANTES (dans l'ordre des dépendances)
-- ==============================================================================

-- Supprimer les tables qui dépendent d'autres tables en premier
DROP TABLE IF EXISTS contrat_documents CASCADE;
DROP TABLE IF EXISTS contrats CASCADE;
DROP TABLE IF EXISTS propriete_photos CASCADE;
DROP TABLE IF EXISTS propriete_quotites CASCADE;
DROP TABLE IF EXISTS unites CASCADE;
DROP TABLE IF EXISTS user_property_assignments CASCADE;

-- Supprimer les associés (table de l'ancienne architecture)
DROP TABLE IF EXISTS associes CASCADE;

-- Supprimer les propriétés (ancienne version avec architecture incorrecte)
DROP TABLE IF EXISTS proprietes CASCADE;

-- Supprimer les propriétaires (ancienne version liée aux organisations)
DROP TABLE IF EXISTS proprietaires CASCADE;

-- ==============================================================================
-- 2. SUPPRESSION DES TYPES ENUM OBSOLÈTES (si nécessaire)
-- ==============================================================================

-- Note: Les types enum peuvent être réutilisés dans la nouvelle architecture
-- Ne les supprimer que si nous voulons les recréer différemment

-- DROP TYPE IF EXISTS proprietaire_type_enum CASCADE;
-- DROP TYPE IF EXISTS propriete_type_enum CASCADE;
-- DROP TYPE IF EXISTS propriete_statut_simple CASCADE;
-- DROP TYPE IF EXISTS associe_type_enum CASCADE;

-- ==============================================================================
-- 3. SUPPRESSION DES FONCTIONS OBSOLÈTES
-- ==============================================================================

-- Supprimer les anciennes fonctions liées aux tables obsolètes
DROP FUNCTION IF EXISTS create_propriete_brouillon(TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS validate_property_ownership_total() CASCADE;
DROP FUNCTION IF EXISTS validate_associes_total() CASCADE;

-- ==============================================================================
-- 4. VÉRIFICATION DES TABLES RESTANTES
-- ==============================================================================

-- Afficher les tables qui restent après le nettoyage
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'NETTOYAGE TERMINÉ - Voici les tables restantes dans le schéma public:';
    RAISE NOTICE '==============================================================================';
END $$;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ==============================================================================
-- 5. VÉRIFICATION DES TYPES RESTANTS
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Types enum restants:';
    RAISE NOTICE '==============================================================================';
END $$;

SELECT 
    typname as type_name,
    typtype as type_type
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e'
ORDER BY typname;

-- ==============================================================================
-- CONFIRMATION DE LA TRANSACTION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'ATTENTION: Ce script a supprimé les tables suivantes:';
    RAISE NOTICE '- contrat_documents';
    RAISE NOTICE '- contrats';
    RAISE NOTICE '- propriete_photos';
    RAISE NOTICE '- propriete_quotites';
    RAISE NOTICE '- unites';
    RAISE NOTICE '- user_property_assignments';
    RAISE NOTICE '- associes';
    RAISE NOTICE '- proprietes';
    RAISE NOTICE '- proprietaires';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour valider ces suppressions, tapez COMMIT;';
    RAISE NOTICE 'Pour annuler, tapez ROLLBACK;';
    RAISE NOTICE '==============================================================================';
END $$;

-- Pour valider les suppressions, décommentez la ligne suivante :
COMMIT;

-- Pour annuler les suppressions, décommentez la ligne suivante :
-- ROLLBACK;
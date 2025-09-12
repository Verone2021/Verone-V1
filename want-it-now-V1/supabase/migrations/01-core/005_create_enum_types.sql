-- ==============================================================================
-- MIGRATION 005: CREATE ENUM TYPES
-- ==============================================================================
-- Description: Création des types énumérés pour l'architecture correcte
-- Architecture: Propriétaires INDÉPENDANTS, liés aux propriétés via quotités
-- Date: 18 Janvier 2025
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. TYPE PROPRIÉTAIRE
-- ==============================================================================

CREATE TYPE proprietaire_type_enum AS ENUM (
    'physique',  -- Personne physique
    'morale'     -- Personne morale (société, SCI, etc.)
);

COMMENT ON TYPE proprietaire_type_enum IS 'Type de propriétaire : physique ou morale';

-- ==============================================================================
-- 2. TYPE PROPRIÉTÉ
-- ==============================================================================

CREATE TYPE propriete_type_enum AS ENUM (
    -- Résidentiel individuel
    'appartement',
    'maison',
    'villa',
    'studio',
    'loft',
    'duplex',
    'penthouse',
    
    -- Résidentiel collectif
    'immeuble_petit',    -- < 10 unités
    'immeuble_moyen',    -- 10-50 unités
    'immeuble_grand',    -- > 50 unités
    
    -- Terrain et annexes
    'terrain',
    'parking',
    
    -- Commercial et professionnel
    'local_commercial',
    'bureau',
    'entrepot',
    'hotel',
    
    -- Autre
    'autre'
);

COMMENT ON TYPE propriete_type_enum IS 'Type de propriété immobilière';

-- ==============================================================================
-- 3. STATUT PROPRIÉTÉ
-- ==============================================================================

CREATE TYPE propriete_statut_enum AS ENUM (
    'brouillon',      -- En cours de création
    'sourcing',       -- Recherche active
    'evaluation',     -- Analyse et due diligence
    'negociation',    -- Négociation en cours
    'achetee',        -- Propriété acquise
    'disponible',     -- Prête à louer
    'louee',          -- Actuellement louée
    'vendue'          -- Vendue (historique)
);

COMMENT ON TYPE propriete_statut_enum IS 'Statut de la propriété dans le cycle de vie';

-- ==============================================================================
-- 4. TYPE ASSOCIÉ (pour sociétés)
-- ==============================================================================

CREATE TYPE associe_type_enum AS ENUM (
    'physique',  -- Personne physique associée
    'morale'     -- Personne morale associée (holding, etc.)
);

COMMENT ON TYPE associe_type_enum IS 'Type d''associé dans une société';

-- ==============================================================================
-- 5. MODE ACQUISITION
-- ==============================================================================

CREATE TYPE mode_acquisition_enum AS ENUM (
    'achat',        -- Acquisition par achat
    'heritage',     -- Acquisition par héritage
    'donation',     -- Acquisition par donation
    'apport',       -- Apport en société
    'autre'         -- Autre mode
);

COMMENT ON TYPE mode_acquisition_enum IS 'Mode d''acquisition d''une propriété';

-- ==============================================================================
-- 6. FORME JURIDIQUE (pour personnes morales)
-- ==============================================================================

CREATE TYPE forme_juridique_enum AS ENUM (
    'SCI',          -- Société Civile Immobilière
    'SARL',         -- Société à Responsabilité Limitée
    'SAS',          -- Société par Actions Simplifiée
    'SA',           -- Société Anonyme
    'EURL',         -- Entreprise Unipersonnelle à Responsabilité Limitée
    'SASU',         -- Société par Actions Simplifiée Unipersonnelle
    'SNC',          -- Société en Nom Collectif
    'Association',  -- Association loi 1901
    'Fondation',    -- Fondation
    'Autre'         -- Autre forme juridique
);

COMMENT ON TYPE forme_juridique_enum IS 'Forme juridique des personnes morales';

-- ==============================================================================
-- VÉRIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 005: Types ENUM créés avec succès';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ proprietaire_type_enum : physique, morale';
    RAISE NOTICE '✅ propriete_type_enum : 17 types de propriétés';
    RAISE NOTICE '✅ propriete_statut_enum : 8 statuts du cycle de vie';
    RAISE NOTICE '✅ associe_type_enum : physique, morale';
    RAISE NOTICE '✅ mode_acquisition_enum : 5 modes d''acquisition';
    RAISE NOTICE '✅ forme_juridique_enum : 10 formes juridiques';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;
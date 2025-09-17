-- ================================================================
-- Migration: Ajout des champs spécifiques clients particuliers
-- Date: 2025-09-16
-- Description: Ajouter les champs personnels pour les clients individuels
-- ================================================================

-- ===========================
-- 1. CHAMPS PERSONNELS INDIVIDUELS
-- ===========================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS first_name VARCHAR,
ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS nationality VARCHAR(2) DEFAULT 'FR',
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) DEFAULT 'FR';

-- ===========================
-- 2. CHAMPS COMMUNICATION ET PRÉFÉRENCES
-- ===========================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS communication_preference VARCHAR
CHECK (communication_preference IN ('email', 'phone', 'mail')) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

-- ===========================
-- 3. COMMENTAIRES ET DOCUMENTATION
-- ===========================

COMMENT ON COLUMN organisations.first_name IS 'Prénom du client particulier';
COMMENT ON COLUMN organisations.mobile_phone IS 'Téléphone mobile du client particulier';
COMMENT ON COLUMN organisations.date_of_birth IS 'Date de naissance du client particulier';
COMMENT ON COLUMN organisations.nationality IS 'Nationalité (code ISO 2 lettres)';
COMMENT ON COLUMN organisations.preferred_language IS 'Langue préférée (code ISO 2 lettres)';
COMMENT ON COLUMN organisations.communication_preference IS 'Canal de communication préféré';
COMMENT ON COLUMN organisations.marketing_consent IS 'Consentement marketing et newsletters';

-- ===========================
-- 4. VALIDATION ET CONTRAINTES
-- ===========================

-- Contrainte : first_name obligatoire pour les clients particuliers
ALTER TABLE organisations
ADD CONSTRAINT check_individual_customer_first_name
CHECK (
  (customer_type != 'individual') OR
  (customer_type = 'individual' AND first_name IS NOT NULL AND LENGTH(first_name) >= 2)
);

-- Contrainte : date_of_birth cohérente (> 16 ans et < 120 ans)
ALTER TABLE organisations
ADD CONSTRAINT check_valid_birth_date
CHECK (
  date_of_birth IS NULL OR
  (date_of_birth >= CURRENT_DATE - INTERVAL '120 years' AND
   date_of_birth <= CURRENT_DATE - INTERVAL '16 years')
);

-- ===========================
-- 5. INDEX POUR PERFORMANCE
-- ===========================

-- Index pour recherche par prénom des clients particuliers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organisations_first_name
ON organisations (first_name)
WHERE customer_type = 'individual' AND first_name IS NOT NULL;

-- Index pour recherche par date de naissance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organisations_birth_date
ON organisations (date_of_birth)
WHERE customer_type = 'individual' AND date_of_birth IS NOT NULL;

-- ===========================
-- 6. POLITIQUE RLS (Row Level Security)
-- ===========================

-- Les politiques RLS existantes s'appliquent automatiquement
-- car nous utilisons la même table organisations

-- ===========================
-- 7. FONCTIONS UTILITAIRES
-- ===========================

-- Fonction pour calculer l'âge d'un client particulier
CREATE OR REPLACE FUNCTION get_customer_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour obtenir le nom complet d'un client particulier
CREATE OR REPLACE FUNCTION get_full_name(org_name TEXT, first_name TEXT, customer_type TEXT)
RETURNS TEXT AS $$
BEGIN
  IF customer_type = 'individual' AND first_name IS NOT NULL THEN
    RETURN COALESCE(first_name || ' ' || org_name, org_name);
  ELSE
    RETURN org_name;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===========================
-- 8. TESTS DE VALIDATION
-- ===========================

-- Test: Insertion client particulier valide
DO $$
BEGIN
  -- Test contrainte first_name
  BEGIN
    INSERT INTO organisations (name, customer_type, first_name, type, country)
    VALUES ('Martin', 'individual', 'Jean', 'customer', 'FR');

    DELETE FROM organisations WHERE name = 'Martin' AND customer_type = 'individual';
    RAISE NOTICE 'Test client particulier valide: PASSÉ';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test client particulier valide: ÉCHOUÉ - %', SQLERRM;
  END;

  -- Test contrainte first_name manquant
  BEGIN
    INSERT INTO organisations (name, customer_type, type, country)
    VALUES ('Dupont', 'individual', 'customer', 'FR');

    RAISE NOTICE 'Test contrainte first_name: ÉCHOUÉ (devrait rejeter)';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Test contrainte first_name: PASSÉ (correctement rejeté)';
    WHEN OTHERS THEN
      RAISE NOTICE 'Test contrainte first_name: ÉCHOUÉ - %', SQLERRM;
  END;
END $$;

-- ===========================
-- 9. DONNÉES DE TEST (OPTIONNEL)
-- ===========================

-- Vous pouvez décommenter pour créer des données de test
/*
INSERT INTO organisations (
  name, first_name, customer_type, type,
  email, phone, mobile_phone,
  date_of_birth, nationality, preferred_language,
  communication_preference, marketing_consent,
  billing_address_line1, billing_city, billing_postal_code, billing_country,
  is_active, country
) VALUES
(
  'Martin', 'Jean', 'individual', 'customer',
  'jean.martin@example.com', '01 23 45 67 89', '06 12 34 56 78',
  '1985-03-15', 'FR', 'FR',
  'email', true,
  '123 Rue de la Paix', 'Paris', '75001', 'FR',
  true, 'FR'
),
(
  'Dubois', 'Marie', 'individual', 'customer',
  'marie.dubois@example.com', '01 98 76 54 32', '06 87 65 43 21',
  '1992-07-22', 'FR', 'FR',
  'phone', false,
  '456 Avenue des Champs', 'Lyon', '69001', 'FR',
  true, 'FR'
);
*/
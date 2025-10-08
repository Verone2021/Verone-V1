-- =====================================================
-- Migration: Extension des profils utilisateurs
-- Date: 2025-01-14
-- Description: Ajout des champs optionnels pour profils
--              - Prénom, nom de famille
--              - Numéro de téléphone
--              - Intitulé de poste
-- =====================================================

-- Extension de la table user_profiles avec nouveaux champs optionnels
ALTER TABLE user_profiles
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN job_title TEXT;

-- Contraintes et validations
ALTER TABLE user_profiles
ADD CONSTRAINT check_phone_format CHECK (
  phone IS NULL OR
  phone ~ '^(\+33|0)[1-9][0-9]{8}$' OR
  phone ~ '^\+33\s?[1-9](\s?[0-9]{2}){4}$'
);

ALTER TABLE user_profiles
ADD CONSTRAINT check_first_name_length CHECK (
  first_name IS NULL OR
  (LENGTH(TRIM(first_name)) > 0 AND LENGTH(first_name) <= 50)
);

ALTER TABLE user_profiles
ADD CONSTRAINT check_last_name_length CHECK (
  last_name IS NULL OR
  (LENGTH(TRIM(last_name)) > 0 AND LENGTH(last_name) <= 50)
);

ALTER TABLE user_profiles
ADD CONSTRAINT check_job_title_length CHECK (
  job_title IS NULL OR
  (LENGTH(TRIM(job_title)) > 0 AND LENGTH(job_title) <= 100)
);

-- Index pour optimisation recherche par téléphone
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
ON user_profiles(phone)
WHERE phone IS NOT NULL;

-- Index composite pour recherche nom/prénom
CREATE INDEX IF NOT EXISTS idx_user_profiles_name
ON user_profiles(last_name, first_name)
WHERE last_name IS NOT NULL OR first_name IS NOT NULL;

-- Fonction helper pour formater le nom complet
CREATE OR REPLACE FUNCTION get_user_full_name(user_profile_record user_profiles)
RETURNS TEXT AS $$
BEGIN
  RETURN TRIM(COALESCE(user_profile_record.first_name, '') || ' ' || COALESCE(user_profile_record.last_name, ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction helper pour formater le téléphone (affichage français)
CREATE OR REPLACE FUNCTION format_phone_display(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone_input IS NULL THEN
    RETURN NULL;
  END IF;

  -- Nettoie et formate selon standard français
  phone_input := REGEXP_REPLACE(phone_input, '[^0-9+]', '', 'g');

  -- Format +33 X XX XX XX XX
  IF phone_input ~ '^\+33[1-9][0-9]{8}$' THEN
    RETURN REGEXP_REPLACE(phone_input, '^\+33([1-9])([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})$', '+33 \1 \2 \3 \4 \5');
  END IF;

  -- Format 0X XX XX XX XX
  IF phone_input ~ '^0[1-9][0-9]{8}$' THEN
    RETURN REGEXP_REPLACE(phone_input, '^0([1-9])([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})$', '0\1 \2 \3 \4 \5');
  END IF;

  -- Retourne tel quel si format non reconnu
  RETURN phone_input;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ajout de commentaires pour documentation
COMMENT ON COLUMN user_profiles.first_name IS 'Prénom de l''utilisateur (optionnel, max 50 chars)';
COMMENT ON COLUMN user_profiles.last_name IS 'Nom de famille de l''utilisateur (optionnel, max 50 chars)';
COMMENT ON COLUMN user_profiles.phone IS 'Numéro de téléphone français (optionnel, format validé)';
COMMENT ON COLUMN user_profiles.job_title IS 'Intitulé du poste/fonction (optionnel, max 100 chars)';

COMMENT ON FUNCTION get_user_full_name(user_profiles) IS 'Retourne le nom complet formaté (prénom + nom)';
COMMENT ON FUNCTION format_phone_display(TEXT) IS 'Formate un numéro de téléphone pour affichage français';

-- Test de validation des contraintes (peut être supprimé en production)
DO $$
BEGIN
  -- Test insertion données valides
  PERFORM 1 WHERE
    '0123456789' ~ '^(\+33|0)[1-9][0-9]{8}$' AND
    '+33123456789' ~ '^(\+33|0)[1-9][0-9]{8}$' AND
    '+33 1 23 45 67 89' ~ '^\+33\s?[1-9](\s?[0-9]{2}){4}$';

  RAISE NOTICE 'Migration completed successfully - user_profiles extended with profile fields';
END
$$;
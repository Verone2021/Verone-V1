-- =====================================================
-- Migration: Ajout job_title à user_profiles
-- Date: 2025-10-30
-- Description: Activation champ job_title pour admin/users
-- Basé sur: archive/20250114_001_extend_user_profiles.sql
-- =====================================================

-- Vérifier si colonnes existent déjà (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN first_name TEXT,
    ADD COLUMN last_name TEXT,
    ADD COLUMN phone TEXT,
    ADD COLUMN job_title TEXT;
  END IF;
END $$;

-- Contraintes
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_phone_format;

ALTER TABLE user_profiles
ADD CONSTRAINT check_phone_format CHECK (
  phone IS NULL OR
  phone ~ '^(\+33|0)[1-9][0-9]{8}$' OR
  phone ~ '^\+33\s?[1-9](\s?[0-9]{2}){4}$'
);

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_first_name_length;

ALTER TABLE user_profiles
ADD CONSTRAINT check_first_name_length CHECK (
  first_name IS NULL OR
  (LENGTH(TRIM(first_name)) > 0 AND LENGTH(first_name) <= 50)
);

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_last_name_length;

ALTER TABLE user_profiles
ADD CONSTRAINT check_last_name_length CHECK (
  last_name IS NULL OR
  (LENGTH(TRIM(last_name)) > 0 AND LENGTH(last_name) <= 50)
);

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_job_title_length;

ALTER TABLE user_profiles
ADD CONSTRAINT check_job_title_length CHECK (
  job_title IS NULL OR
  (LENGTH(TRIM(job_title)) > 0 AND LENGTH(job_title) <= 100)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
ON user_profiles(phone)
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_name
ON user_profiles(last_name, first_name)
WHERE last_name IS NOT NULL OR first_name IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN user_profiles.first_name IS 'Prénom de l''utilisateur (optionnel, max 50 chars)';
COMMENT ON COLUMN user_profiles.last_name IS 'Nom de famille de l''utilisateur (optionnel, max 50 chars)';
COMMENT ON COLUMN user_profiles.phone IS 'Numéro de téléphone français (optionnel, format validé)';
COMMENT ON COLUMN user_profiles.job_title IS 'Intitulé du poste/fonction (optionnel, max 100 chars)';

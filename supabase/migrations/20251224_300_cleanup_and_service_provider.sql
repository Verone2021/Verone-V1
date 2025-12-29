-- Migration: Nettoyage DB + Ajout is_service_provider
-- Date: 2024-12-24
-- Description:
--   1. Ajoute colonne is_service_provider pour distinguer fournisseurs/prestataires
--   2. Nettoie tables et colonnes obsolètes (counterparties, organisation_roles)
--   3. Marque Free et GoCardless comme prestataires

-- ============================================
-- PHASE 1: Ajouter colonne is_service_provider
-- ============================================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS is_service_provider BOOLEAN DEFAULT false;

COMMENT ON COLUMN organisations.is_service_provider IS
  'true = prestataire de services (télécom, SaaS, conseil), false = fournisseur de biens (marchandises, équipements)';

-- ============================================
-- PHASE 2: Marquer prestataires existants
-- ============================================

UPDATE organisations
SET is_service_provider = true
WHERE legal_name ILIKE '%free%'
   OR legal_name ILIKE '%gocardless%'
   OR legal_name ILIKE '%ovh%'
   OR legal_name ILIKE '%vercel%'
   OR legal_name ILIKE '%stripe%'
   OR legal_name ILIKE '%aws%'
   OR legal_name ILIKE '%google%'
   OR legal_name ILIKE '%microsoft%';

-- ============================================
-- PHASE 3: Nettoyer colonnes deprecated (expenses)
-- ============================================

-- Supprimer FK avant la colonne
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_counterparty_id_fkey;

ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_individual_customer_id_fkey;

-- Supprimer colonnes
ALTER TABLE expenses
DROP COLUMN IF EXISTS counterparty_id;

ALTER TABLE expenses
DROP COLUMN IF EXISTS individual_customer_id;

-- ============================================
-- PHASE 4: Nettoyer colonnes deprecated (organisations)
-- ============================================

ALTER TABLE organisations
DROP CONSTRAINT IF EXISTS organisations_counterparty_id_fkey;

ALTER TABLE organisations
DROP COLUMN IF EXISTS counterparty_id;

-- ============================================
-- PHASE 5: Nettoyer matching_rules
-- ============================================

ALTER TABLE matching_rules
DROP COLUMN IF EXISTS display_label;

-- Note: On ne rend PAS organisation_id NOT NULL immédiatement
-- car il peut y avoir des règles existantes sans org
-- On le fera après migration des données existantes

-- ============================================
-- PHASE 6: Supprimer tables obsolètes
-- ============================================

-- Supprimer dans l'ordre des dépendances
DROP TABLE IF EXISTS counterparty_bank_accounts CASCADE;
DROP TABLE IF EXISTS counterparties CASCADE;
DROP TABLE IF EXISTS organisation_roles CASCADE;

-- ============================================
-- PHASE 7: Index pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_organisations_is_service_provider
ON organisations(is_service_provider)
WHERE is_service_provider = true;

-- ============================================
-- LOG
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251224_300 completed:';
  RAISE NOTICE '  - Added is_service_provider column to organisations';
  RAISE NOTICE '  - Marked service providers (Free, GoCardless, etc.)';
  RAISE NOTICE '  - Cleaned deprecated columns from expenses';
  RAISE NOTICE '  - Cleaned deprecated columns from organisations';
  RAISE NOTICE '  - Removed obsolete tables (counterparties, organisation_roles)';
END $$;

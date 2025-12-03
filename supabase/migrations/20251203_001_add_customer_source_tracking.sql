-- ============================================================
-- Migration: Traçabilité Source Clients
-- Date: 2025-12-03
-- Description: Ajoute la traçabilité de la source des clients
--              (LinkMe, Site Internet, Manuel, etc.)
-- ============================================================

-- ============================================================
-- ENUM: customer_source_type
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_source_type') THEN
    CREATE TYPE customer_source_type AS ENUM ('internal', 'linkme', 'site-internet', 'manual');
  END IF;
END$$;

COMMENT ON TYPE customer_source_type IS 'Source d''acquisition du client: internal (import/migration), linkme (affilié), site-internet (e-commerce), manual (saisie back-office)';

-- ============================================================
-- TABLE: individual_customers
-- ============================================================

-- 1. Rattachement enseigne (pour filtrer clients par enseigne)
ALTER TABLE individual_customers
ADD COLUMN IF NOT EXISTS enseigne_id uuid REFERENCES enseignes(id) ON DELETE SET NULL;

-- 2. Type de source (d'où vient le client)
ALTER TABLE individual_customers
ADD COLUMN IF NOT EXISTS source_type customer_source_type DEFAULT 'internal';

-- 3. Affilié source (si source = linkme)
ALTER TABLE individual_customers
ADD COLUMN IF NOT EXISTS source_affiliate_id uuid REFERENCES linkme_affiliates(id) ON DELETE SET NULL;

-- Index pour filtres
CREATE INDEX IF NOT EXISTS idx_individual_customers_enseigne_id
ON individual_customers(enseigne_id) WHERE enseigne_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_individual_customers_source_type
ON individual_customers(source_type);

CREATE INDEX IF NOT EXISTS idx_individual_customers_source_affiliate
ON individual_customers(source_affiliate_id) WHERE source_affiliate_id IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN individual_customers.enseigne_id IS
'FK vers enseignes - permet de rattacher un client particulier à une enseigne spécifique (pour CMS LinkMe)';

COMMENT ON COLUMN individual_customers.source_type IS
'Source d''acquisition du client: internal (import/migration), linkme (via affilié), site-internet (e-commerce), manual (saisie back-office)';

COMMENT ON COLUMN individual_customers.source_affiliate_id IS
'FK vers linkme_affiliates - affilié qui a apporté ce client (rempli si source_type = linkme)';

-- ============================================================
-- TABLE: organisations
-- ============================================================

-- 1. Type de source (d'où vient l'organisation)
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS source_type customer_source_type DEFAULT 'internal';

-- 2. Affilié source (si source = linkme)
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS source_affiliate_id uuid REFERENCES linkme_affiliates(id) ON DELETE SET NULL;

-- Index pour filtres
CREATE INDEX IF NOT EXISTS idx_organisations_source_type
ON organisations(source_type);

CREATE INDEX IF NOT EXISTS idx_organisations_source_affiliate
ON organisations(source_affiliate_id) WHERE source_affiliate_id IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN organisations.source_type IS
'Source d''acquisition de l''organisation: internal (import/migration), linkme (via affilié), site-internet (e-commerce), manual (saisie back-office)';

COMMENT ON COLUMN organisations.source_affiliate_id IS
'FK vers linkme_affiliates - affilié qui a apporté cette organisation (rempli si source_type = linkme)';

-- ============================================================
-- VÉRIFICATION
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251203_001_add_customer_source_tracking appliquée avec succès';
  RAISE NOTICE '- ENUM customer_source_type créé';
  RAISE NOTICE '- individual_customers: enseigne_id, source_type, source_affiliate_id ajoutés';
  RAISE NOTICE '- organisations: source_type, source_affiliate_id ajoutés';
END$$;

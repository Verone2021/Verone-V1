-- =====================================================================
-- Migration 005: Colonnes abby_customer_id
-- Date: 2025-10-11
-- Description: Ajout colonnes sync Abby dans tables clients
-- =====================================================================

-- =====================================================================
-- 1. TABLE ORGANISATIONS
-- =====================================================================

-- Ajout colonne abby_customer_id
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS abby_customer_id TEXT UNIQUE;

-- Index pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_organisations_abby_customer
  ON organisations(abby_customer_id)
  WHERE abby_customer_id IS NOT NULL;

-- Commentaire documentation
COMMENT ON COLUMN organisations.abby_customer_id IS
  'Identifiant client dans Abby (synchronisé lors première facturation)';

-- =====================================================================
-- 2. TABLE INDIVIDUAL_CUSTOMERS (SI EXISTE)
-- =====================================================================

-- Vérifier existence table individual_customers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'individual_customers'
  ) THEN
    -- Ajout colonne abby_contact_id
    ALTER TABLE individual_customers
      ADD COLUMN IF NOT EXISTS abby_contact_id TEXT UNIQUE;

    -- Index pour lookup rapide
    CREATE INDEX IF NOT EXISTS idx_individual_customers_abby_contact
      ON individual_customers(abby_contact_id)
      WHERE abby_contact_id IS NOT NULL;

    -- Commentaire documentation
    EXECUTE 'COMMENT ON COLUMN individual_customers.abby_contact_id IS ''Identifiant contact dans Abby (synchronisé lors première facturation)''';

    RAISE NOTICE '✅ Colonne abby_contact_id ajoutée à individual_customers';
  ELSE
    RAISE NOTICE '⚠️  Table individual_customers inexistante (skipped)';
  END IF;
END $$;

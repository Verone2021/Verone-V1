-- Migration: Création table individual_customers pour clients B2C
-- Date: 2025-10-13
-- Description: Table pour stocker les clients particuliers (B2C) séparément des organisations (B2B)

-- =============================================================================
-- 1. CRÉATION TABLE INDIVIDUAL_CUSTOMERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS individual_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations personnelles
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Adresse principale (livraison par défaut)
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'France',

  -- Adresse de facturation (si différente)
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_region VARCHAR(100),
  billing_country VARCHAR(100),
  has_different_billing_address BOOLEAN DEFAULT false,

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contraintes
  CONSTRAINT individual_customers_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT individual_customers_phone_format CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-\.()]{8,20}$')
);

-- =============================================================================
-- 2. INDEX POUR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_individual_customers_name ON individual_customers(last_name, first_name);
CREATE INDEX idx_individual_customers_email ON individual_customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_individual_customers_active ON individual_customers(is_active) WHERE is_active = true;
CREATE INDEX idx_individual_customers_city ON individual_customers(city) WHERE city IS NOT NULL;

-- =============================================================================
-- 3. TRIGGER UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_individual_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_individual_customers_updated_at
  BEFORE UPDATE ON individual_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_individual_customers_updated_at();

-- =============================================================================
-- 4. RLS (ROW LEVEL SECURITY)
-- =============================================================================

ALTER TABLE individual_customers ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture pour utilisateurs authentifiés
CREATE POLICY "individual_customers_select_authenticated" ON individual_customers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy : Insertion pour utilisateurs authentifiés
CREATE POLICY "individual_customers_insert_authenticated" ON individual_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy : Mise à jour pour utilisateurs authentifiés
CREATE POLICY "individual_customers_update_authenticated" ON individual_customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy : Suppression pour utilisateurs authentifiés (soft delete recommandé via is_active)
CREATE POLICY "individual_customers_delete_authenticated" ON individual_customers
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- 5. VUE POUR AFFICHAGE
-- =============================================================================

CREATE OR REPLACE VIEW individual_customers_display AS
SELECT
  id,
  CONCAT(first_name, ' ', last_name) as full_name,
  email,
  phone,
  city,
  postal_code,
  country,
  is_active,
  created_at,
  updated_at
FROM individual_customers
ORDER BY last_name, first_name;

-- =============================================================================
-- 6. COMMENTAIRES
-- =============================================================================

COMMENT ON TABLE individual_customers IS 'Table pour clients particuliers (B2C) - Séparée de la table organisations (B2B)';
COMMENT ON COLUMN individual_customers.has_different_billing_address IS 'Si true, utiliser billing_address_*, sinon utiliser address_*';
COMMENT ON COLUMN individual_customers.is_active IS 'Permet soft delete - Ne pas supprimer physiquement les clients avec historique';

-- =============================================================================
-- 7. VALIDATION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 023 appliquée avec succès';
  RAISE NOTICE '📝 Table individual_customers créée avec RLS';
  RAISE NOTICE '🔒 Policies RLS configurées pour authenticated users';
  RAISE NOTICE '📊 Vue individual_customers_display créée';
END $$;

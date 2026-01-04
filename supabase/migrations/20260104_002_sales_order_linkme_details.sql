-- ============================================
-- Migration: Table sales_order_linkme_details
-- Date: 2026-01-04
-- Description: Stocke les donnees specifiques au workflow B2B Enseigne LinkMe
--              Lie 1:1 a sales_orders via sales_order_id
-- ============================================

-- 1. Creer la table
CREATE TABLE IF NOT EXISTS sales_order_linkme_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL UNIQUE REFERENCES sales_orders(id) ON DELETE CASCADE,

  -- ETAPE 1: Demandeur
  requester_type TEXT NOT NULL CHECK (requester_type IN ('responsable_enseigne', 'architecte', 'franchisee')),
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  requester_position TEXT,
  is_new_restaurant BOOLEAN NOT NULL DEFAULT false,

  -- ETAPE 2: Proprietaire/Responsable (optionnel a soumission)
  owner_type TEXT CHECK (owner_type IN ('propre', 'franchise')),
  owner_contact_same_as_requester BOOLEAN DEFAULT false,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  owner_company_legal_name TEXT,
  owner_company_trade_name TEXT,
  owner_kbis_url TEXT,

  -- ETAPE 3: Facturation
  billing_contact_source TEXT CHECK (billing_contact_source IN ('step1', 'step2', 'custom')),
  billing_name TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  delivery_terms_accepted BOOLEAN NOT NULL DEFAULT false,
  desired_delivery_date DATE,
  mall_form_required BOOLEAN DEFAULT false,
  mall_form_email TEXT,

  -- ETAPE 4: Post-approbation
  step4_token UUID UNIQUE,
  step4_token_expires_at TIMESTAMPTZ,
  step4_completed_at TIMESTAMPTZ,
  reception_contact_name TEXT,
  reception_contact_email TEXT,
  reception_contact_phone TEXT,
  confirmed_delivery_date DATE,

  -- Metadonnees
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_sales_order_linkme_details_order
  ON sales_order_linkme_details(sales_order_id);

CREATE INDEX IF NOT EXISTS idx_sales_order_linkme_details_token
  ON sales_order_linkme_details(step4_token)
  WHERE step4_token IS NOT NULL;

-- 3. Trigger updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at_linkme_details()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_sales_order_linkme_details ON sales_order_linkme_details;
CREATE TRIGGER set_updated_at_sales_order_linkme_details
  BEFORE UPDATE ON sales_order_linkme_details
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at_linkme_details();

-- 4. RLS
ALTER TABLE sales_order_linkme_details ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture pour authenticated (sera affine en PR2+)
DROP POLICY IF EXISTS "Authenticated can read sales_order_linkme_details" ON sales_order_linkme_details;
CREATE POLICY "Authenticated can read sales_order_linkme_details"
  ON sales_order_linkme_details FOR SELECT
  TO authenticated
  USING (true);

-- 5. Grants
GRANT SELECT ON sales_order_linkme_details TO authenticated;

-- 6. Commentaire
COMMENT ON TABLE sales_order_linkme_details IS
'Details workflow Commandes Enseigne LinkMe (B2B).
Lie 1:1 a sales_orders via sales_order_id.
Stocke les donnees des etapes 1-4 du workflow:
- Etape 1: Demandeur (type, contact, nouveau restaurant)
- Etape 2: Proprietaire (propre vs franchise, KBis si franchise)
- Etape 3: Facturation (contact, modalites livraison)
- Etape 4: Post-approbation (token, contact reception, date confirmee)';

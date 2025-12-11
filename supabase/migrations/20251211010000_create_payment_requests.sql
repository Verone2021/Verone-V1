-- ============================================================================
-- Migration: Système de Demande de Versement des Commissions LinkMe
-- Date: 2025-12-11
-- Description: Tables pour gérer les demandes de versement des affiliés
-- ============================================================================

-- Table principale: Demandes de versement
CREATE TABLE IF NOT EXISTS linkme_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES linkme_affiliates(id) ON DELETE CASCADE,
  request_number VARCHAR(20) NOT NULL UNIQUE,  -- PR-2025-000001

  -- Montants
  total_amount_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount_ttc NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) DEFAULT 0.20,  -- 20% TVA par défaut

  -- Statuts: pending, invoice_received, paid, cancelled
  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  -- Facture affilié (uploadée par l'affilié)
  invoice_file_url VARCHAR(500),
  invoice_file_name VARCHAR(255),
  invoice_received_at TIMESTAMPTZ,

  -- Paiement (rempli par back-office)
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  payment_reference VARCHAR(100),
  payment_proof_url VARCHAR(500),

  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table liaison: commissions incluses dans une demande
CREATE TABLE IF NOT EXISTS linkme_payment_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID NOT NULL REFERENCES linkme_payment_requests(id) ON DELETE CASCADE,
  commission_id UUID NOT NULL REFERENCES linkme_commissions(id) ON DELETE RESTRICT,
  commission_amount_ttc NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payment_request_id, commission_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_affiliate ON linkme_payment_requests(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON linkme_payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created ON linkme_payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_request_items_request ON linkme_payment_request_items(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_request_items_commission ON linkme_payment_request_items(commission_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_payment_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_request_timestamp ON linkme_payment_requests;
CREATE TRIGGER trigger_update_payment_request_timestamp
  BEFORE UPDATE ON linkme_payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_request_timestamp();

-- Séquence pour numéro de demande (PR-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS payment_request_seq START 1;

-- Fonction pour générer le numéro de demande
CREATE OR REPLACE FUNCTION generate_payment_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := 'PR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(NEXTVAL('payment_request_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_payment_request_number ON linkme_payment_requests;
CREATE TRIGGER trigger_generate_payment_request_number
  BEFORE INSERT ON linkme_payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_request_number();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE linkme_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkme_payment_request_items ENABLE ROW LEVEL SECURITY;

-- Policy: Affiliés peuvent voir leurs propres demandes (via user_app_roles)
DROP POLICY IF EXISTS "Affiliates can view own payment requests" ON linkme_payment_requests;
CREATE POLICY "Affiliates can view own payment requests" ON linkme_payment_requests
  FOR SELECT
  USING (
    affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- Policy: Affiliés peuvent créer leurs propres demandes (via user_app_roles)
DROP POLICY IF EXISTS "Affiliates can create own payment requests" ON linkme_payment_requests;
CREATE POLICY "Affiliates can create own payment requests" ON linkme_payment_requests
  FOR INSERT
  WITH CHECK (
    affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- Policy: Affiliés peuvent modifier leurs demandes pending (upload facture)
DROP POLICY IF EXISTS "Affiliates can update own pending requests" ON linkme_payment_requests;
CREATE POLICY "Affiliates can update own pending requests" ON linkme_payment_requests
  FOR UPDATE
  USING (
    affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
    AND status IN ('pending', 'invoice_received')
  );

-- Policy: Back-office peut tout voir (via organisation_id)
DROP POLICY IF EXISTS "Back-office can view all payment requests" ON linkme_payment_requests;
CREATE POLICY "Back-office can view all payment requests" ON linkme_payment_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_profiles up ON up.organisation_id = la.organisation_id
      WHERE la.id = linkme_payment_requests.affiliate_id
      AND up.user_id = auth.uid()
    )
  );

-- Policy: Back-office peut modifier (marquer payé, annuler)
DROP POLICY IF EXISTS "Back-office can update payment requests" ON linkme_payment_requests;
CREATE POLICY "Back-office can update payment requests" ON linkme_payment_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_profiles up ON up.organisation_id = la.organisation_id
      WHERE la.id = linkme_payment_requests.affiliate_id
      AND up.user_id = auth.uid()
    )
  );

-- Policy items: Affiliés peuvent voir les items de leurs demandes (via user_app_roles)
DROP POLICY IF EXISTS "Affiliates can view own request items" ON linkme_payment_request_items;
CREATE POLICY "Affiliates can view own request items" ON linkme_payment_request_items
  FOR SELECT
  USING (
    payment_request_id IN (
      SELECT pr.id FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- Policy items: Affiliés peuvent créer les items de leurs demandes (via user_app_roles)
DROP POLICY IF EXISTS "Affiliates can create own request items" ON linkme_payment_request_items;
CREATE POLICY "Affiliates can create own request items" ON linkme_payment_request_items
  FOR INSERT
  WITH CHECK (
    payment_request_id IN (
      SELECT pr.id FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- Policy items: Back-office peut voir tous les items
DROP POLICY IF EXISTS "Back-office can view all request items" ON linkme_payment_request_items;
CREATE POLICY "Back-office can view all request items" ON linkme_payment_request_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      JOIN user_profiles up ON up.organisation_id = la.organisation_id
      WHERE pr.id = linkme_payment_request_items.payment_request_id
      AND up.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Trigger: Quand demande payée, marquer commissions comme 'paid'
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_commissions_on_payment_request_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Si statut passe à 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    -- Marquer toutes les commissions associées comme payées
    UPDATE linkme_commissions
    SET status = 'paid',
        payment_request_id = NEW.id,
        paid_at = COALESCE(NEW.paid_at, NOW())
    WHERE id IN (
      SELECT commission_id FROM linkme_payment_request_items WHERE payment_request_id = NEW.id
    );
  END IF;

  -- Si demande annulée, libérer les commissions
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE linkme_commissions
    SET status = 'validated',
        payment_request_id = NULL,
        paid_at = NULL
    WHERE id IN (
      SELECT commission_id FROM linkme_payment_request_items WHERE payment_request_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_commissions_on_payment ON linkme_payment_requests;
CREATE TRIGGER trigger_sync_commissions_on_payment
  AFTER UPDATE ON linkme_payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_commissions_on_payment_request_paid();

-- ============================================================================
-- Ajouter colonne payment_request_id à linkme_commissions si pas existe
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'linkme_commissions' AND column_name = 'payment_request_id'
  ) THEN
    ALTER TABLE linkme_commissions ADD COLUMN payment_request_id UUID REFERENCES linkme_payment_requests(id);
    CREATE INDEX idx_commissions_payment_request ON linkme_commissions(payment_request_id);
  END IF;
END $$;

-- ============================================================================
-- Storage bucket pour factures uploadées
-- ============================================================================

-- Le bucket doit être créé via Dashboard Supabase ou API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('linkme-invoices', 'linkme-invoices', false);

COMMENT ON TABLE linkme_payment_requests IS 'Demandes de versement des commissions affiliés LinkMe';
COMMENT ON TABLE linkme_payment_request_items IS 'Commissions incluses dans chaque demande de versement';
COMMENT ON COLUMN linkme_payment_requests.request_number IS 'Numéro unique PR-YYYY-NNNNNN';
COMMENT ON COLUMN linkme_payment_requests.status IS 'pending: créée, invoice_received: facture uploadée, paid: payée, cancelled: annulée';

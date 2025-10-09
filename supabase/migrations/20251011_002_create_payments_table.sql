-- =====================================================================
-- Migration 002: Table payments
-- Date: 2025-10-11
-- Description: Historique paiements synchronisés depuis Abby
-- =====================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- RELATIONS
  -- ===================================================================

  -- Relation facture (CASCADE autorisé → paiements dépendent facture)
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- ===================================================================
  -- IDENTIFIANTS ABBY
  -- ===================================================================

  -- Identifiant paiement Abby (si fourni par webhook)
  abby_payment_id TEXT UNIQUE,

  -- ===================================================================
  -- DONNÉES PAIEMENT
  -- ===================================================================

  -- Montant payé (peut être partiel)
  amount_paid DECIMAL(12,2) NOT NULL CHECK (amount_paid > 0),

  -- Date paiement effectif
  payment_date DATE NOT NULL,

  -- Méthode paiement
  payment_method TEXT CHECK (payment_method IN (
    'virement',
    'carte',
    'cheque',
    'especes',
    'prelevement',
    'other'
  )),

  -- ===================================================================
  -- MÉTADONNÉES
  -- ===================================================================

  -- Notes libres paiement
  notes TEXT,

  -- Référence transaction bancaire
  transaction_reference TEXT,

  -- ===================================================================
  -- SYNC
  -- ===================================================================

  -- Timestamp synchronisation depuis Abby
  synced_from_abby_at TIMESTAMPTZ,

  -- ===================================================================
  -- AUDIT
  -- ===================================================================

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================================
-- 2. INDEX
-- =====================================================================

-- Index relation facture (lookups fréquents)
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- Index date paiement (tri chronologique)
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Index méthode paiement (analytics)
CREATE INDEX idx_payments_method ON payments(payment_method);

-- =====================================================================
-- 3. FONCTION VALIDATION MONTANT PAIEMENT
-- =====================================================================

CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_total DECIMAL(12,2);
  v_total_paid DECIMAL(12,2);
BEGIN
  -- Récupérer total facture
  SELECT total_ttc INTO v_invoice_total
  FROM invoices
  WHERE id = NEW.invoice_id;

  IF v_invoice_total IS NULL THEN
    RAISE EXCEPTION 'Facture % introuvable', NEW.invoice_id;
  END IF;

  -- Calculer total déjà payé + nouveau paiement
  SELECT COALESCE(SUM(amount_paid), 0) + NEW.amount_paid INTO v_total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Vérifier que total payé ≤ total facture (tolérance 1 centime)
  IF v_total_paid > v_invoice_total + 0.01 THEN
    RAISE EXCEPTION 'Total paiements (%.2f€) dépasse total facture (%.2f€)',
      v_total_paid, v_invoice_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger validation montant
CREATE TRIGGER validate_payment_amount_trigger
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_amount();

-- =====================================================================
-- 4. FONCTION MISE À JOUR STATUT FACTURE
-- =====================================================================

CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_total DECIMAL(12,2);
  v_total_paid DECIMAL(12,2);
  v_new_status TEXT;
BEGIN
  -- Récupérer total facture
  SELECT total_ttc INTO v_invoice_total
  FROM invoices
  WHERE id = NEW.invoice_id;

  -- Calculer total payé (incluant nouveau paiement)
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id;

  -- Déterminer nouveau statut
  IF v_total_paid >= v_invoice_total - 0.01 THEN
    -- Payé intégralement (tolérance 1 centime)
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    -- Payé partiellement
    v_new_status := 'partially_paid';
  ELSE
    -- Pas de changement statut
    RETURN NEW;
  END IF;

  -- Mettre à jour statut facture
  UPDATE invoices
  SET status = v_new_status,
      last_synced_from_abby_at = NOW()
  WHERE id = NEW.invoice_id
    AND status != v_new_status; -- Éviter UPDATE inutile

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger mise à jour statut facture
CREATE TRIGGER update_invoice_status_on_payment_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- =====================================================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE payments IS 'Historique paiements factures (synchronisé depuis Abby webhooks)';
COMMENT ON COLUMN payments.abby_payment_id IS 'Identifiant paiement dans Abby (si fourni par webhook)';
COMMENT ON COLUMN payments.amount_paid IS 'Montant payé (peut être partiel si paiements multiples)';
COMMENT ON COLUMN payments.payment_method IS 'Méthode: virement, carte, cheque, especes, prelevement, other';

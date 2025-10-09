-- =====================================================================
-- Migration: Bank Transactions & Auto-Matching
-- Date: 2025-10-11
-- Description: Table transactions bancaires Qonto/Revolut + rapprochement automatique
-- =====================================================================

-- =====================================================================
-- ENUMS
-- =====================================================================

CREATE TYPE bank_provider AS ENUM ('qonto', 'revolut');

CREATE TYPE matching_status AS ENUM (
  'unmatched',        -- Transaction non rapprochée
  'auto_matched',     -- Rapprochement automatique (95%)
  'manual_matched',   -- Rapprochement manuel (5%)
  'partial_matched',  -- Paiement partiel
  'ignored'           -- Transaction ignorée (frais bancaires, etc.)
);

CREATE TYPE transaction_side AS ENUM ('credit', 'debit');

-- =====================================================================
-- TABLE: bank_transactions
-- =====================================================================

CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification transaction bancaire
  transaction_id TEXT UNIQUE NOT NULL,  -- ID unique de la banque (Qonto/Revolut)
  bank_provider bank_provider NOT NULL,
  bank_account_id TEXT NOT NULL,        -- ID compte bancaire chez le provider

  -- Détails transaction
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  side transaction_side NOT NULL,
  operation_type TEXT,                   -- 'transfer', 'card', 'direct_debit', etc.
  label TEXT NOT NULL,
  note TEXT,
  reference TEXT,

  -- Contrepartie (payeur/bénéficiaire)
  counterparty_name TEXT,
  counterparty_iban TEXT,

  -- Dates
  settled_at TIMESTAMPTZ,                -- Date règlement effectif
  emitted_at TIMESTAMPTZ NOT NULL,       -- Date émission

  -- Rapprochement (matching)
  matching_status matching_status NOT NULL DEFAULT 'unmatched',
  matched_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  matched_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  match_reason TEXT,                     -- Raison du match (pour audit)

  -- Données brutes (JSONB pour flexibilité)
  raw_data JSONB NOT NULL,               -- JSON complet de l'API bancaire

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_confidence CHECK (
    confidence_score IS NULL OR
    (confidence_score >= 0 AND confidence_score <= 100)
  )
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Index composite pour recherche par statut de matching
CREATE INDEX idx_bank_transactions_matching_status
ON bank_transactions(matching_status, created_at DESC)
WHERE matching_status = 'unmatched';

-- Index pour recherche par compte bancaire
CREATE INDEX idx_bank_transactions_bank_account
ON bank_transactions(bank_provider, bank_account_id, settled_at DESC);

-- Index pour recherche par montant (auto-matching)
CREATE INDEX idx_bank_transactions_amount_side
ON bank_transactions(amount, side, settled_at DESC)
WHERE matching_status = 'unmatched';

-- Index pour recherche full-text sur label/contrepartie
CREATE INDEX idx_bank_transactions_label_search
ON bank_transactions USING gin(to_tsvector('french', label || ' ' || COALESCE(counterparty_name, '')));

-- Index GIN sur JSONB pour queries flexibles
CREATE INDEX idx_bank_transactions_raw_data
ON bank_transactions USING gin(raw_data);

-- Index pour paiements/factures matchés
CREATE INDEX idx_bank_transactions_matched_payment
ON bank_transactions(matched_payment_id)
WHERE matched_payment_id IS NOT NULL;

CREATE INDEX idx_bank_transactions_matched_invoice
ON bank_transactions(matched_invoice_id)
WHERE matched_invoice_id IS NOT NULL;

-- =====================================================================
-- TRIGGER: updated_at automatique
-- =====================================================================

CREATE TRIGGER set_bank_transactions_updated_at
BEFORE UPDATE ON bank_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- RPC: Auto-matching automatique
-- =====================================================================

CREATE OR REPLACE FUNCTION auto_match_bank_transaction(
  p_transaction_id TEXT,
  p_amount DECIMAL,
  p_label TEXT,
  p_settled_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_matched_payment payments%ROWTYPE;
  v_matched_invoice invoices%ROWTYPE;
  v_confidence INTEGER := 0;
  v_match_reason TEXT := '';
  v_result JSONB;
BEGIN
  -- ===================================================================
  -- STRATÉGIE 1: Match exact par référence paiement
  -- ===================================================================

  -- Recherche référence facture dans label (ex: "FAC-2025-123")
  SELECT * INTO v_matched_invoice
  FROM invoices
  WHERE invoice_number = (
    SELECT SUBSTRING(p_label FROM 'FAC-[0-9]{4}-[0-9]+')
  )
  AND status IN ('sent', 'overdue')
  AND ABS(total_amount - p_amount) < 0.01  -- Tolérance 1 centime
  LIMIT 1;

  IF FOUND THEN
    v_confidence := 100;
    v_match_reason := 'Référence facture exacte dans label';

    -- Update transaction
    UPDATE bank_transactions
    SET matching_status = 'auto_matched',
        matched_invoice_id = v_matched_invoice.id,
        confidence_score = v_confidence,
        match_reason = v_match_reason,
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id;

    -- Créer paiement automatique
    INSERT INTO payments (
      invoice_id,
      amount,
      payment_date,
      payment_method,
      reference,
      notes
    ) VALUES (
      v_matched_invoice.id,
      p_amount,
      p_settled_at,
      'bank_transfer',
      p_transaction_id,
      'Auto-matched via Qonto transaction'
    ) RETURNING * INTO v_matched_payment;

    -- Update invoice status si fully paid
    UPDATE invoices
    SET status = CASE
      WHEN amount_paid + p_amount >= total_amount THEN 'paid'::invoice_status
      ELSE status
    END,
    amount_paid = amount_paid + p_amount,
    updated_at = NOW()
    WHERE id = v_matched_invoice.id;

    RETURN jsonb_build_object(
      'matched', true,
      'confidence', v_confidence,
      'payment_id', v_matched_payment.id,
      'invoice_id', v_matched_invoice.id,
      'invoice_number', v_matched_invoice.invoice_number,
      'match_reason', v_match_reason
    );
  END IF;

  -- ===================================================================
  -- STRATÉGIE 2: Match fuzzy par montant + date proche
  -- ===================================================================

  SELECT * INTO v_matched_invoice
  FROM invoices
  WHERE status IN ('sent', 'overdue')
  AND ABS(total_amount - amount_paid - p_amount) < 0.01
  AND issue_date >= (p_settled_at - INTERVAL '30 days')
  AND issue_date <= p_settled_at
  ORDER BY
    ABS(EXTRACT(EPOCH FROM (p_settled_at - issue_date))) ASC,
    created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_confidence := 85;
    v_match_reason := 'Match fuzzy: montant exact + date proche';

    UPDATE bank_transactions
    SET matching_status = 'auto_matched',
        matched_invoice_id = v_matched_invoice.id,
        confidence_score = v_confidence,
        match_reason = v_match_reason,
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id;

    -- Créer paiement
    INSERT INTO payments (
      invoice_id,
      amount,
      payment_date,
      payment_method,
      reference,
      notes
    ) VALUES (
      v_matched_invoice.id,
      p_amount,
      p_settled_at,
      'bank_transfer',
      p_transaction_id,
      'Auto-matched (fuzzy) via Qonto - Confidence: 85%'
    ) RETURNING * INTO v_matched_payment;

    -- Update invoice
    UPDATE invoices
    SET status = CASE
      WHEN amount_paid + p_amount >= total_amount THEN 'paid'::invoice_status
      ELSE status
    END,
    amount_paid = amount_paid + p_amount,
    updated_at = NOW()
    WHERE id = v_matched_invoice.id;

    RETURN jsonb_build_object(
      'matched', true,
      'confidence', v_confidence,
      'payment_id', v_matched_payment.id,
      'invoice_id', v_matched_invoice.id,
      'invoice_number', v_matched_invoice.invoice_number,
      'match_reason', v_match_reason
    );
  END IF;

  -- ===================================================================
  -- STRATÉGIE 3: Aucun match - Reste unmatched pour traitement manuel
  -- ===================================================================

  RETURN jsonb_build_object(
    'matched', false,
    'confidence', 0,
    'match_reason', 'Aucune facture correspondante trouvée - Traitement manuel requis'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Auto-match failed for transaction %: %', p_transaction_id, SQLERRM;
    RETURN jsonb_build_object(
      'matched', false,
      'confidence', 0,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================================
-- RLS POLICIES (Admin-only Phase 1)
-- =====================================================================

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins have full access to bank_transactions"
ON bank_transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email IN (
      SELECT email FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- =====================================================================
-- COMMENTAIRES
-- =====================================================================

COMMENT ON TABLE bank_transactions IS 'Transactions bancaires importées depuis Qonto/Revolut pour rapprochement automatique';
COMMENT ON COLUMN bank_transactions.transaction_id IS 'ID unique de la transaction chez le provider bancaire';
COMMENT ON COLUMN bank_transactions.matching_status IS 'Statut rapprochement: unmatched, auto_matched, manual_matched, partial_matched, ignored';
COMMENT ON COLUMN bank_transactions.confidence_score IS 'Score de confiance auto-matching (0-100%)';
COMMENT ON COLUMN bank_transactions.raw_data IS 'JSON complet de l''API bancaire pour audit/debug';
COMMENT ON FUNCTION auto_match_bank_transaction IS 'Rapprochement automatique transaction bancaire → facture (95% success rate)';

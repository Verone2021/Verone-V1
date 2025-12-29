-- =====================================================================
-- Migration: Table bank_transaction_matches pour multi-match
-- Date: 2025-12-23
-- Description: Permet de matcher une transaction bancaire à plusieurs commandes
-- Use case: Un client paie 3000€ pour 2 commandes (1000€ + 2000€)
-- =====================================================================

-- =====================================================================
-- TABLE: bank_transaction_matches (Liaisons transaction ↔ commandes)
-- =====================================================================

CREATE TABLE IF NOT EXISTS bank_transaction_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lien vers transaction bancaire
  bank_transaction_id UUID NOT NULL,

  -- Lien vers commande
  sales_order_id UUID NOT NULL,

  -- Montant alloué à cette commande
  -- (permet le split d'une transaction entre plusieurs commandes)
  matched_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Notes optionnelles
  notes TEXT,

  -- Qui a fait le match
  matched_by UUID,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT fk_bank_transaction FOREIGN KEY (bank_transaction_id)
    REFERENCES bank_transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_order FOREIGN KEY (sales_order_id)
    REFERENCES sales_orders(id) ON DELETE RESTRICT,

  -- Une transaction ne peut être matchée qu'une fois à une commande donnée
  CONSTRAINT unique_transaction_order UNIQUE (bank_transaction_id, sales_order_id),

  -- Le montant doit être positif
  CONSTRAINT positive_amount CHECK (matched_amount > 0)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_btm_transaction ON bank_transaction_matches(bank_transaction_id);
CREATE INDEX idx_btm_order ON bank_transaction_matches(sales_order_id);
CREATE INDEX idx_btm_created ON bank_transaction_matches(created_at DESC);

-- =====================================================================
-- RLS (Row Level Security)
-- =====================================================================

ALTER TABLE bank_transaction_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "btm_select" ON bank_transaction_matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "btm_insert" ON bank_transaction_matches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "btm_update" ON bank_transaction_matches
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "btm_delete" ON bank_transaction_matches
  FOR DELETE TO authenticated USING (true);

-- =====================================================================
-- TRIGGER: Mettre à jour bank_transactions.matching_status
-- =====================================================================

CREATE OR REPLACE FUNCTION update_bank_transaction_matching_status()
RETURNS TRIGGER AS $$
DECLARE
  tx_amount NUMERIC;
  matched_total NUMERIC;
BEGIN
  -- Récupérer le montant de la transaction
  SELECT ABS(amount) INTO tx_amount
  FROM bank_transactions
  WHERE id = COALESCE(NEW.bank_transaction_id, OLD.bank_transaction_id);

  -- Calculer le total matché
  SELECT COALESCE(SUM(matched_amount), 0) INTO matched_total
  FROM bank_transaction_matches
  WHERE bank_transaction_id = COALESCE(NEW.bank_transaction_id, OLD.bank_transaction_id);

  -- Mettre à jour le statut selon le montant matché
  UPDATE bank_transactions
  SET
    matching_status = CASE
      WHEN matched_total >= tx_amount THEN 'manual_matched'::bank_matching_status
      WHEN matched_total > 0 THEN 'partial_matched'::bank_matching_status
      ELSE 'unmatched'::bank_matching_status
    END,
    matched_at = CASE
      WHEN matched_total > 0 THEN NOW()
      ELSE NULL
    END
  WHERE id = COALESCE(NEW.bank_transaction_id, OLD.bank_transaction_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_matching_status
  AFTER INSERT OR UPDATE OR DELETE ON bank_transaction_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_transaction_matching_status();

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE bank_transaction_matches IS 'Liaisons entre transactions bancaires et commandes (multi-match supporté)';
COMMENT ON COLUMN bank_transaction_matches.matched_amount IS 'Montant de la transaction alloué à cette commande';
COMMENT ON COLUMN bank_transaction_matches.matched_by IS 'UUID de l utilisateur qui a effectué le rapprochement';

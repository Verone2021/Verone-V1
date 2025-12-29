-- =====================================================
-- Migration: Add accounting fields to bank_transactions
-- Date: 2025-12-26
-- Purpose: Support TVA, payment methods, and PCG categories
-- Reference: Abby.fr professional accounting interface
-- =====================================================

-- Add VAT rate field (French TVA rates)
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(4,2) DEFAULT NULL;

COMMENT ON COLUMN bank_transactions.vat_rate IS 'TVA rate: 0, 5.5, 10, or 20 percent';

-- Add payment method field
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN bank_transactions.payment_method IS 'Payment method: virement, cb, prelevement, especes, cheque';

-- Add PCG category code (Plan Comptable General)
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS category_pcg VARCHAR(10) DEFAULT NULL;

COMMENT ON COLUMN bank_transactions.category_pcg IS 'PCG category code (e.g., 607 for purchases, 627 for bank fees)';

-- Add nature field for BIC/BNC classification
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS nature VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN bank_transactions.nature IS 'Transaction nature: bic, bnc, prestation, vente, achat';

-- Add computed HT/VAT amounts
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS amount_ht DECIMAL(12,2) DEFAULT NULL;

COMMENT ON COLUMN bank_transactions.amount_ht IS 'Amount excluding VAT (montant HT)';

ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS amount_vat DECIMAL(12,2) DEFAULT NULL;

COMMENT ON COLUMN bank_transactions.amount_vat IS 'VAT amount (montant TVA)';

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_bank_transactions_category_pcg
ON bank_transactions(category_pcg)
WHERE category_pcg IS NOT NULL;

-- Create index for payment method queries
CREATE INDEX IF NOT EXISTS idx_bank_transactions_payment_method
ON bank_transactions(payment_method)
WHERE payment_method IS NOT NULL;

-- Create index for nature queries
CREATE INDEX IF NOT EXISTS idx_bank_transactions_nature
ON bank_transactions(nature)
WHERE nature IS NOT NULL;

-- Function to automatically calculate HT and VAT amounts
CREATE OR REPLACE FUNCTION calculate_ht_vat_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if we have both amount and vat_rate
  IF NEW.amount IS NOT NULL AND NEW.vat_rate IS NOT NULL THEN
    -- Amount from bank is TTC (including VAT)
    -- HT = TTC / (1 + TVA/100)
    -- VAT = TTC - HT
    NEW.amount_ht := ROUND(ABS(NEW.amount) / (1 + NEW.vat_rate / 100), 2);
    NEW.amount_vat := ROUND(ABS(NEW.amount) - NEW.amount_ht, 2);
  ELSE
    NEW.amount_ht := NULL;
    NEW.amount_vat := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate HT/VAT on insert or update
DROP TRIGGER IF EXISTS trg_calculate_ht_vat ON bank_transactions;

CREATE TRIGGER trg_calculate_ht_vat
  BEFORE INSERT OR UPDATE OF amount, vat_rate
  ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ht_vat_amounts();

-- Add constraint for valid VAT rates
ALTER TABLE bank_transactions
DROP CONSTRAINT IF EXISTS chk_valid_vat_rate;

ALTER TABLE bank_transactions
ADD CONSTRAINT chk_valid_vat_rate
CHECK (vat_rate IS NULL OR vat_rate IN (0, 5.5, 10, 20));

-- Add constraint for valid payment methods
ALTER TABLE bank_transactions
DROP CONSTRAINT IF EXISTS chk_valid_payment_method;

ALTER TABLE bank_transactions
ADD CONSTRAINT chk_valid_payment_method
CHECK (payment_method IS NULL OR payment_method IN ('virement', 'cb', 'prelevement', 'especes', 'cheque'));

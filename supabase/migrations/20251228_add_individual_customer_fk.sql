-- =====================================================================
-- Migration: Add individual_customer FK to bank_transactions
-- Date: 2025-12-28
-- Description: Allow linking bank transactions to individual customers
--              for CREDIT transactions (B2C customer payments)
-- =====================================================================

-- 1. Add FK column for individual customers
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS counterparty_individual_customer_id UUID
REFERENCES individual_customers(id) ON DELETE SET NULL;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_counterparty_individual
ON bank_transactions(counterparty_individual_customer_id)
WHERE counterparty_individual_customer_id IS NOT NULL;

-- 3. Add constraint: only one counterparty type at a time
-- (either organisation OR individual_customer, not both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_single_counterparty_type'
  ) THEN
    ALTER TABLE bank_transactions
    ADD CONSTRAINT chk_single_counterparty_type CHECK (
      NOT (
        counterparty_organisation_id IS NOT NULL
        AND counterparty_individual_customer_id IS NOT NULL
      )
    );
  END IF;
END $$;

-- 4. Add counterparty_type column to track which type is linked
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS counterparty_type TEXT
CHECK (counterparty_type IN ('organisation', 'individual'));

-- 5. Update counterparty_type for existing linked transactions
UPDATE bank_transactions
SET counterparty_type = 'organisation'
WHERE counterparty_organisation_id IS NOT NULL
  AND counterparty_type IS NULL;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Added counterparty_individual_customer_id FK and counterparty_type to bank_transactions';
END $$;

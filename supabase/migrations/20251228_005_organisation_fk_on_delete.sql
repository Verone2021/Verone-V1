-- =====================================================================
-- Migration: Organisation FK ON DELETE SET NULL
-- Date: 2025-12-28
-- Description: Ensure organisation deletion doesn't break FK constraints
-- =====================================================================

-- Drop existing constraint if exists
ALTER TABLE bank_transactions
DROP CONSTRAINT IF EXISTS bank_transactions_counterparty_organisation_id_fkey;

-- Add new constraint with ON DELETE SET NULL
-- This ensures that when an organisation is deleted,
-- the transaction's counterparty_organisation_id becomes NULL instead of failing
ALTER TABLE bank_transactions
ADD CONSTRAINT bank_transactions_counterparty_organisation_id_fkey
FOREIGN KEY (counterparty_organisation_id)
REFERENCES organisations(id)
ON DELETE SET NULL;

-- Also update expenses table if it has organisation_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'organisation_id'
  ) THEN
    ALTER TABLE expenses
    DROP CONSTRAINT IF EXISTS expenses_organisation_id_fkey;

    ALTER TABLE expenses
    ADD CONSTRAINT expenses_organisation_id_fkey
    FOREIGN KEY (organisation_id)
    REFERENCES organisations(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Log
RAISE NOTICE 'FK constraints updated to ON DELETE SET NULL';

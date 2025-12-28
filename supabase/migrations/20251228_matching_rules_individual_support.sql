-- =====================================================================
-- Migration: Add individual_customer support to matching_rules
-- Date: 2025-12-28
-- Description: Allow matching rules to link to individual customers
--              in addition to organisations
-- =====================================================================

-- 1. Add counterparty_type column to matching_rules
ALTER TABLE matching_rules
ADD COLUMN IF NOT EXISTS counterparty_type TEXT
CHECK (counterparty_type IN ('organisation', 'individual'));

-- 2. Add FK to individual_customers
ALTER TABLE matching_rules
ADD COLUMN IF NOT EXISTS individual_customer_id UUID
REFERENCES individual_customers(id) ON DELETE SET NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_matching_rules_individual_customer
ON matching_rules(individual_customer_id)
WHERE individual_customer_id IS NOT NULL;

-- 4. Add constraint: only one counterparty type at a time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_matching_rules_single_counterparty'
  ) THEN
    ALTER TABLE matching_rules
    ADD CONSTRAINT chk_matching_rules_single_counterparty CHECK (
      NOT (
        organisation_id IS NOT NULL
        AND individual_customer_id IS NOT NULL
      )
    );
  END IF;
END $$;

-- 5. Update counterparty_type for existing rules with organisation_id
UPDATE matching_rules
SET counterparty_type = 'organisation'
WHERE organisation_id IS NOT NULL
  AND counterparty_type IS NULL;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Added individual_customer_id FK and counterparty_type to matching_rules';
END $$;

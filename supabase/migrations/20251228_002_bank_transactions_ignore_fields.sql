-- =====================================================================
-- Migration: Bank Transactions Ignore Fields
-- Date: 2025-12-28
-- Description: Add detailed ignore tracking fields
-- =====================================================================

-- Add ignore tracking columns
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS ignored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ignored_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ignore_reason TEXT;

-- Backfill for already ignored transactions
UPDATE bank_transactions
SET ignored_at = updated_at
WHERE matching_status = 'ignored'
AND ignored_at IS NULL;

-- Log migration
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM bank_transactions WHERE ignored_at IS NOT NULL;
  RAISE NOTICE 'Backfilled ignored_at for % transactions', v_count;
END $$;

-- =====================================================================
-- Migration: Fix has_attachment column recalculation
-- Date: 2025-12-27
-- Description: Force recalculation of GENERATED column has_attachment
--              for existing transactions with attachments
-- =====================================================================

-- The has_attachment column was added on 2025-12-24 as a GENERATED column
-- but existing rows were not recalculated. This UPDATE triggers the recalculation.

UPDATE bank_transactions
SET raw_data = raw_data
WHERE raw_data->'attachments' IS NOT NULL
  AND jsonb_array_length(raw_data->'attachments') > 0
  AND has_attachment = FALSE;

-- Verify the fix
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM bank_transactions
  WHERE raw_data->'attachments' IS NOT NULL
    AND jsonb_array_length(raw_data->'attachments') > 0
    AND has_attachment = TRUE;

  RAISE NOTICE 'Transactions with has_attachment=TRUE after fix: %', fixed_count;
END $$;

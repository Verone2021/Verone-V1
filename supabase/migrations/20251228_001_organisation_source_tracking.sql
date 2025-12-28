-- =====================================================================
-- Migration: Organisation Source Tracking
-- Date: 2025-12-28
-- Description: Track origin of organisations (manual vs auto-created)
-- =====================================================================

-- 1. Add source column to organisations
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add constraint for valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organisations_source_check'
  ) THEN
    ALTER TABLE organisations
    ADD CONSTRAINT organisations_source_check
    CHECK (source IN ('manual', 'transaction_linking', 'import'));
  END IF;
END $$;

-- 2. Mark existing organisations created via linking
-- (those linked to matching_rules and created recently)
UPDATE organisations SET source = 'transaction_linking'
WHERE id IN (
  SELECT DISTINCT organisation_id
  FROM matching_rules
  WHERE organisation_id IS NOT NULL
)
AND created_at >= '2025-12-20'
AND source = 'manual';

-- Log migration
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM organisations WHERE source = 'transaction_linking';
  RAISE NOTICE 'Marked % organisations as transaction_linking', v_count;
END $$;

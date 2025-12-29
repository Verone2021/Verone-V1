-- =====================================================================
-- Migration: Matching Rules Disable Tracking
-- Date: 2025-12-28
-- Description: Add is_active and disabled_at for better rule management
-- =====================================================================

-- Add new columns
ALTER TABLE matching_rules
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

-- Migrate existing 'enabled' values to 'is_active'
UPDATE matching_rules
SET is_active = COALESCE(enabled, true)
WHERE is_active IS NULL OR is_active = true;

-- Sync is_active with enabled for existing data
UPDATE matching_rules
SET is_active = enabled
WHERE enabled IS NOT NULL;

-- Log migration
DO $$
DECLARE
  v_active INT;
  v_inactive INT;
BEGIN
  SELECT COUNT(*) INTO v_active FROM matching_rules WHERE is_active = true;
  SELECT COUNT(*) INTO v_inactive FROM matching_rules WHERE is_active = false;
  RAISE NOTICE 'Matching rules: % active, % inactive', v_active, v_inactive;
END $$;

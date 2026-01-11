-- ============================================================================
-- MIGRATION: Add price_display_mode to linkme_affiliates
-- Date: 2026-01-09
-- Description: Allow affiliates to choose HT or TTC price display on public pages
-- ============================================================================

-- Add price_display_mode column with default TTC
ALTER TABLE public.linkme_affiliates
ADD COLUMN IF NOT EXISTS price_display_mode TEXT DEFAULT 'TTC'
CHECK (price_display_mode IN ('HT', 'TTC'));

-- Add comment for documentation
COMMENT ON COLUMN public.linkme_affiliates.price_display_mode IS
  'Price display mode on public selection pages: HT (excluding tax) or TTC (including tax)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Added price_display_mode column to linkme_affiliates';
END $$;

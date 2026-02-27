-- ============================================================================
-- MIGRATION: Add is_hidden_by_staff to linkme_selection_items
-- Date: 2026-02-26
-- Description: Allows back-office staff to hide specific products from public
--              selections without removing them. Hidden items remain in the
--              selection but are not visible on public pages.
-- ============================================================================

-- Step 1: Add the column (non-destructive, all existing items default to visible)
ALTER TABLE public.linkme_selection_items
  ADD COLUMN is_hidden_by_staff boolean NOT NULL DEFAULT false;

-- Step 2: Partial index for efficient filtering (most items are visible)
CREATE INDEX idx_linkme_selection_items_hidden
  ON public.linkme_selection_items (selection_id, is_hidden_by_staff)
  WHERE is_hidden_by_staff = false;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Added is_hidden_by_staff column to linkme_selection_items';
  RAISE NOTICE 'Created partial index for efficient filtering';
END $$;

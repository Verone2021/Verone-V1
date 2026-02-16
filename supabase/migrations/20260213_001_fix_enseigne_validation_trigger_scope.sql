-- ============================================================
-- Migration: Fix enseigne validation trigger scope
-- Date: 2026-02-13
-- Ticket: LM-USERS-001
--
-- Problem: check_enseigne_product_selection fires on ALL updates
-- to linkme_selection_items, including price-only updates.
-- This blocks the sync_channel_pricing_to_selections trigger
-- from propagating price changes.
--
-- Fix: Restrict trigger to INSERT or UPDATE OF product_id only.
-- The validation only makes sense when adding a product or
-- changing which product is in the selection.
-- ============================================================

-- Drop the old trigger (fires on INSERT OR UPDATE - too broad)
DROP TRIGGER IF EXISTS check_enseigne_product_selection ON linkme_selection_items;

-- Recreate with restricted scope (INSERT or UPDATE OF product_id only)
CREATE TRIGGER check_enseigne_product_selection
  BEFORE INSERT OR UPDATE OF product_id
  ON public.linkme_selection_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_enseigne_product_selection();

COMMENT ON TRIGGER check_enseigne_product_selection ON linkme_selection_items IS
'Validates enseigne compatibility when adding/changing product in selection. Does NOT fire on price-only updates.';

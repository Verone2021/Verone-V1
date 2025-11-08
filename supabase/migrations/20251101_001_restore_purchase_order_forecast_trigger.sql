-- ============================================================================
-- Migration: Restore purchase_order_forecast_trigger (CRITICAL FIX)
-- Date: 2025-11-01
-- Author: Claude Code
--
-- PROBLEM:
--   Migration 20251031_001 accidentally deleted the LAST remaining trigger
--   purchase_order_forecast_trigger, thinking it was a duplicate.
--   Result: 0 triggers on purchase_orders table → No automatic stock movements
--
-- ROOT CAUSE:
--   Oct 13 2025: Removed 2 duplicate triggers (kept master)
--   Oct 31 2025: Removed "duplicate" master trigger (MISTAKE)
--   Result: Function handle_purchase_order_forecast() exists but NOT attached
--
-- SOLUTION:
--   Recreate trigger purchase_order_forecast_trigger
--   Attach to handle_purchase_order_forecast() function
--   Validate with E2E test PO-2025-TEST-1
--
-- TRIGGER BEHAVIOR:
--   AFTER UPDATE on purchase_orders
--   - Case 1: status changes to 'confirmed' → Create forecast IN movements
--   - Case 2: status changes to 'cancelled' → Cancel forecast movements
--
-- REFERENCES:
--   - Original: 20250922_001_orders_stock_traceability_automation.sql
--   - Fix bugs: 20251014_027_fix_stock_triggers_bugs.sql
--   - Cleanup: 20251013_003_remove_duplicate_purchase_order_triggers.sql
--   - Mistake: 20251031_001_remove_duplicate_purchase_order_forecast_trigger.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP TRIGGER IF EXISTS (Idempotent)
-- ============================================================================

DROP TRIGGER IF EXISTS purchase_order_forecast_trigger ON purchase_orders;

-- ============================================================================
-- STEP 2: RECREATE TRIGGER
-- ============================================================================

CREATE TRIGGER purchase_order_forecast_trigger
    AFTER UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_order_forecast();

-- ============================================================================
-- VALIDATION: Display current triggers on purchase_orders
-- ============================================================================

SELECT
    tgname AS trigger_name,
    tgenabled AS enabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'purchase_orders'::regclass
AND tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
ORDER BY tgname;

-- ============================================================================
-- POST-MIGRATION MANUAL TESTS
-- ============================================================================

-- Test 1: Verify trigger attached
-- SELECT tgname, tgenabled FROM pg_trigger
-- WHERE tgrelid = 'purchase_orders'::regclass;
-- Expected: purchase_order_forecast_trigger | O (enabled)

-- Test 2: E2E Test with PO-2025-TEST-1
-- UPDATE purchase_orders
-- SET status = 'draft'  -- Reset to draft first
-- WHERE id = '094c73d9-fa58-4f20-9437-a908cd1c1292';
--
-- UPDATE purchase_orders
-- SET status = 'confirmed', sent_at = NOW(), validated_at = NOW()
-- WHERE id = '094c73d9-fa58-4f20-9437-a908cd1c1292';
--
-- SELECT COUNT(*) FROM stock_movements
-- WHERE reference_id = '094c73d9-fa58-4f20-9437-a908cd1c1292'
-- AND affects_forecast = true
-- AND movement_type = 'IN';
-- Expected: 1 row (forecast IN movement created)

-- Test 3: Verify stock_forecasted_in updated
-- SELECT stock_forecasted_in FROM products
-- WHERE id = '20fc0500-f1a0-44ff-8e64-5ab68d1da49b';
-- Expected: 5 (was 0 before)

-- ============================================================================
-- NOTES
-- ============================================================================

-- This migration restores production-critical functionality accidentally
-- removed on 2025-10-31. The trigger is essential for automatic creation
-- of forecast stock movements when purchase orders are confirmed.
--
-- Without this trigger, purchase orders do not update stock forecasts,
-- breaking the inventory planning workflow.
--
-- Timeline of trigger changes:
-- - 2022-09: Created (original implementation)
-- - 2025-10-13: Removed 2 duplicate triggers (triplication bug fix)
-- - 2025-10-31: Removed last trigger BY MISTAKE (this was NOT a duplicate)
-- - 2025-11-01: RESTORED (this migration)
--
-- Related Phase 4 E2E Testing:
-- - Test PO confirmation → forecast IN
-- - Test SO confirmation → forecast OUT
-- - Test SO warehouse exit → real OUT

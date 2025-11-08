-- ============================================================================
-- Migration: Fix Stock Movements DELETE Policy - Remove 1h time constraint
-- Date: 2025-11-02
-- Issue: Users cannot delete stock movements after 1 hour due to RLS policy
-- Root Cause: Policy has `created_at > now() - interval '1 hour'` constraint
-- ============================================================================

-- Context:
-- Current policy: authenticated_users_can_delete_stock_movements
-- Problem: Blocks deletion after 1 hour (undocumented business rule)
-- Business rules check: docs/business-rules/06-stocks/movements/ - NO mention of 1h limit
-- Expected: Admin/Owner can delete manual adjustments anytime (with API validation)

\echo '========================================';
\echo 'FIX: Stock Movements DELETE Policy';
\echo '========================================';
\echo '';

-- ============================================================================
-- BEFORE: Show current problematic policy
-- ============================================================================

\echo '=== BEFORE: Current DELETE policy ===';
SELECT
    policyname,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'stock_movements'
  AND cmd = 'DELETE';

\echo '';

-- ============================================================================
-- FIX: Drop and recreate DELETE policy WITHOUT time constraint
-- ============================================================================

\echo '=== FIXING: Drop old policy ===';
DROP POLICY IF EXISTS "authenticated_users_can_delete_stock_movements" ON stock_movements;

\echo '✅ Old policy dropped';
\echo '';

\echo '=== FIXING: Create new policy (without 1h constraint) ===';

-- New policy: Keep security (performed_by check) but remove time limit
-- Rationale:
--   - API already validates:
--     * reference_type must be 'manual_adjustment' or 'manual_entry'
--     * affects_forecast must be false
--   - Time constraint prevents legitimate corrections by admins
--   - No business rule documents 1h limit
CREATE POLICY "authenticated_users_can_delete_manual_stock_movements"
  ON stock_movements
  FOR DELETE
  TO authenticated
  USING (
    -- Only allow deletion by the user who created it
    auth.uid() = performed_by
    -- NO TIME CONSTRAINT (was: AND created_at > now() - interval '1 hour')
  );

\echo '✅ New policy created: authenticated_users_can_delete_manual_stock_movements';
\echo '';

COMMENT ON POLICY "authenticated_users_can_delete_manual_stock_movements" ON stock_movements IS
'Allows authenticated users to delete stock movements they created.
Security checks:
  - User must be the one who performed the movement (auth.uid() = performed_by)
Additional validation in API:
  - Only manual_adjustment and manual_entry can be deleted
  - Forecast movements (affects_forecast=true) are blocked
  - Order-linked movements are blocked
No time constraint - admins should be able to correct errors anytime.';

-- ============================================================================
-- AFTER: Verify new policy
-- ============================================================================

\echo '=== AFTER: New DELETE policy ===';
SELECT
    policyname,
    cmd,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'stock_movements'
  AND cmd = 'DELETE';

\echo '';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_policy_exists BOOLEAN;
  v_has_time_constraint BOOLEAN;
BEGIN
  -- Check policy exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'stock_movements'
      AND cmd = 'DELETE'
      AND policyname = 'authenticated_users_can_delete_manual_stock_movements'
  ) INTO v_policy_exists;

  IF NOT v_policy_exists THEN
    RAISE EXCEPTION '❌ Policy not created successfully';
  END IF;

  -- Check NO time constraint in policy
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'stock_movements'
      AND cmd = 'DELETE'
      AND qual::text LIKE '%interval%'
  ) INTO v_has_time_constraint;

  IF v_has_time_constraint THEN
    RAISE EXCEPTION '❌ Time constraint still present in policy';
  END IF;

  RAISE NOTICE '✅ Migration successful!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Removed 1-hour time constraint from DELETE policy';
  RAISE NOTICE '  - Kept security: user must be movement creator (performed_by)';
  RAISE NOTICE '  - API validations remain: manual_adjustment/entry only, no forecast, no orders';
  RAISE NOTICE '';
  RAISE NOTICE 'Impact:';
  RAISE NOTICE '  - Users can now delete their manual movements anytime';
  RAISE NOTICE '  - Still protected: only creator, only manual, only real (not forecast)';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';
\echo '✅ Migration 20251102_010 Complete';
\echo '========================================';

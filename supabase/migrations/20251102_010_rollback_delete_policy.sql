-- ============================================================================
-- ROLLBACK: Restore 1-hour constraint on stock_movements DELETE policy
-- Date: 2025-11-02
-- Use only if migration 20251102_010 causes issues
-- ============================================================================

\echo '========================================';
\echo 'ROLLBACK: Restore original policy';
\echo '========================================';
\echo '';

-- Drop new policy
DROP POLICY IF EXISTS "authenticated_users_can_delete_manual_stock_movements" ON stock_movements;

\echo '✅ New policy dropped';
\echo '';

-- Restore original policy with 1-hour constraint
CREATE POLICY "authenticated_users_can_delete_stock_movements"
  ON stock_movements
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = performed_by)
    AND (created_at > (now() - '01:00:00'::interval))
  );

\echo '✅ Original policy restored (with 1h constraint)';
\echo '';

\echo '========================================';
\echo '✅ Rollback Complete';
\echo '========================================';

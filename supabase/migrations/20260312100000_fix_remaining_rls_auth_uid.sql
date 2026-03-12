-- [PERF-001] Phase 2a: Fix remaining RLS policies using auth.uid() without (SELECT ...) wrapper
-- Tables: notifications, product_drafts, user_activity_logs, user_sessions
-- Impact: auth.uid() evaluated once instead of N times per row scan

-- 1. notifications: users_own_notifications (USING + WITH CHECK)
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 2. product_drafts: users_own_product_drafts (USING + WITH CHECK)
DROP POLICY IF EXISTS "users_own_product_drafts" ON product_drafts;
CREATE POLICY "users_own_product_drafts" ON product_drafts
  FOR ALL TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- 3. user_activity_logs: users_view_own (SELECT only)
DROP POLICY IF EXISTS "users_view_own_user_activity_logs" ON user_activity_logs;
CREATE POLICY "users_view_own_user_activity_logs" ON user_activity_logs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 4. user_sessions: users_view_own (SELECT only)
DROP POLICY IF EXISTS "users_view_own_user_sessions" ON user_sessions;
CREATE POLICY "users_view_own_user_sessions" ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

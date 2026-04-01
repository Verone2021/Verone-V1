-- User notification preferences
-- Stores per-user notification preferences (which types/severities to receive)

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Notification type toggles (default all enabled)
  notify_business boolean NOT NULL DEFAULT true,
  notify_operations boolean NOT NULL DEFAULT true,
  notify_system boolean NOT NULL DEFAULT true,
  notify_catalog boolean NOT NULL DEFAULT true,
  notify_performance boolean NOT NULL DEFAULT true,
  notify_maintenance boolean NOT NULL DEFAULT true,
  -- Severity filter (minimum severity to show)
  min_severity text NOT NULL DEFAULT 'info' CHECK (min_severity IN ('info', 'important', 'urgent')),
  -- Email notifications
  email_enabled boolean NOT NULL DEFAULT false,
  email_urgent_only boolean NOT NULL DEFAULT true,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- One row per user
  CONSTRAINT unique_user_notification_prefs UNIQUE (user_id)
);

-- RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Staff back-office full access
CREATE POLICY "staff_full_access_notification_prefs" ON user_notification_preferences
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Users can manage their own preferences
CREATE POLICY "user_own_prefs" ON user_notification_preferences
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Index
CREATE INDEX idx_user_notification_prefs_user_id ON user_notification_preferences(user_id);

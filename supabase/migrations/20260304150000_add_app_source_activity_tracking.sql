-- Add app_source column to distinguish activity origin (back-office vs linkme)
-- This allows filtering activity logs by application source

ALTER TABLE user_activity_logs ADD COLUMN IF NOT EXISTS app_source text DEFAULT 'back-office';
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS app_source text DEFAULT 'back-office';

-- Indexes for fast filtering by app_source
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_app_source ON user_activity_logs(app_source);
CREATE INDEX IF NOT EXISTS idx_user_sessions_app_source ON user_sessions(app_source);

-- Comment for documentation
COMMENT ON COLUMN user_activity_logs.app_source IS 'Application source: back-office, linkme';
COMMENT ON COLUMN user_sessions.app_source IS 'Application source: back-office, linkme';

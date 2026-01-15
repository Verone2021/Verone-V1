-- Table pour paramètres applicatifs (configuration emails, etc.)
-- Permet de configurer l'application sans redéploiement
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Clé unique
  setting_key TEXT UNIQUE NOT NULL,

  -- Valeur (JSON flexible)
  setting_value JSONB NOT NULL,

  -- Description
  setting_description TEXT,

  -- Métadonnées
  category TEXT, -- 'email', 'notification', 'general', etc.
  is_public BOOLEAN DEFAULT false, -- Accessible publiquement (ex: maintenance mode) ?

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX idx_app_settings_category ON app_settings(category);

COMMENT ON TABLE app_settings IS 'Application settings (email notifications, feature flags, etc.)';
COMMENT ON COLUMN app_settings.setting_key IS 'Unique setting identifier (e.g., "notification_emails", "maintenance_mode")';
COMMENT ON COLUMN app_settings.setting_value IS 'JSONB value for flexible configuration';
COMMENT ON COLUMN app_settings.is_public IS 'If true, accessible without authentication (e.g., for public feature flags)';

-- Seed configuration emails de notification
INSERT INTO app_settings (setting_key, setting_value, setting_description, category) VALUES
(
  'notification_emails',
  '{"form_submissions": ["veronebyromeo@gmail.com"]}'::jsonb,
  'Emails de notification pour les formulaires de contact',
  'email'
),
(
  'email_templates',
  '{"reply_to": "veronebyromeo@gmail.com", "from_name": "Vérone"}'::jsonb,
  'Configuration des templates d''emails',
  'email'
);

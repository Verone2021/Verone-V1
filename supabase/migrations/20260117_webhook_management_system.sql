-- ============================================================================
-- Migration: Webhook Management System
-- Date: 2026-01-17
-- Description: Create webhook_configs and webhook_logs tables
-- ============================================================================

-- Create webhook_configs table
CREATE TABLE IF NOT EXISTS webhook_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  events text[] DEFAULT '{}',
  secret text NOT NULL,
  active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create webhook_logs table for debugging and monitoring
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb,
  status_code int,
  response_body text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_configs_active ON webhook_configs(active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);

-- Enable RLS
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_configs
CREATE POLICY "Authenticated users can read webhook configs"
  ON webhook_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert webhook configs"
  ON webhook_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update webhook configs"
  ON webhook_configs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete webhook configs"
  ON webhook_configs
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for webhook_logs
CREATE POLICY "Authenticated users can read webhook logs"
  ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert webhook logs"
  ON webhook_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_webhook_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_configs_updated_at();

-- ============================================================================
-- Populate with existing Revolut webhook (if not already configured)
-- ============================================================================

INSERT INTO webhook_configs (name, url, events, secret, active, description)
VALUES (
  'Revolut Orders Webhook',
  'https://verone.fr/api/webhook/revolut',
  ARRAY['ORDER_COMPLETED', 'ORDER_CANCELLED'],
  'REVOLUT_WEBHOOK_SECRET',
  true,
  'Webhook pour synchroniser les commandes Revolut avec LinkMe'
)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_configs TO authenticated;
GRANT SELECT, INSERT ON webhook_logs TO authenticated;

-- Comments
COMMENT ON TABLE webhook_configs IS 'Configuration des webhooks externes';
COMMENT ON TABLE webhook_logs IS 'Logs des événements webhook pour debugging';
COMMENT ON COLUMN webhook_configs.events IS 'Liste des événements écoutés par ce webhook';
COMMENT ON COLUMN webhook_configs.secret IS 'Secret partagé pour validation HMAC';
COMMENT ON COLUMN webhook_logs.status_code IS 'Code HTTP de la réponse (null si erreur réseau)';

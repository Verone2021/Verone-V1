-- =====================================================================
-- Migration 004: Table abby_webhook_events
-- Date: 2025-10-11
-- Description: Tracking événements webhooks Abby (idempotency)
-- =====================================================================

CREATE TABLE abby_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- IDENTIFIANT ÉVÉNEMENT ABBY
  -- ===================================================================

  -- ID unique événement Abby (pour idempotency check)
  event_id TEXT UNIQUE NOT NULL,

  -- Type événement (invoice.paid, invoice.sent, etc.)
  event_type TEXT NOT NULL,

  -- ===================================================================
  -- DONNÉES ÉVÉNEMENT
  -- ===================================================================

  -- Payload complet webhook (pour debug/audit)
  event_data JSONB NOT NULL,

  -- ===================================================================
  -- TIMESTAMPS
  -- ===================================================================

  -- Date traitement événement
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Date expiration (cleanup automatique après 7 jours)
  expires_at TIMESTAMPTZ NOT NULL
);

-- =====================================================================
-- 2. INDEX
-- =====================================================================

-- Index event_id (lookup idempotency)
CREATE INDEX idx_webhook_events_event_id ON abby_webhook_events(event_id);

-- Index expires_at (cleanup quotidien)
CREATE INDEX idx_webhook_events_expires_at ON abby_webhook_events(expires_at);

-- Index event_type (analytics)
CREATE INDEX idx_webhook_events_type ON abby_webhook_events(event_type);

-- =====================================================================
-- 3. FONCTION CALCUL EXPIRES_AT AUTOMATIQUE
-- =====================================================================

CREATE OR REPLACE FUNCTION set_webhook_event_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- TTL 7 jours par défaut
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger calcul expires_at
CREATE TRIGGER set_webhook_event_expiry_trigger
  BEFORE INSERT ON abby_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION set_webhook_event_expiry();

-- =====================================================================
-- 4. FONCTION NETTOYAGE ÉVÉNEMENTS EXPIRÉS (CRON QUOTIDIEN)
-- =====================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer événements expirés
  DELETE FROM abby_webhook_events
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Abby Webhook Events: % événements expirés supprimés', v_deleted_count;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE abby_webhook_events IS 'Tracking événements webhooks Abby pour idempotency (éviter double traitement)';
COMMENT ON COLUMN abby_webhook_events.event_id IS 'ID unique événement Abby (utilisé pour check idempotency)';
COMMENT ON COLUMN abby_webhook_events.expires_at IS 'Date expiration (cleanup automatique après 7 jours)';

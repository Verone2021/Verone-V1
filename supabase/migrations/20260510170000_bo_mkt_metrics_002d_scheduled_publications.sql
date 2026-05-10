-- =============================================
-- BO-MKT-METRICS-002d : Scheduled publications
--
-- Permettre la programmation de publications a l avance sur tous les
-- canaux. Le scheduler (Edge Function run-scheduled-publications) tourne
-- toutes les 5 minutes via pg_cron, picks les rows status='pending' dont
-- scheduled_at <= now(), et execute la publication via le canal cible.
-- =============================================

CREATE TABLE IF NOT EXISTS scheduled_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  channel_code TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'cancelled')),
  published_at TIMESTAMPTZ,
  external_url TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE scheduled_publications IS
  'Programmation des publications par canal. Picked par run-scheduled-publications toutes les 5min.';

CREATE INDEX IF NOT EXISTS idx_scheduled_publications_pending
  ON scheduled_publications (scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_publications_asset
  ON scheduled_publications (asset_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_publications_channel
  ON scheduled_publications (channel_code, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_publications_status
  ON scheduled_publications (status, scheduled_at DESC);

ALTER TABLE scheduled_publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_access_scheduled_publications" ON scheduled_publications;
CREATE POLICY "staff_full_access_scheduled_publications"
  ON scheduled_publications FOR ALL TO authenticated
  USING (is_backoffice_user());

CREATE OR REPLACE TRIGGER set_scheduled_publications_updated_at
  BEFORE UPDATE ON scheduled_publications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC : get_scheduled_publications_calendar(start_date, end_date)
-- Retourne les publications programmees joints aux media_assets pour
-- afficher le calendrier mensuel dans /marketing/calendrier.
-- ============================================================

CREATE OR REPLACE FUNCTION get_scheduled_publications_calendar(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  asset_id UUID,
  channel_code TEXT,
  scheduled_at TIMESTAMPTZ,
  caption TEXT,
  hashtags TEXT[],
  status TEXT,
  published_at TIMESTAMPTZ,
  external_url TEXT,
  error_message TEXT,
  retry_count INTEGER,
  asset_public_url TEXT,
  asset_filename TEXT,
  asset_alt_text TEXT,
  product_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.asset_id,
    sp.channel_code,
    sp.scheduled_at,
    sp.caption,
    sp.hashtags,
    sp.status,
    sp.published_at,
    sp.external_url,
    sp.error_message,
    sp.retry_count,
    ma.public_url::TEXT,
    ma.filename::TEXT,
    ma.alt_text::TEXT,
    ma.product_id
  FROM scheduled_publications sp
  JOIN media_assets ma ON ma.id = sp.asset_id
  WHERE sp.scheduled_at BETWEEN p_start_date AND p_end_date
  ORDER BY sp.scheduled_at ASC;
END;
$$;

-- =============================================
-- BO-MKT-METRICS-002 : Media asset analytics + top images
--
-- Objectif :
--   Stocker les performances individuelles de chaque image (asset_id)
--   par canal (Meta, Pinterest, etc.) et par jour, afin de reveler les
--   "top images" pour le retargeting et l'optimisation creative.
--
-- Source d alimentation (cote runtime) :
--   - Meta Insights API par media_id IG / page_post_id
--   - Pinterest Pin Analytics par pin_id (Sprint 10)
--   - Lien vers media_assets via media_asset_publications.external_url
--     ou via le creative_id stocke a la publication.
--
-- Cette migration ne fait QUE poser le schema + RPC. L alimentation
-- est faite par Edge Functions dediees (sync-meta-image-insights, etc.)
-- ajoutees en parallele du sprint.
-- =============================================

CREATE TABLE IF NOT EXISTS media_asset_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  channel_code TEXT NOT NULL,
  period_date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_id, channel_code, period_date)
);

COMMENT ON TABLE media_asset_analytics IS
  'Snapshot quotidien des metriques par image x canal. Alimente par Edge Functions sync-meta-image-insights (et plus tard Pinterest).';

CREATE INDEX IF NOT EXISTS idx_media_asset_analytics_asset_channel_date
  ON media_asset_analytics (asset_id, channel_code, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_asset_analytics_channel_date
  ON media_asset_analytics (channel_code, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_asset_analytics_period
  ON media_asset_analytics (period_date DESC);

-- RLS staff
ALTER TABLE media_asset_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_access_media_asset_analytics" ON media_asset_analytics;
CREATE POLICY "staff_full_access_media_asset_analytics"
  ON media_asset_analytics FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Trigger updated_at
CREATE OR REPLACE TRIGGER set_media_asset_analytics_updated_at
  BEFORE UPDATE ON media_asset_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC : get_top_images(channel_code, start_date, end_date, limit)
-- ============================================================
-- Retourne le top N des images (media_assets) par canal sur une periode,
-- classees par impressions DESC. Joint vers media_assets pour avoir
-- l URL publique + product_id (si attribue).

CREATE OR REPLACE FUNCTION get_top_images(
  p_channel_code TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  asset_id UUID,
  product_id UUID,
  public_url TEXT,
  filename TEXT,
  alt_text TEXT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_saves BIGINT,
  total_conversions BIGINT,
  ctr NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ma.id AS asset_id,
    ma.product_id,
    ma.public_url::TEXT,
    ma.filename::TEXT,
    ma.alt_text::TEXT,
    SUM(maa.impressions)::BIGINT AS total_impressions,
    SUM(maa.clicks)::BIGINT AS total_clicks,
    SUM(maa.saves)::BIGINT AS total_saves,
    SUM(maa.conversions)::BIGINT AS total_conversions,
    CASE
      WHEN SUM(maa.impressions) > 0
      THEN ROUND((SUM(maa.clicks)::NUMERIC / SUM(maa.impressions)::NUMERIC) * 100, 2)
      ELSE 0
    END AS ctr
  FROM media_asset_analytics maa
  JOIN media_assets ma ON ma.id = maa.asset_id
  WHERE maa.channel_code = p_channel_code
    AND maa.period_date BETWEEN p_start_date AND p_end_date
    AND ma.archived_at IS NULL
  GROUP BY ma.id, ma.product_id, ma.public_url, ma.filename, ma.alt_text
  ORDER BY total_impressions DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_top_images IS
  'Top N images d un canal sur une periode, classees par impressions DESC. Source : media_asset_analytics + media_assets.';

-- ============================================================
-- RPC : get_media_asset_analytics_summary(asset_id, period_days)
-- ============================================================
-- Retourne le total des metriques d une image sur les N derniers jours,
-- tous canaux confondus.

CREATE OR REPLACE FUNCTION get_media_asset_analytics_summary(
  p_asset_id UUID,
  p_period_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_saves BIGINT,
  total_conversions BIGINT,
  channels_count BIGINT,
  last_activity DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
BEGIN
  v_start_date := CURRENT_DATE - p_period_days;

  RETURN QUERY
  SELECT
    COALESCE(SUM(maa.impressions), 0)::BIGINT,
    COALESCE(SUM(maa.clicks), 0)::BIGINT,
    COALESCE(SUM(maa.saves), 0)::BIGINT,
    COALESCE(SUM(maa.conversions), 0)::BIGINT,
    COUNT(DISTINCT maa.channel_code)::BIGINT,
    MAX(maa.period_date)
  FROM media_asset_analytics maa
  WHERE maa.asset_id = p_asset_id
    AND maa.period_date >= v_start_date;
END;
$$;

COMMENT ON FUNCTION get_media_asset_analytics_summary IS
  'Totaux des metriques d une image sur les N derniers jours, tous canaux confondus.';

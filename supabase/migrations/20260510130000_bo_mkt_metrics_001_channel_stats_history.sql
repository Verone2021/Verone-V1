-- =============================================
-- BO-MKT-METRICS-001: Historique stats canal (snapshot quotidien)
--
-- Objectif:
--   Conserver l historique journalier des metriques par produit et par canal
--   pour permettre les filtres "7j / 30j / 90j" sur le dashboard marketing.
--
-- Avant cette migration: chaque sync ecrase les valeurs precedentes
-- (meta_commerce_syncs.impressions / clicks / conversions / revenue_ht).
-- Donc impossible d afficher une tendance.
--
-- Architecture:
--   - 1 table generique channel_stats_snapshots (date x canal x produit)
--   - 1 fonction snapshot_channel_stats() qui copie l etat actuel
--   - 1 job pg_cron quotidien a 03:00 UTC
--   - 2 RPCs pour requeter (history par produit, aggregated par canal)
--   - Backfill: 1 snapshot pris au moment de l execution (J0)
--
-- Aucune table existante n est modifiee. Lecture seule sur
-- meta_commerce_syncs et google_merchant_syncs.
-- =============================================

-- 1. Activer pg_cron si pas deja active
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Table snapshot generique (extensible aux futurs canaux : pinterest, tiktok, etc.)
CREATE TABLE IF NOT EXISTS channel_stats_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  channel_code TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue_ht NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date, channel_code, product_id)
);

COMMENT ON TABLE channel_stats_snapshots IS
  'Snapshot quotidien des metriques par produit x canal. Alimente par pg_cron tous les jours a 03:00 UTC. Permet filtres temporels 7j/30j/90j.';

CREATE INDEX IF NOT EXISTS idx_channel_stats_snapshots_date
  ON channel_stats_snapshots (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_channel_stats_snapshots_channel_date
  ON channel_stats_snapshots (channel_code, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_channel_stats_snapshots_product_date
  ON channel_stats_snapshots (product_id, snapshot_date DESC);

-- 3. RLS staff-only (pattern back-office standard Verone)
ALTER TABLE channel_stats_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_access_channel_stats_snapshots" ON channel_stats_snapshots;
CREATE POLICY "staff_full_access_channel_stats_snapshots"
  ON channel_stats_snapshots FOR ALL TO authenticated
  USING (is_backoffice_user());

-- 4. Fonction snapshot (idempotente par jour grace a ON CONFLICT)
CREATE OR REPLACE FUNCTION snapshot_channel_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Snapshot Meta Commerce
  INSERT INTO channel_stats_snapshots (
    snapshot_date, channel_code, product_id,
    impressions, clicks, conversions, revenue_ht
  )
  SELECT
    CURRENT_DATE,
    'meta_commerce',
    product_id,
    COALESCE(impressions, 0),
    COALESCE(clicks, 0),
    COALESCE(conversions, 0),
    COALESCE(revenue_ht, 0)
  FROM meta_commerce_syncs
  WHERE sync_status != 'deleted'
  ON CONFLICT (snapshot_date, channel_code, product_id) DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    conversions = EXCLUDED.conversions,
    revenue_ht = EXCLUDED.revenue_ht;

  -- Snapshot Google Merchant
  INSERT INTO channel_stats_snapshots (
    snapshot_date, channel_code, product_id,
    impressions, clicks, conversions, revenue_ht
  )
  SELECT
    CURRENT_DATE,
    'google_merchant',
    product_id,
    COALESCE(impressions, 0),
    COALESCE(clicks, 0),
    COALESCE(conversions, 0),
    COALESCE(revenue_ht, 0)
  FROM google_merchant_syncs
  ON CONFLICT (snapshot_date, channel_code, product_id) DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    conversions = EXCLUDED.conversions,
    revenue_ht = EXCLUDED.revenue_ht;
END;
$$;

COMMENT ON FUNCTION snapshot_channel_stats IS
  'Copie l etat actuel des syncs Meta + Google vers channel_stats_snapshots avec snapshot_date = CURRENT_DATE. Idempotent par jour (ON CONFLICT UPDATE).';

-- 5. Job pg_cron quotidien a 03:00 UTC (= 04:00 ou 05:00 Paris selon DST)
-- Idempotent: si le job existe deja, on remplace son schedule
DO $$
BEGIN
  PERFORM cron.unschedule('channel-stats-daily-snapshot')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'channel-stats-daily-snapshot'
  );
EXCEPTION WHEN OTHERS THEN
  -- ignore si table cron.job pas encore visible ou job inexistant
  NULL;
END $$;

SELECT cron.schedule(
  'channel-stats-daily-snapshot',
  '0 3 * * *',
  $cron$SELECT snapshot_channel_stats();$cron$
);

-- 6. RPC: get_channel_stats_history (par produit ou tous)
CREATE OR REPLACE FUNCTION get_channel_stats_history(
  p_channel_code TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_product_id UUID DEFAULT NULL
)
RETURNS TABLE (
  snapshot_date DATE,
  product_id UUID,
  product_name TEXT,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_ht NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    css.snapshot_date,
    css.product_id,
    p.name::TEXT,
    css.impressions,
    css.clicks,
    css.conversions,
    css.revenue_ht
  FROM channel_stats_snapshots css
  JOIN products p ON p.id = css.product_id
  WHERE css.channel_code = p_channel_code
    AND css.snapshot_date BETWEEN p_start_date AND p_end_date
    AND (p_product_id IS NULL OR css.product_id = p_product_id)
  ORDER BY css.snapshot_date DESC, p.name ASC;
END;
$$;

-- 7. RPC: get_channel_stats_aggregated (totaux par jour pour 1 canal)
CREATE OR REPLACE FUNCTION get_channel_stats_aggregated(
  p_channel_code TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  snapshot_date DATE,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue_ht NUMERIC,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    css.snapshot_date,
    SUM(css.impressions)::BIGINT,
    SUM(css.clicks)::BIGINT,
    SUM(css.conversions)::BIGINT,
    SUM(css.revenue_ht)::NUMERIC,
    CASE
      WHEN SUM(css.clicks) > 0
      THEN ROUND((SUM(css.conversions)::NUMERIC / SUM(css.clicks)::NUMERIC) * 100, 2)
      ELSE 0
    END
  FROM channel_stats_snapshots css
  WHERE css.channel_code = p_channel_code
    AND css.snapshot_date BETWEEN p_start_date AND p_end_date
  GROUP BY css.snapshot_date
  ORDER BY css.snapshot_date DESC;
END;
$$;

-- 8. Backfill initial: 1 snapshot maintenant pour avoir au moins 1 jour de donnees
SELECT snapshot_channel_stats();

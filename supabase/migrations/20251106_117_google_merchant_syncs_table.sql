-- Migration: Table google_merchant_syncs pour tracking statuts réels Google Merchant
-- Date: 2025-11-06
-- Description: Stocke les synchronisations et statuts RÉELS des produits Google Merchant
-- Référence: docs/business-rules/13-canaux-vente/google-merchant/README.md

-- =====================================================
-- PARTIE 1: Création table google_merchant_syncs
-- =====================================================

CREATE TABLE IF NOT EXISTS google_merchant_syncs (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Références
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Identifiants Google
  google_product_id TEXT NOT NULL, -- Format: online:fr:FR:SKU
  merchant_id TEXT NOT NULL, -- Account ID Google Merchant

  -- Statuts synchronisation
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'pending', 'error', 'skipped')),
  sync_operation TEXT NOT NULL CHECK (sync_operation IN ('insert', 'update', 'delete')),

  -- Statut Google RÉEL (polled depuis API)
  google_status TEXT CHECK (google_status IN ('approved', 'pending', 'rejected', 'not_synced')),
  google_status_detail JSONB, -- Détails erreurs Google (ex: missing_gtin, invalid_image)

  -- Métriques Performance (à remplir via Google Ads API - Phase 2)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_ht DECIMAL(10, 2) DEFAULT 0,

  -- Timestamps
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  google_status_checked_at TIMESTAMPTZ, -- Dernier polling statut Google

  -- Métadonnées
  error_message TEXT, -- Message erreur si sync_status = 'error'
  response_data JSONB, -- Réponse complète API Google (debug)

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PARTIE 2: Indexes pour performance
-- =====================================================

-- Index principal: Lookup par product_id
CREATE INDEX IF NOT EXISTS idx_google_merchant_syncs_product_id
ON google_merchant_syncs(product_id);

-- Index: Lookup par google_product_id (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_merchant_syncs_google_product_id
ON google_merchant_syncs(google_product_id);

-- Index: Filtrage par sync_status
CREATE INDEX IF NOT EXISTS idx_google_merchant_syncs_sync_status
ON google_merchant_syncs(sync_status);

-- Index: Filtrage par google_status (pour dashboard)
CREATE INDEX IF NOT EXISTS idx_google_merchant_syncs_google_status
ON google_merchant_syncs(google_status)
WHERE google_status IS NOT NULL;

-- Index: Tri par date (synced_at DESC pour affichage)
CREATE INDEX IF NOT EXISTS idx_google_merchant_syncs_synced_at
ON google_merchant_syncs(synced_at DESC);

-- =====================================================
-- PARTIE 3: Trigger updated_at automatique
-- =====================================================

CREATE OR REPLACE FUNCTION update_google_merchant_syncs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_google_merchant_syncs_updated_at ON google_merchant_syncs;
CREATE TRIGGER trigger_google_merchant_syncs_updated_at
  BEFORE UPDATE ON google_merchant_syncs
  FOR EACH ROW
  EXECUTE FUNCTION update_google_merchant_syncs_updated_at();

-- =====================================================
-- PARTIE 4: RLS Policies (Row Level Security)
-- =====================================================

ALTER TABLE google_merchant_syncs ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Tous users authentifiés peuvent voir
CREATE POLICY google_merchant_syncs_select_policy
ON google_merchant_syncs
FOR SELECT
TO authenticated
USING (true);

-- Policy INSERT: Seulement service_role (API backend)
CREATE POLICY google_merchant_syncs_insert_policy
ON google_merchant_syncs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy UPDATE: Seulement service_role (polling statuts)
CREATE POLICY google_merchant_syncs_update_policy
ON google_merchant_syncs
FOR UPDATE
TO service_role
USING (true);

-- Policy DELETE: Seulement service_role
CREATE POLICY google_merchant_syncs_delete_policy
ON google_merchant_syncs
FOR DELETE
TO service_role
USING (true);

-- =====================================================
-- PARTIE 5: Commentaires documentation
-- =====================================================

COMMENT ON TABLE google_merchant_syncs IS 'Tracking synchronisations et statuts RÉELS Google Merchant Center. Aucune donnée mock autorisée.';
COMMENT ON COLUMN google_merchant_syncs.product_id IS 'Référence produit Vérone (UUID)';
COMMENT ON COLUMN google_merchant_syncs.google_product_id IS 'Identifiant Google format online:fr:FR:SKU (unique)';
COMMENT ON COLUMN google_merchant_syncs.sync_status IS 'Statut synchronisation API (success, pending, error, skipped)';
COMMENT ON COLUMN google_merchant_syncs.google_status IS 'Statut RÉEL polled depuis Google (approved, pending, rejected, not_synced)';
COMMENT ON COLUMN google_merchant_syncs.google_status_detail IS 'Détails erreurs Google au format JSON (ex: {issues: [{code: "missing_gtin"}]})';
COMMENT ON COLUMN google_merchant_syncs.impressions IS 'Impressions Google Shopping (à remplir via Google Ads API - Phase 2)';
COMMENT ON COLUMN google_merchant_syncs.clicks IS 'Clics Google Shopping (à remplir via Google Ads API - Phase 2)';
COMMENT ON COLUMN google_merchant_syncs.conversions IS 'Conversions Google Shopping (à remplir via Google Ads API - Phase 2)';
COMMENT ON COLUMN google_merchant_syncs.google_status_checked_at IS 'Timestamp dernier polling statut Google (pour éviter rate-limiting)';

-- =====================================================
-- PARTIE 6: Vue materialized pour dashboard (Performance)
-- =====================================================

-- Vue agrégée pour statistiques dashboard (évite full table scan)
CREATE MATERIALIZED VIEW IF NOT EXISTS google_merchant_stats AS
SELECT
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE google_status = 'approved') AS approved_products,
  COUNT(*) FILTER (WHERE google_status = 'pending') AS pending_products,
  COUNT(*) FILTER (WHERE google_status = 'rejected') AS rejected_products,
  COUNT(*) FILTER (WHERE sync_status = 'error') AS error_products,
  COALESCE(SUM(impressions), 0) AS total_impressions,
  COALESCE(SUM(clicks), 0) AS total_clicks,
  COALESCE(SUM(conversions), 0) AS total_conversions,
  COALESCE(SUM(revenue_ht), 0) AS total_revenue_ht,
  -- Taux de conversion (clicks > 0 pour éviter division par zéro)
  CASE
    WHEN SUM(clicks) > 0 THEN ROUND((SUM(conversions)::DECIMAL / SUM(clicks)::DECIMAL) * 100, 2)
    ELSE 0
  END AS conversion_rate,
  MAX(synced_at) AS last_sync_at,
  NOW() AS refreshed_at
FROM google_merchant_syncs;

-- Index sur la vue materialized
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_merchant_stats_single_row
ON google_merchant_stats((1)); -- Vue single-row, index fictif pour REFRESH CONCURRENTLY

-- Fonction pour refresh automatique de la vue (à appeler après chaque sync)
CREATE OR REPLACE FUNCTION refresh_google_merchant_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY google_merchant_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 7: Fonction RPC pour fetch stats dashboard
-- =====================================================

-- RPC: Récupérer statistiques dashboard (utilisé par frontend)
CREATE OR REPLACE FUNCTION get_google_merchant_stats()
RETURNS TABLE (
  total_products BIGINT,
  approved_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT,
  error_products BIGINT,
  total_impressions NUMERIC,
  total_clicks NUMERIC,
  total_conversions NUMERIC,
  total_revenue_ht NUMERIC,
  conversion_rate NUMERIC,
  last_sync_at TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.total_products,
    s.approved_products,
    s.pending_products,
    s.rejected_products,
    s.error_products,
    s.total_impressions,
    s.total_clicks,
    s.total_conversions,
    s.total_revenue_ht,
    s.conversion_rate,
    s.last_sync_at,
    s.refreshed_at
  FROM google_merchant_stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 8: Fonction RPC pour fetch produits synchronisés
-- =====================================================

-- RPC: Récupérer produits synchronisés avec détails (pour tableau dashboard)
CREATE OR REPLACE FUNCTION get_google_merchant_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  sku TEXT,
  product_name TEXT,
  google_product_id TEXT,
  sync_status TEXT,
  google_status TEXT,
  google_status_detail JSONB,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_ht DECIMAL,
  synced_at TIMESTAMPTZ,
  google_status_checked_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gms.id,
    gms.product_id,
    p.sku,
    p.name AS product_name,
    gms.google_product_id,
    gms.sync_status,
    gms.google_status,
    gms.google_status_detail,
    gms.impressions,
    gms.clicks,
    gms.conversions,
    gms.revenue_ht,
    gms.synced_at,
    gms.google_status_checked_at,
    gms.error_message
  FROM google_merchant_syncs gms
  JOIN products p ON gms.product_id = p.id
  ORDER BY gms.synced_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 9: Vérifications finales
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 117 terminée: google_merchant_syncs';
  RAISE NOTICE '  - Table créée avec 18 colonnes';
  RAISE NOTICE '  - 5 indexes performance créés';
  RAISE NOTICE '  - RLS policies configurées (service_role only write)';
  RAISE NOTICE '  - Vue materialized google_merchant_stats créée';
  RAISE NOTICE '  - 2 RPCs créés: get_google_merchant_stats(), get_google_merchant_products()';
  RAISE NOTICE '  - RÈGLE: Aucune donnée mock autorisée - Uniquement données RÉELLES polled depuis Google API';
END $$;

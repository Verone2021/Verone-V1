-- Migration: Feeds Export System
-- Phase 4: Creates tables for Meta/Google feeds management
-- Based on ERD-CATALOGUE-V1.md and integrations-externes.md
-- Depends on: 001_create_base_types, 002_create_auth_tables, 003_create_rls_policies

-- ========================================
-- FEED CONFIGURATIONS
-- ========================================

-- Feed platform types
DO $$ BEGIN
  CREATE TYPE feed_platform_type AS ENUM ('google_merchant', 'facebook_meta', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Feed format types
DO $$ BEGIN
  CREATE TYPE feed_format_type AS ENUM ('csv', 'xml', 'json');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Schedule frequency types
DO $$ BEGIN
  CREATE TYPE schedule_frequency_type AS ENUM ('manual', 'daily', 'weekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Feed export status types
DO $$ BEGIN
  CREATE TYPE feed_export_status_type AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Feed configurations table
CREATE TABLE IF NOT EXISTS feed_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Configuration
  name VARCHAR(255) NOT NULL,
  platform feed_platform_type NOT NULL,
  language language_type NOT NULL,

  -- Format & Scheduling
  format feed_format_type DEFAULT 'csv',
  schedule_frequency schedule_frequency_type DEFAULT 'manual',
  schedule_day INTEGER, -- Day of week (0=Sunday)
  schedule_hour INTEGER DEFAULT 6, -- Hour UTC

  -- Filters (JSONB for flexibility)
  filters JSONB DEFAULT '{}', -- {category_ids: [...], status: [...], price_range: [...]}

  -- Security & Access
  access_token VARCHAR(255) NOT NULL, -- Secure API token
  webhook_url TEXT, -- Notification URL

  -- State
  is_active BOOLEAN DEFAULT TRUE,
  last_export_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT feed_schedule_day_check CHECK (schedule_day IS NULL OR (schedule_day >= 0 AND schedule_day <= 6)),
  CONSTRAINT feed_schedule_hour_check CHECK (schedule_hour >= 0 AND schedule_hour <= 23),
  CONSTRAINT feed_token_length CHECK (length(access_token) >= 32)
);

-- ========================================
-- FEED EXPORTS HISTORY
-- ========================================

CREATE TABLE IF NOT EXISTS feed_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_config_id UUID NOT NULL REFERENCES feed_configs(id) ON DELETE CASCADE,

  -- Export state
  status feed_export_status_type DEFAULT 'pending',

  -- Results
  file_url TEXT,
  file_size BIGINT,
  products_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Errors & Logs
  error_message TEXT,
  logs JSONB DEFAULT '[]', -- Array of log entries

  -- Request info
  requested_by UUID REFERENCES auth.users(id),
  user_agent TEXT,
  ip_address INET,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT export_duration_positive CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CONSTRAINT export_products_count_positive CHECK (products_count >= 0),
  CONSTRAINT export_file_size_positive CHECK (file_size IS NULL OR file_size > 0)
);

-- ========================================
-- FEED PERFORMANCE METRICS
-- ========================================

CREATE TABLE IF NOT EXISTS feed_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_config_id UUID NOT NULL REFERENCES feed_configs(id) ON DELETE CASCADE,

  -- Metrics date (daily aggregation)
  metrics_date DATE NOT NULL,

  -- Performance data
  total_exports INTEGER DEFAULT 0,
  successful_exports INTEGER DEFAULT 0,
  failed_exports INTEGER DEFAULT 0,
  avg_duration_seconds DECIMAL(8,2),
  max_duration_seconds INTEGER,
  avg_products_count INTEGER,
  total_file_size_bytes BIGINT DEFAULT 0,

  -- Error tracking
  error_types JSONB DEFAULT '{}', -- {timeout: 2, validation: 1, network: 0}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one record per feed per day
  UNIQUE(feed_config_id, metrics_date)
);

-- ========================================
-- TRIGGERS (Auto-update timestamps)
-- ========================================

CREATE TRIGGER trigger_update_feed_configs_updated_at
  BEFORE UPDATE ON feed_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_feed_metrics_updated_at
  BEFORE UPDATE ON feed_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Feed configs indexes
CREATE INDEX IF NOT EXISTS idx_feed_configs_platform ON feed_configs(platform);
CREATE INDEX IF NOT EXISTS idx_feed_configs_active ON feed_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_feed_configs_schedule ON feed_configs(schedule_frequency, schedule_day, schedule_hour)
WHERE is_active = TRUE AND schedule_frequency != 'manual';
CREATE INDEX IF NOT EXISTS idx_feed_configs_creator ON feed_configs(created_by);

-- Feed exports indexes
CREATE INDEX IF NOT EXISTS idx_feed_exports_config ON feed_exports(feed_config_id);
CREATE INDEX IF NOT EXISTS idx_feed_exports_status ON feed_exports(status);
CREATE INDEX IF NOT EXISTS idx_feed_exports_started ON feed_exports(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_exports_completed ON feed_exports(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Composite index for active exports monitoring
CREATE INDEX IF NOT EXISTS idx_feed_exports_active ON feed_exports(feed_config_id, status, started_at)
WHERE status IN ('pending', 'processing');

-- Feed metrics indexes
CREATE INDEX IF NOT EXISTS idx_feed_metrics_config_date ON feed_performance_metrics(feed_config_id, metrics_date DESC);
CREATE INDEX IF NOT EXISTS idx_feed_metrics_date ON feed_performance_metrics(metrics_date DESC);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE feed_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Feed configs: restricted to catalogue roles
CREATE POLICY "feed_configs_access" ON feed_configs
  FOR ALL USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- Feed exports: read access for catalogue roles
CREATE POLICY "feed_exports_access" ON feed_exports
  FOR SELECT USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- Insert/Update exports: only system can write (service_role)
CREATE POLICY "feed_exports_system_write" ON feed_exports
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "feed_exports_system_update" ON feed_exports
  FOR UPDATE TO service_role
  USING (true);

-- Feed metrics: read for catalogue roles
CREATE POLICY "feed_metrics_access" ON feed_performance_metrics
  FOR SELECT USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- Metrics write: only system
CREATE POLICY "feed_metrics_system_write" ON feed_performance_metrics
  FOR ALL TO service_role
  USING (true);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Generate secure access token
CREATE OR REPLACE FUNCTION generate_feed_access_token()
RETURNS TEXT AS $$
  SELECT encode(gen_random_bytes(32), 'hex')
$$ LANGUAGE SQL;

-- Validate feed filters JSON structure
CREATE OR REPLACE FUNCTION validate_feed_filters(filters_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic validation: must be object, not array or primitive
  IF jsonb_typeof(filters_json) != 'object' THEN
    RETURN FALSE;
  END IF;

  -- Validate specific filter keys if they exist
  IF filters_json ? 'category_ids' AND jsonb_typeof(filters_json->'category_ids') != 'array' THEN
    RETURN FALSE;
  END IF;

  IF filters_json ? 'status' AND jsonb_typeof(filters_json->'status') != 'array' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get products for feed export
CREATE OR REPLACE FUNCTION get_products_for_feed(config_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_group_id UUID,
  sku VARCHAR(100),
  name VARCHAR(255),
  price_ht INTEGER,
  status availability_status_type,
  primary_image_url TEXT,
  category_name VARCHAR(255),
  brand VARCHAR(100)
) AS $$
DECLARE
  config_filters JSONB;
BEGIN
  -- Get filters from config
  SELECT filters INTO config_filters
  FROM feed_configs
  WHERE id = config_id;

  -- Return filtered products
  RETURN QUERY
  SELECT
    p.id,
    p.product_group_id,
    p.sku,
    p.name,
    p.price_ht,
    p.status,
    p.primary_image_url,
    c.name as category_name,
    pg.brand
  FROM products p
  JOIN product_groups pg ON p.product_group_id = pg.id
  JOIN categories c ON pg.category_id = c.id
  WHERE
    -- Basic filters
    p.status IN ('in_stock', 'preorder', 'coming_soon')
    AND pg.status = 'active'
    AND c.is_active = TRUE
    AND length(p.primary_image_url) > 0
    -- Apply JSON filters if they exist
    AND (
      config_filters IS NULL
      OR NOT (config_filters ? 'category_ids')
      OR c.id::TEXT = ANY(
        SELECT jsonb_array_elements_text(config_filters->'category_ids')
      )
    )
    AND (
      config_filters IS NULL
      OR NOT (config_filters ? 'status')
      OR p.status::TEXT = ANY(
        SELECT jsonb_array_elements_text(config_filters->'status')
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- COMMENTS (Documentation)
-- ========================================

COMMENT ON TABLE feed_configs IS 'Feed export configurations for Meta/Google/custom platforms';
COMMENT ON TABLE feed_exports IS 'History and status tracking for feed export operations';
COMMENT ON TABLE feed_performance_metrics IS 'Daily aggregated performance metrics for feed exports';

COMMENT ON FUNCTION generate_feed_access_token() IS 'Generate secure 64-char hex token for feed access';
COMMENT ON FUNCTION validate_feed_filters(JSONB) IS 'Validate feed filter JSON structure';
COMMENT ON FUNCTION get_products_for_feed(UUID) IS 'Get filtered products for specific feed configuration';
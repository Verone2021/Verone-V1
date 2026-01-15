-- =====================================================
-- Migration: Create get_stock_alerts_count RPC
-- Date: 2026-01-13
-- Description: RPC pour compter les alertes stock actives
-- Bug fix: KPI "Alertes stock" affichait 0
-- =====================================================

-- Drop if exists
DROP FUNCTION IF EXISTS get_stock_alerts_count();

-- Create function
CREATE OR REPLACE FUNCTION get_stock_alerts_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM stock_alerts_unified_view
  WHERE alert_type != 'none';
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_stock_alerts_count() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_stock_alerts_count() IS 'Retourne le nombre total d''alertes stock actives (rupture, critique, faible)';

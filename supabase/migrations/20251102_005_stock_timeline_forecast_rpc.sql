-- Migration: Fonction RPC Timeline Prévisionnel
-- Date: 2025-11-02
-- Objectif: Calculer évolution stock prévisionnel sur N jours (Dashboard widget)
-- Impact: Widget Timeline prévisionnel performant (<200ms pour 30 jours)

-- ============================================================================
-- 1. FONCTION : get_stock_timeline_forecast
-- ============================================================================

DROP FUNCTION IF EXISTS get_stock_timeline_forecast(UUID, INT);

CREATE OR REPLACE FUNCTION get_stock_timeline_forecast(
  p_product_id UUID,
  p_days_ahead INT DEFAULT 30
)
RETURNS TABLE(
  forecast_date DATE,
  stock_real_change INT,
  stock_forecasted_in INT,
  stock_forecasted_out INT,
  stock_net_change INT,
  cumulative_stock INT
) AS $$
DECLARE
  current_stock INT;
BEGIN
  -- Récupérer le stock réel actuel du produit
  SELECT COALESCE(stock_quantity, 0) INTO current_stock
  FROM products
  WHERE id = p_product_id;

  RETURN QUERY
  WITH timeline AS (
    -- Générer série de dates (aujourd'hui → +N jours)
    SELECT generate_series(
      CURRENT_DATE,
      CURRENT_DATE + p_days_ahead,
      '1 day'::interval
    )::DATE as date
  ),
  movements_by_date AS (
    -- Agréger mouvements par date
    SELECT
      DATE(performed_at) as movement_date,
      SUM(CASE
        WHEN affects_forecast = false
        THEN quantity_change
        ELSE 0
      END) as real_change,
      SUM(CASE
        WHEN affects_forecast = true AND forecast_type = 'in'
        THEN quantity_change
        ELSE 0
      END) as forecast_in,
      SUM(CASE
        WHEN affects_forecast = true AND forecast_type = 'out'
        THEN quantity_change
        ELSE 0
      END) as forecast_out
    FROM stock_movements
    WHERE product_id = p_product_id
      AND archived_at IS NULL
      AND DATE(performed_at) BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days_ahead)
    GROUP BY DATE(performed_at)
  ),
  timeline_with_changes AS (
    -- Joindre timeline avec mouvements
    SELECT
      t.date as forecast_date,
      COALESCE(m.real_change, 0)::INT as stock_real_change,
      COALESCE(m.forecast_in, 0)::INT as stock_forecasted_in,
      COALESCE(ABS(m.forecast_out), 0)::INT as stock_forecasted_out,
      COALESCE(m.real_change + m.forecast_in + m.forecast_out, 0)::INT as stock_net_change
    FROM timeline t
    LEFT JOIN movements_by_date m ON t.date = m.movement_date
  )
  -- Calculer stock cumulé jour après jour
  SELECT
    tw.forecast_date,
    tw.stock_real_change,
    tw.stock_forecasted_in,
    tw.stock_forecasted_out,
    tw.stock_net_change,
    (current_stock + SUM(tw.stock_net_change) OVER (ORDER BY tw.forecast_date))::INT as cumulative_stock
  FROM timeline_with_changes tw
  ORDER BY tw.forecast_date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_stock_timeline_forecast IS
  'Calcule évolution stock prévisionnel sur N jours (par défaut 30). Retourne timeline avec stock réel, prévisionnel in/out, et cumulé.';

-- ============================================================================
-- 2. PERMISSIONS : Grant EXECUTE à authenticated users
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_stock_timeline_forecast(UUID, INT) TO authenticated;

-- ============================================================================
-- 3. FONCTION COMPLÉMENTAIRE : get_product_stock_summary (pour Dashboard)
-- ============================================================================

DROP FUNCTION IF EXISTS get_product_stock_summary(UUID);

CREATE OR REPLACE FUNCTION get_product_stock_summary(p_product_id UUID)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  stock_real INT,
  stock_forecasted_in INT,
  stock_forecasted_out INT,
  stock_available INT,
  stock_minimum INT,
  is_below_minimum BOOLEAN,
  last_movement_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    p.sku as product_sku,
    COALESCE(ss.stock_real, 0)::INT as stock_real,
    COALESCE(ss.stock_forecasted_in, 0)::INT as stock_forecasted_in,
    COALESCE(ABS(ss.stock_forecasted_out), 0)::INT as stock_forecasted_out,
    (COALESCE(p.stock_quantity, 0) - COALESCE(p.stock_reserved, 0))::INT as stock_available,
    COALESCE(p.stock_minimum, 0)::INT as stock_minimum,
    (COALESCE(p.stock_quantity, 0) <= COALESCE(p.stock_minimum, 0)) as is_below_minimum,
    ss.last_movement_at
  FROM products p
  LEFT JOIN stock_snapshot ss ON p.id = ss.product_id
  WHERE p.id = p_product_id
    AND p.archived_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_product_stock_summary IS
  'Retourne résumé complet stock d''un produit (réel, prévisionnel, disponible, alertes). Utilisé par Dashboard widgets.';

GRANT EXECUTE ON FUNCTION get_product_stock_summary(UUID) TO authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  func_count INT;
BEGIN
  -- Vérifier que les 2 fonctions sont créées
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('get_stock_timeline_forecast', 'get_product_stock_summary');

  IF func_count < 2 THEN
    RAISE EXCEPTION 'Fonctions RPC manquantes (attendu: 2, trouvé: %)', func_count;
  END IF;

  RAISE NOTICE '✅ Migration Fonctions RPC: 2 fonctions créées avec succès';
  RAISE NOTICE '   - get_stock_timeline_forecast(product_id, days_ahead)';
  RAISE NOTICE '   - get_product_stock_summary(product_id)';
  RAISE NOTICE '   - Permissions EXECUTE granted à authenticated';
END $$;

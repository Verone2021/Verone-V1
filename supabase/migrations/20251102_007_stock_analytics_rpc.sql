-- Migration: Fonction RPC Stock Analytics
-- Date: 2025-11-02
-- Objectif: Calculer métriques analytics stock (Rotation, Couverture, ADU, Inactivité)
-- Impact: Page /stocks/analytics performante (<500ms pour 100+ produits)

-- ============================================================================
-- 1. FONCTION : get_stock_analytics
-- ============================================================================

DROP FUNCTION IF EXISTS get_stock_analytics(INTEGER, UUID);

CREATE OR REPLACE FUNCTION get_stock_analytics(
  p_period_days INTEGER DEFAULT 90,
  p_organisation_id UUID DEFAULT NULL
)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  stock_current INTEGER,
  stock_minimum INTEGER,
  cost_price NUMERIC(10,2),
  out_30d INTEGER,
  out_90d INTEGER,
  out_365d INTEGER,
  in_30d INTEGER,
  in_90d INTEGER,
  in_365d INTEGER,
  adu NUMERIC(10,2),
  turnover_rate NUMERIC(10,2),
  coverage_days NUMERIC(10,2),
  days_inactive INTEGER,
  movement_history JSONB,
  last_exit_date TIMESTAMPTZ,
  last_entry_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH product_base AS (
    -- Base des produits actifs avec stock
    SELECT
      p.id,
      p.name,
      p.sku,
      COALESCE(p.stock_quantity, 0) as stock_qty,
      COALESCE(p.min_stock, 0) as stock_min,
      COALESCE(
        (SELECT pli.cost_price
         FROM price_list_items pli
         WHERE pli.product_id = p.id
           AND pli.is_active = true
         ORDER BY pli.created_at DESC
         LIMIT 1),
        0
      ) as cost_px
    FROM products p
    WHERE p.archived_at IS NULL
  ),
  movements_real AS (
    -- Mouvements réels uniquement (affects_forecast = false)
    SELECT
      sm.product_id,
      sm.quantity_change,
      sm.movement_type,
      sm.performed_at
    FROM stock_movements sm
    WHERE (sm.affects_forecast = false OR sm.affects_forecast IS NULL)
  ),
  movements_aggregated AS (
    -- Agrégations par période
    SELECT
      pb.id as product_id,
      -- Sorties par période (quantity_change négatif)
      SUM(CASE
        WHEN mr.quantity_change < 0 AND mr.performed_at >= NOW() - INTERVAL '30 days'
        THEN ABS(mr.quantity_change)
        ELSE 0
      END)::INTEGER as exits_30d,
      SUM(CASE
        WHEN mr.quantity_change < 0 AND mr.performed_at >= NOW() - INTERVAL '90 days'
        THEN ABS(mr.quantity_change)
        ELSE 0
      END)::INTEGER as exits_90d,
      SUM(CASE
        WHEN mr.quantity_change < 0 AND mr.performed_at >= NOW() - INTERVAL '365 days'
        THEN ABS(mr.quantity_change)
        ELSE 0
      END)::INTEGER as exits_365d,
      -- Entrées par période (quantity_change positif)
      SUM(CASE
        WHEN mr.quantity_change > 0 AND mr.performed_at >= NOW() - INTERVAL '30 days'
        THEN mr.quantity_change
        ELSE 0
      END)::INTEGER as entries_30d,
      SUM(CASE
        WHEN mr.quantity_change > 0 AND mr.performed_at >= NOW() - INTERVAL '90 days'
        THEN mr.quantity_change
        ELSE 0
      END)::INTEGER as entries_90d,
      SUM(CASE
        WHEN mr.quantity_change > 0 AND mr.performed_at >= NOW() - INTERVAL '365 days'
        THEN mr.quantity_change
        ELSE 0
      END)::INTEGER as entries_365d,
      -- Dernières dates
      MAX(CASE WHEN mr.quantity_change < 0 THEN mr.performed_at ELSE NULL END) as last_exit,
      MAX(CASE WHEN mr.quantity_change > 0 THEN mr.performed_at ELSE NULL END) as last_entry,
      -- Historique 90 derniers jours (pour sparkline)
      jsonb_agg(
        jsonb_build_object(
          'date', DATE(mr.performed_at),
          'qty', mr.quantity_change,
          'type', mr.movement_type
        )
        ORDER BY mr.performed_at DESC
      ) FILTER (WHERE mr.performed_at >= NOW() - INTERVAL '90 days') as history_90d
    FROM product_base pb
    LEFT JOIN movements_real mr ON pb.id = mr.product_id
    GROUP BY pb.id
  )
  -- Calcul final des métriques
  SELECT
    pb.id as product_id,
    pb.name::TEXT as product_name,
    pb.sku::TEXT,
    pb.stock_qty as stock_current,
    pb.stock_min as stock_minimum,
    pb.cost_px as cost_price,
    COALESCE(ma.exits_30d, 0) as out_30d,
    COALESCE(ma.exits_90d, 0) as out_90d,
    COALESCE(ma.exits_365d, 0) as out_365d,
    COALESCE(ma.entries_30d, 0) as in_30d,
    COALESCE(ma.entries_90d, 0) as in_90d,
    COALESCE(ma.entries_365d, 0) as in_365d,
    -- ADU (Average Daily Usage) = Sorties 30j / 30
    ROUND(COALESCE(ma.exits_30d, 0)::NUMERIC / 30, 2) as adu,
    -- Taux Rotation = (Sorties 365j / Stock Moyen) * 100
    -- Stock Moyen = (Stock Actuel + Stock Début Période) / 2 ≈ Stock Actuel (approximation)
    CASE
      WHEN pb.stock_qty > 0 THEN ROUND((COALESCE(ma.exits_365d, 0)::NUMERIC / pb.stock_qty) * 100, 2)
      ELSE 0
    END as turnover_rate,
    -- Couverture Stock (jours) = Stock Actuel / ADU
    CASE
      WHEN COALESCE(ma.exits_30d, 0) > 0 THEN
        ROUND((pb.stock_qty::NUMERIC / (COALESCE(ma.exits_30d, 0)::NUMERIC / 30)), 1)
      ELSE 999.9 -- Infini si aucune sortie
    END as coverage_days,
    -- Jours Inactivité = NOW() - Dernière Sortie
    CASE
      WHEN ma.last_exit IS NOT NULL THEN
        EXTRACT(DAY FROM NOW() - ma.last_exit)::INTEGER
      ELSE NULL -- Jamais eu de sortie
    END as days_inactive,
    -- Historique mouvements (JSONB pour sparkline)
    COALESCE(ma.history_90d, '[]'::JSONB) as movement_history,
    ma.last_exit as last_exit_date,
    ma.last_entry as last_entry_date
  FROM product_base pb
  LEFT JOIN movements_aggregated ma ON pb.id = ma.product_id
  ORDER BY pb.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_stock_analytics IS
  'Calcule métriques analytics stock (Rotation, Couverture, ADU, Inactivité) basées UNIQUEMENT sur Stock Réel. Utilisé par /stocks/analytics.';

-- ============================================================================
-- 2. PERMISSIONS : Grant EXECUTE à authenticated users
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_stock_analytics(INTEGER, UUID) TO authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  func_count INT;
BEGIN
  -- Vérifier que la fonction est créée
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname = 'get_stock_analytics';

  IF func_count < 1 THEN
    RAISE EXCEPTION 'Fonction RPC get_stock_analytics manquante';
  END IF;

  RAISE NOTICE '✅ Migration RPC Stock Analytics: Fonction créée avec succès';
  RAISE NOTICE '   - get_stock_analytics(period_days, organisation_id)';
  RAISE NOTICE '   - Retourne: 19 colonnes avec métriques complètes';
  RAISE NOTICE '   - Permissions EXECUTE granted à authenticated';
  RAISE NOTICE '   - Basé uniquement sur Stock Réel (affects_forecast=false)';
END $$;

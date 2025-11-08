-- Migration: Fix calcul cost_price dans get_stock_analytics
-- Date: 2025-11-02
-- Objectif: Utiliser moyenne pondérée des purchase_order_items au lieu de price_list_items
-- Règle métier: SUM(unit_price_ht * quantity) / SUM(quantity) pour PO status='received'
-- Fallback: products.cost_price (valeur saisie manuellement)

-- ============================================================================
-- 1. FONCTION : get_stock_analytics (VERSION CORRIGÉE)
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
      -- ✅ FIX: Moyenne pondérée par quantité des purchase_order_items
      COALESCE(
        -- Priorité 1: Moyenne pondérée (SUM(prix × qté) / SUM(qté))
        (SELECT ROUND(SUM(poi.unit_price_ht * poi.quantity)::NUMERIC /
                      NULLIF(SUM(poi.quantity), 0), 2)
         FROM purchase_order_items poi
         JOIN purchase_orders po ON poi.purchase_order_id = po.id
         WHERE poi.product_id = p.id
           AND po.status = 'received'),
        -- Priorité 2: Fallback valeur saisie manuellement
        p.cost_price,
        -- Priorité 3: Dernier fallback
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
  'Calcule métriques analytics stock. cost_price = moyenne pondérée par quantité des purchase_order_items (status=received), fallback products.cost_price.';

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
  test_cost_price NUMERIC;
BEGIN
  -- Vérifier que la fonction est créée
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname = 'get_stock_analytics';

  IF func_count < 1 THEN
    RAISE EXCEPTION 'Fonction RPC get_stock_analytics manquante';
  END IF;

  -- Test rapide : vérifier qu'au moins 1 produit a cost_price > 0
  SELECT cost_price INTO test_cost_price
  FROM get_stock_analytics(90, NULL)
  WHERE cost_price > 0
  LIMIT 1;

  RAISE NOTICE '✅ Migration Fix cost_price: Fonction mise à jour avec succès';
  RAISE NOTICE '   - Règle métier: Moyenne pondérée SUM(prix × qté) / SUM(qté)';
  RAISE NOTICE '   - Statut PO: Uniquement "received"';
  RAISE NOTICE '   - Fallback: products.cost_price';

  IF test_cost_price IS NOT NULL AND test_cost_price > 0 THEN
    RAISE NOTICE '   - Test: Au moins 1 produit avec cost_price = % EUR', test_cost_price;
  ELSE
    RAISE WARNING '   - Aucun produit avec cost_price > 0 (normal si aucune PO received)';
  END IF;
END $$;

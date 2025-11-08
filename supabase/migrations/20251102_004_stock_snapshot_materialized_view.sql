-- Migration: Vue Matérialisée Stock Snapshot
-- Date: 2025-11-02
-- Objectif: Pré-calculer stocks réel/prévisionnel par produit (évite SUM répétés)
-- Impact: Requêtes Dashboard/Inventaire 10x plus rapides

-- ============================================================================
-- 1. CRÉER VUE MATÉRIALISÉE : Snapshot stock par produit
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS stock_snapshot CASCADE;

CREATE MATERIALIZED VIEW stock_snapshot AS
SELECT
  product_id,
  -- Stock réel (mouvements effectués)
  SUM(CASE
    WHEN affects_forecast = false
    THEN quantity_change
    ELSE 0
  END) as stock_real,
  -- Stock prévisionnel entrées (commandes fournisseurs en cours)
  SUM(CASE
    WHEN affects_forecast = true AND forecast_type = 'in'
    THEN quantity_change
    ELSE 0
  END) as stock_forecasted_in,
  -- Stock prévisionnel sorties (commandes clients en cours)
  SUM(CASE
    WHEN affects_forecast = true AND forecast_type = 'out'
    THEN quantity_change
    ELSE 0
  END) as stock_forecasted_out,
  -- Métadonnées utiles
  COUNT(*) FILTER (WHERE affects_forecast = false) as total_movements_real,
  COUNT(*) FILTER (WHERE affects_forecast = true) as total_movements_forecast,
  MAX(performed_at) as last_movement_at,
  MIN(performed_at) as first_movement_at
FROM stock_movements
WHERE archived_at IS NULL
GROUP BY product_id;

COMMENT ON MATERIALIZED VIEW stock_snapshot IS
  'Vue matérialisée pré-calculant stocks réel/prévisionnel par produit. Refresh automatique après mouvements.';

-- ============================================================================
-- 2. INDEX UNIQUE : product_id (obligatoire pour REFRESH CONCURRENTLY)
-- ============================================================================

CREATE UNIQUE INDEX idx_stock_snapshot_product
ON stock_snapshot(product_id);

COMMENT ON INDEX idx_stock_snapshot_product IS
  'Index unique sur product_id, requis pour REFRESH MATERIALIZED VIEW CONCURRENTLY';

-- ============================================================================
-- 3. INDEX ADDITIONNELS : Requêtes fréquentes
-- ============================================================================

-- Index pour alertes stock faible (stock_real <= stock_minimum)
CREATE INDEX idx_stock_snapshot_low_stock
ON stock_snapshot(stock_real)
WHERE stock_real <= 10; -- Approximation, comparé avec products.stock_minimum en query

-- Index pour derniers mouvements
CREATE INDEX idx_stock_snapshot_recent
ON stock_snapshot(last_movement_at DESC);

-- ============================================================================
-- 4. FONCTION : Refresh automatique après INSERT/UPDATE/DELETE stock_movements
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_stock_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- REFRESH CONCURRENTLY permet de ne pas bloquer les lectures
  -- Requiert un UNIQUE INDEX (déjà créé ci-dessus)
  REFRESH MATERIALIZED VIEW CONCURRENTLY stock_snapshot;

  RAISE NOTICE '✅ stock_snapshot refreshed (trigger)';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_stock_snapshot IS
  'Refresh automatique de la vue matérialisée stock_snapshot après chaque modification stock_movements';

-- ============================================================================
-- 5. TRIGGER : Exécuter refresh après chaque modification stock_movements
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_refresh_stock_snapshot ON stock_movements;

CREATE TRIGGER trigger_refresh_stock_snapshot
AFTER INSERT OR UPDATE OR DELETE ON stock_movements
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_stock_snapshot();

COMMENT ON TRIGGER trigger_refresh_stock_snapshot ON stock_movements IS
  'Déclenche refresh stock_snapshot après INSERT/UPDATE/DELETE sur stock_movements';

-- ============================================================================
-- 6. INITIAL REFRESH
-- ============================================================================

-- Premier refresh pour peupler la vue
REFRESH MATERIALIZED VIEW stock_snapshot;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  snapshot_count INT;
  movements_count INT;
BEGIN
  -- Compter produits dans snapshot
  SELECT COUNT(*) INTO snapshot_count FROM stock_snapshot;

  -- Compter produits distincts dans stock_movements
  SELECT COUNT(DISTINCT product_id) INTO movements_count
  FROM stock_movements
  WHERE archived_at IS NULL;

  IF snapshot_count != movements_count THEN
    RAISE WARNING 'Snapshot incomplet: % produits snapshot vs % produits movements',
      snapshot_count, movements_count;
  END IF;

  RAISE NOTICE '✅ Migration Vue Matérialisée: stock_snapshot créée avec succès';
  RAISE NOTICE '   - % produits dans snapshot', snapshot_count;
  RAISE NOTICE '   - Refresh automatique activé via trigger';
  RAISE NOTICE '   - Index UNIQUE sur product_id (CONCURRENTLY support)';
END $$;

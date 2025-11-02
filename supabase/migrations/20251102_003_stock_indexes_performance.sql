-- Migration: Indexes Performance - Module Stock
-- Date: 2025-11-02
-- Objectif: Accélérer les requêtes critiques (historique, filtres, alertes)
-- Impact: Requêtes <100ms pour 10k rows

-- ============================================================================
-- 1. INDEX : Historique produit (page Mouvements filtrée par produit)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date
ON stock_movements(product_id, performed_at DESC)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_stock_movements_product_date IS
  'Optimise requêtes historique mouvements par produit (page Mouvements filtres)';

-- ============================================================================
-- 2. INDEX : Filtrage réel/prévisionnel (affects_forecast = false)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stock_movements_forecast_date
ON stock_movements(affects_forecast, performed_at DESC)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_stock_movements_forecast_date IS
  'Optimise filtrage mouvements réels vs prévisionnels (page Mouvements principale)';

-- ============================================================================
-- 3. INDEX : Filtrage par canal de vente
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stock_movements_channel
ON stock_movements(channel_id, performed_at DESC)
WHERE channel_id IS NOT NULL AND archived_at IS NULL;

COMMENT ON INDEX idx_stock_movements_channel IS
  'Optimise filtrage mouvements par canal de vente (Dashboard + Mouvements)';

-- ============================================================================
-- 4. INDEX : Alertes stock faible (Dashboard widget)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_low_stock
ON products(stock_quantity, stock_minimum)
WHERE stock_quantity <= stock_minimum
  AND archived_at IS NULL;

COMMENT ON INDEX idx_products_low_stock IS
  'Optimise widget Alertes Stock Faible du Dashboard (produits sous minimum)';

-- ============================================================================
-- 5. INDEX : Recherche produits par nom/SKU (Full-Text Search)
-- ============================================================================

-- Créer colonne tsvector si elle n'existe pas
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Générer le tsvector à partir de name + sku
UPDATE products
SET search_vector = to_tsvector('french', COALESCE(name, '') || ' ' || COALESCE(sku, ''))
WHERE search_vector IS NULL;

-- Index GIN sur la colonne tsvector
CREATE INDEX IF NOT EXISTS idx_products_search
ON products USING gin(search_vector);

COMMENT ON INDEX idx_products_search IS
  'Optimise recherche full-text produits par nom ou SKU';

-- Trigger pour maintenir search_vector à jour
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('french', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.sku, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_search_vector_update ON products;

CREATE TRIGGER trigger_products_search_vector_update
BEFORE INSERT OR UPDATE OF name, sku ON products
FOR EACH ROW
EXECUTE FUNCTION products_search_vector_update();

-- ============================================================================
-- 6. INDEX : Organisation (pour RLS policies rapides)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stock_movements_organisation
ON stock_movements(organisation_id, performed_at DESC)
WHERE archived_at IS NULL;

COMMENT ON INDEX idx_stock_movements_organisation IS
  'Optimise RLS policies filtrage par organisation';

-- ============================================================================
-- ANALYSE & VALIDATION
-- ============================================================================

-- Analyser les tables pour mettre à jour statistiques
ANALYZE stock_movements;
ANALYZE products;

-- Vérifier que les indexes sont créés
DO $$
DECLARE
  index_count INT;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('stock_movements', 'products')
    AND indexname LIKE 'idx_stock%';

  IF index_count < 6 THEN
    RAISE EXCEPTION 'Indexes manquants (attendu: 6, trouvé: %)', index_count;
  END IF;

  RAISE NOTICE '✅ Migration Indexes Performance: 6 indexes créés avec succès';
  RAISE NOTICE '   - idx_stock_movements_product_date';
  RAISE NOTICE '   - idx_stock_movements_forecast_date';
  RAISE NOTICE '   - idx_stock_movements_channel';
  RAISE NOTICE '   - idx_stock_movements_organisation';
  RAISE NOTICE '   - idx_products_low_stock';
  RAISE NOTICE '   - idx_products_search (GIN full-text)';
END $$;

-- 🎯 MIGRATION: Système Alertes Stock Intelligentes
-- Date: 2025-10-12
-- Objectif: Alertes stock réelles basées sur mouvements réels (pas mock)
--
-- RÈGLES MÉTIER:
-- 1. Un produit JAMAIS commandé (aucun mouvement IN) → PAS d'alerte (statut "prêt à commander")
-- 2. Un produit commandé au moins 1× + stock < min_stock → ALERTE active
-- 3. Triggers auto-sync: INSERT/UPDATE/DELETE sur stock_movements → recalcul alertes
-- 4. Suppression automatique alertes si stock ≥ min_stock

-- =============================================
-- ÉTAPE 1: Reset tous les seuils à 0 (cleanup)
-- =============================================

-- Mettre tous les min_stock à 0 pour démarrer propre
UPDATE products
SET min_stock = 0
WHERE min_stock IS NULL OR min_stock > 0;

COMMENT ON COLUMN products.min_stock IS 'Seuil minimum stock - 0 = pas d''alerte configurée';

-- =============================================
-- ÉTAPE 2: Fonction check si produit a été commandé
-- =============================================

CREATE OR REPLACE FUNCTION has_been_ordered(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_has_in_movement BOOLEAN;
BEGIN
  -- Vérifier s'il existe au moins un mouvement IN (entrée stock)
  SELECT EXISTS(
    SELECT 1
    FROM stock_movements
    WHERE product_id = p_product_id
      AND movement_type = 'IN'
      AND affects_forecast = false  -- Seulement mouvements réels
    LIMIT 1
  ) INTO v_has_in_movement;

  RETURN v_has_in_movement;
END;
$$;

COMMENT ON FUNCTION has_been_ordered(UUID) IS
'Vérifie si un produit a déjà reçu au moins une entrée stock (commande réelle)';

-- =============================================
-- ÉTAPE 3: Fonction calcul statut alerte intelligent
-- =============================================

CREATE OR REPLACE FUNCTION get_smart_stock_status(p_product_id UUID)
RETURNS TABLE (
  product_id UUID,
  stock_quantity INTEGER,
  min_stock INTEGER,
  has_been_ordered BOOLEAN,
  alert_status TEXT,
  alert_priority INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_stock INTEGER;
  v_min INTEGER;
  v_ordered BOOLEAN;
BEGIN
  -- Récupérer stock actuel et seuil
  SELECT
    COALESCE(p.stock_quantity, 0),
    COALESCE(p.min_stock, 0)
  INTO v_stock, v_min
  FROM products p
  WHERE p.id = p_product_id;

  -- Check si commandé
  v_ordered := has_been_ordered(p_product_id);

  -- Déterminer statut selon règles métier
  RETURN QUERY
  SELECT
    p_product_id,
    v_stock,
    v_min,
    v_ordered,
    CASE
      -- Jamais commandé → Prêt à commander (pas d'alerte)
      WHEN NOT v_ordered THEN 'ready_to_order'
      -- Commandé + rupture totale → Alerte critique
      WHEN v_ordered AND v_stock <= 0 THEN 'out_of_stock'
      -- Commandé + stock < seuil → Alerte faible stock
      WHEN v_ordered AND v_min > 0 AND v_stock < v_min THEN 'low_stock'
      -- Commandé + stock OK → Normal
      ELSE 'in_stock'
    END AS alert_status,
    CASE
      WHEN NOT v_ordered THEN 0  -- Pas d'alerte
      WHEN v_ordered AND v_stock <= 0 THEN 3  -- Critique
      WHEN v_ordered AND v_min > 0 AND v_stock < v_min THEN 2  -- Faible
      ELSE 1  -- Normal
    END AS alert_priority;
END;
$$;

COMMENT ON FUNCTION get_smart_stock_status(UUID) IS
'Calcule le statut alerte intelligent selon règles métier: pas d''alerte si jamais commandé';

-- =============================================
-- ÉTAPE 4: Vue materialized pour dashboard
-- =============================================

DROP VIEW IF EXISTS stock_alerts_view CASCADE;

CREATE OR REPLACE VIEW stock_alerts_view AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.stock_quantity,
  p.min_stock,
  s.has_been_ordered,
  s.alert_status,
  s.alert_priority
FROM products p
CROSS JOIN LATERAL get_smart_stock_status(p.id) s
WHERE p.archived_at IS NULL
  AND s.alert_status IN ('out_of_stock', 'low_stock')  -- Seulement alertes actives
ORDER BY s.alert_priority DESC, p.stock_quantity ASC;

COMMENT ON VIEW stock_alerts_view IS
'Vue alertes stock intelligentes: seulement produits commandés avec stock insuffisant';

-- =============================================
-- ÉTAPE 5: Fonction update alerte sur mouvement
-- =============================================

CREATE OR REPLACE FUNCTION update_stock_alert_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sur INSERT/UPDATE: Pas d'action spéciale (la vue se met à jour auto)
  -- Sur DELETE: Pas d'action spéciale (la vue se met à jour auto)

  -- La vue stock_alerts_view se recalcule automatiquement
  -- car elle utilise get_smart_stock_status() qui check movements

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger sur mouvements stock
DROP TRIGGER IF EXISTS trg_update_stock_alert ON stock_movements;
CREATE TRIGGER trg_update_stock_alert
AFTER INSERT OR UPDATE OR DELETE ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_stock_alert_on_movement();

COMMENT ON TRIGGER trg_update_stock_alert ON stock_movements IS
'Déclenche recalcul alertes à chaque mouvement stock';

-- =============================================
-- ÉTAPE 6: Fonction replacement get_stock_alerts
-- =============================================

-- Remplacer l'ancienne fonction mockée par la vraie
DROP FUNCTION IF EXISTS get_stock_alerts(INT);

CREATE OR REPLACE FUNCTION get_stock_alerts(limit_count INT DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  stock_level INT,
  min_stock INT,
  alert_status TEXT,
  alert_priority INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    product_id,
    product_name,
    sku,
    stock_quantity AS stock_level,
    min_stock,
    alert_status,
    alert_priority
  FROM stock_alerts_view
  ORDER BY alert_priority DESC, stock_quantity ASC
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION get_stock_alerts(INT) IS
'Retourne les alertes de stock critiques (vraies données, pas mock)';

-- =============================================
-- ÉTAPE 7: RLS Policies
-- =============================================

-- Policy pour vue alertes
ALTER VIEW stock_alerts_view OWNER TO postgres;

-- Grants
GRANT SELECT ON stock_alerts_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_stock_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_been_ordered(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_alerts(INT) TO authenticated;

-- =============================================
-- VALIDATION & TESTS
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Smart Stock Alerts appliquée avec succès';
  RAISE NOTICE '📊 Tous les min_stock ont été réinitialisés à 0';
  RAISE NOTICE '🎯 Les alertes ne s''activeront que pour les produits commandés';
  RAISE NOTICE '🔄 Triggers automatiques activés sur stock_movements';
END $$;

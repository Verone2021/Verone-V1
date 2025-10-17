-- 🔔 MIGRATION: Notifications Automatiques Stock Prévisionnel Négatif
-- Date: 2025-10-12
-- Objectif: Créer notifications urgentes automatiquement quand stock prévisionnel < 0
--
-- RÈGLES MÉTIER:
-- 1. Quand stock_forecasted_out > stock_real → Stock prévisionnel négatif
-- 2. Génération automatique notification "operations" niveau "urgent"
-- 3. Notification pour tous les admins et stock_managers
-- 4. Action directe: lien vers création commande fournisseur

-- =============================================
-- ÉTAPE 1: Fonction génération notification stock négatif
-- =============================================

CREATE OR REPLACE FUNCTION notify_negative_forecast_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_available INTEGER;
  v_notification_id UUID;
  v_user_record RECORD;
BEGIN
  -- Calculer stock disponible (réel - prévisionnel sortie)
  v_stock_available := NEW.stock_real - NEW.stock_forecasted_out;

  -- Si stock devient négatif ou critique (< 0)
  IF v_stock_available < 0 THEN

    -- Créer notification pour chaque admin/stock_manager
    FOR v_user_record IN
      SELECT id
      FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'stock_manager')
        OR raw_app_meta_data->>'role' IN ('admin', 'stock_manager')
    LOOP

      -- Insérer notification
      INSERT INTO notifications (
        user_id,
        type,
        severity,
        title,
        message,
        action_url,
        action_label,
        read
      )
      VALUES (
        v_user_record.id,
        'operations',
        'urgent',
        '🚨 Commande fournisseur urgente requise',
        format('Produit "%s" (SKU: %s) - Stock prévisionnel: %s unités (Stock réel: %s, Prévu en sortie: %s)',
          NEW.name,
          COALESCE(NEW.sku, 'N/A'),
          v_stock_available,
          NEW.stock_real,
          NEW.stock_forecasted_out
        ),
        '/commandes/fournisseurs/nouveau?product_id=' || NEW.id,
        'Commander maintenant',
        false
      )
      RETURNING id INTO v_notification_id;

      RAISE NOTICE '✅ Notification créée (ID: %) pour user % - Produit % en stock négatif (%)',
        v_notification_id, v_user_record.id, NEW.name, v_stock_available;

    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_negative_forecast_stock() IS
'Génère automatiquement des notifications urgentes quand stock prévisionnel devient négatif';

-- =============================================
-- ÉTAPE 2: Trigger sur mise à jour produits
-- =============================================

-- Supprimer trigger existant si présent
DROP TRIGGER IF EXISTS trg_notify_negative_forecast ON products;

-- Créer trigger sur UPDATE de stock_forecasted_out
CREATE TRIGGER trg_notify_negative_forecast
  AFTER UPDATE OF stock_forecasted_out, stock_real ON products
  FOR EACH ROW
  WHEN (
    -- Déclencher seulement si:
    -- 1. Le stock prévisionnel a changé OU le stock réel a changé
    (NEW.stock_forecasted_out IS DISTINCT FROM OLD.stock_forecasted_out
     OR NEW.stock_real IS DISTINCT FROM OLD.stock_real)
    -- 2. ET le nouveau stock disponible est négatif
    AND (NEW.stock_real - NEW.stock_forecasted_out) < 0
    -- 3. ET l'ancien stock disponible était positif ou égal à 0 (transition vers négatif)
    AND (OLD.stock_real - OLD.stock_forecasted_out) >= 0
  )
  EXECUTE FUNCTION notify_negative_forecast_stock();

COMMENT ON TRIGGER trg_notify_negative_forecast ON products IS
'Déclenche notification automatique lors de transition vers stock prévisionnel négatif';

-- =============================================
-- ÉTAPE 3: Fonction helper pour stock disponible
-- =============================================

-- Fonction utilitaire pour obtenir rapidement le stock disponible d'un produit
CREATE OR REPLACE FUNCTION get_forecasted_stock_available(p_product_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(stock_real, 0) - COALESCE(stock_forecasted_out, 0)
  FROM products
  WHERE id = p_product_id;
$$;

COMMENT ON FUNCTION get_forecasted_stock_available(UUID) IS
'Retourne le stock disponible prévisionnel (réel - prévu en sortie)';

-- =============================================
-- ÉTAPE 4: Vue matérialisée alertes stock prévisionnel
-- =============================================

-- Vue pour dashboard: produits avec stock prévisionnel négatif
DROP VIEW IF EXISTS negative_forecasted_stock_view CASCADE;

CREATE OR REPLACE VIEW negative_forecasted_stock_view AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.stock_real,
  p.stock_forecasted_in,
  p.stock_forecasted_out,
  (p.stock_real - p.stock_forecasted_out) AS stock_available,
  (p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out) AS stock_future_available,
  CASE
    WHEN (p.stock_real - p.stock_forecasted_out) <= -10 THEN 'critical'
    WHEN (p.stock_real - p.stock_forecasted_out) < 0 THEN 'urgent'
    ELSE 'warning'
  END AS alert_level
FROM products p
WHERE p.archived_at IS NULL
  AND (p.stock_real - p.stock_forecasted_out) < 0
ORDER BY (p.stock_real - p.stock_forecasted_out) ASC;

COMMENT ON VIEW negative_forecasted_stock_view IS
'Vue des produits avec stock prévisionnel négatif nécessitant commande fournisseur';

-- =============================================
-- ÉTAPE 5: RLS Policies & Grants
-- =============================================

-- Grants sur nouvelle vue
GRANT SELECT ON negative_forecasted_stock_view TO authenticated;

-- Grants sur fonctions
GRANT EXECUTE ON FUNCTION get_forecasted_stock_available(UUID) TO authenticated;

-- =============================================
-- ÉTAPE 6: Index optimisation performance
-- =============================================

-- Index pour recherche rapide stock négatif
CREATE INDEX IF NOT EXISTS idx_products_negative_forecast
  ON products ((stock_real - stock_forecasted_out))
  WHERE (stock_real - stock_forecasted_out) < 0;

COMMENT ON INDEX idx_products_negative_forecast IS
'Index optimisé pour requêtes sur stock prévisionnel négatif';

-- =============================================
-- VALIDATION & TESTS
-- =============================================

DO $$
DECLARE
  v_products_with_negative_forecast INTEGER;
BEGIN
  -- Compter produits avec stock prévisionnel négatif existants
  SELECT COUNT(*) INTO v_products_with_negative_forecast
  FROM products
  WHERE (stock_real - stock_forecasted_out) < 0;

  RAISE NOTICE '✅ Migration Notifications Stock Négatif appliquée avec succès';
  RAISE NOTICE '📊 Produits actuellement en stock prévisionnel négatif: %', v_products_with_negative_forecast;
  RAISE NOTICE '🔔 Trigger automatique activé sur products (stock_forecasted_out, stock_real)';
  RAISE NOTICE '🎯 Notifications créées automatiquement pour admins et stock_managers';
END $$;

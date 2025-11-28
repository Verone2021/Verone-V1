-- ============================================================================
-- Migration: Alignement notifications SO avec PO
-- Date: 2025-11-28
-- Description: Crée 3 triggers de notification pour SO alignés avec PO existants
--              1. notify_so_delayed - SO en retard (comme notify_po_delayed)
--              2. notify_stock_negative_forecast - Stock prévisionnel négatif (URGENT)
--              3. notify_so_partial_shipped - Expédition partielle (comme notify_po_partial_received)
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: notify_so_delayed
-- Notification quand une commande client dépasse sa date de livraison prévue
-- Aligné avec: notify_po_delayed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_so_delayed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_notification_count INT;
  v_days_late INT;
BEGIN
  -- Déclencher si expected_delivery_date est passée et status pas shipped/delivered/cancelled
  IF NEW.expected_delivery_date IS NOT NULL
     AND NEW.expected_delivery_date < CURRENT_DATE
     AND NEW.status::TEXT NOT IN ('shipped', 'delivered', 'cancelled')
     AND (OLD.expected_delivery_date IS NULL OR OLD.expected_delivery_date >= CURRENT_DATE)
  THEN
    v_days_late := CURRENT_DATE - NEW.expected_delivery_date;

    SELECT create_notification_for_owners(
      'operations',
      'urgent',
      'Commande client en retard',
      'La commande client ' || NEW.order_number || ' est en retard de ' || v_days_late || ' jour(s).',
      '/commandes/clients',
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'SO delayed: % notifications creees pour SO %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- Créer le trigger sur sales_orders
DROP TRIGGER IF EXISTS trigger_so_delayed_notification ON sales_orders;
CREATE TRIGGER trigger_so_delayed_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_so_delayed();

COMMENT ON TRIGGER trigger_so_delayed_notification ON sales_orders IS
  'Notification URGENT quand SO dépasse date livraison prévue (aligné avec PO)';

-- ============================================================================
-- TRIGGER 2: notify_stock_negative_forecast
-- Notification URGENTE quand stock prévisionnel devient négatif
-- Priorité: URGENT (plus grave que stock bas)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_stock_negative_forecast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_notification_count INT;
  v_forecasted_stock INT;
  v_product_name TEXT;
BEGIN
  -- Calculer stock prévisionnel
  v_forecasted_stock := NEW.stock_real + COALESCE(NEW.stock_forecasted_in, 0) - COALESCE(NEW.stock_forecasted_out, 0);

  -- Notification si prévisionnel devient négatif (et n'était pas négatif avant)
  IF v_forecasted_stock < 0 THEN
    -- Vérifier que ce n'était pas déjà négatif avant
    IF OLD.stock_real + COALESCE(OLD.stock_forecasted_in, 0) - COALESCE(OLD.stock_forecasted_out, 0) >= 0 THEN

      SELECT name INTO v_product_name FROM products WHERE id = NEW.id;

      SELECT create_notification_for_owners(
        'operations',
        'urgent',
        'Stock previsionnel negatif',
        'Le produit "' || COALESCE(v_product_name, NEW.sku) || '" a un stock previsionnel de ' || v_forecasted_stock || ' unites. Commander en urgence.',
        '/stocks/alertes',
        'Voir Alertes'
      ) INTO v_notification_count;

      RAISE NOTICE 'Stock negative forecast: % notifications creees pour produit %', v_notification_count, NEW.sku;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Créer le trigger sur products
DROP TRIGGER IF EXISTS trigger_stock_negative_forecast_notification ON products;
CREATE TRIGGER trigger_stock_negative_forecast_notification
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.stock_real IS DISTINCT FROM OLD.stock_real
     OR NEW.stock_forecasted_in IS DISTINCT FROM OLD.stock_forecasted_in
     OR NEW.stock_forecasted_out IS DISTINCT FROM OLD.stock_forecasted_out)
  EXECUTE FUNCTION notify_stock_negative_forecast();

COMMENT ON TRIGGER trigger_stock_negative_forecast_notification ON products IS
  'Notification URGENT quand stock prévisionnel devient négatif (plus grave que stock bas)';

-- ============================================================================
-- TRIGGER 3: notify_so_partial_shipped
-- Notification quand une SO passe en partially_shipped
-- Aligné avec: notify_po_partial_received
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_so_partial_shipped()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'partially_shipped' AND (OLD.status IS NULL OR OLD.status::TEXT <> 'partially_shipped') THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',
      'Expedition partielle',
      'Expedition partielle pour la commande client ' || NEW.order_number || '.',
      '/commandes/clients',
      'Voir Expedition'
    ) INTO v_notification_count;

    RAISE NOTICE 'SO partial shipped: % notifications creees pour SO %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- Créer le trigger sur sales_orders
DROP TRIGGER IF EXISTS trigger_so_partial_shipped_notification ON sales_orders;
CREATE TRIGGER trigger_so_partial_shipped_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_so_partial_shipped();

COMMENT ON TRIGGER trigger_so_partial_shipped_notification ON sales_orders IS
  'Notification INFO quand SO en expédition partielle (aligné avec PO partial received)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_trigger_count INT;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE t.tgname IN (
    'trigger_so_delayed_notification',
    'trigger_stock_negative_forecast_notification',
    'trigger_so_partial_shipped_notification'
  )
  AND NOT t.tgisinternal;

  IF v_trigger_count = 3 THEN
    RAISE NOTICE '✅ 3 nouveaux triggers notifications SO créés avec succès';
    RAISE NOTICE '   - trigger_so_delayed_notification (URGENT)';
    RAISE NOTICE '   - trigger_stock_negative_forecast_notification (URGENT)';
    RAISE NOTICE '   - trigger_so_partial_shipped_notification (INFO)';
  ELSE
    RAISE WARNING '❌ Seulement % triggers créés sur 3 attendus', v_trigger_count;
  END IF;
END $$;

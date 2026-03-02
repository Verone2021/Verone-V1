-- ============================================================================
-- LinkMe Notification Triggers
--
-- Inserts into `notifications` table for LinkMe workflow events:
-- 1. Info request sent (linkme_info_requests INSERT)
-- 2. Info request completed by contact (linkme_info_requests UPDATE completed_at)
-- 3. Step 4 completed - delivery info provided (sales_order_linkme_details UPDATE step4_completed_at)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Notification: Info request sent
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_linkme_info_request_sent()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  SELECT order_number INTO v_order_number
  FROM sales_orders
  WHERE id = NEW.sales_order_id;

  INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
  SELECT
    uar.user_id,
    'business',
    'info',
    'Demande d''infos envoyée',
    format('Demande envoyée à %s pour la commande %s',
           COALESCE(NEW.recipient_name, NEW.recipient_email),
           COALESCE(v_order_number, 'N/A')),
    format('/canaux-vente/linkme/commandes/%s', NEW.sales_order_id),
    'Voir commande'
  FROM user_app_roles uar
  WHERE uar.app = 'back-office'
    AND uar.is_active = true;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_linkme_info_request_sent: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_notify_linkme_info_request_sent ON linkme_info_requests;
CREATE TRIGGER trg_notify_linkme_info_request_sent
  AFTER INSERT ON linkme_info_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_linkme_info_request_sent();

-- --------------------------------------------------------------------------
-- 2. Notification: Info request completed by contact
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_linkme_info_request_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  IF NEW.completed_at IS NOT NULL
     AND OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN

    SELECT order_number INTO v_order_number
    FROM sales_orders
    WHERE id = NEW.sales_order_id;

    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    SELECT
      uar.user_id,
      'business',
      'important',
      'Infos complétées par le contact',
      format('%s a complété les informations pour la commande %s',
             COALESCE(NEW.completed_by_email, 'Contact'),
             COALESCE(v_order_number, 'N/A')),
      format('/canaux-vente/linkme/commandes/%s', NEW.sales_order_id),
      'Voir commande'
    FROM user_app_roles uar
    WHERE uar.app = 'back-office'
      AND uar.is_active = true;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_linkme_info_request_completed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_notify_linkme_info_request_completed ON linkme_info_requests;
CREATE TRIGGER trg_notify_linkme_info_request_completed
  AFTER UPDATE ON linkme_info_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_linkme_info_request_completed();

-- --------------------------------------------------------------------------
-- 3. Notification: Step 4 completed (delivery info provided)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_linkme_step4_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  IF NEW.step4_completed_at IS NOT NULL
     AND OLD.step4_completed_at IS DISTINCT FROM NEW.step4_completed_at THEN

    SELECT order_number INTO v_order_number
    FROM sales_orders
    WHERE id = NEW.sales_order_id;

    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    SELECT
      uar.user_id,
      'business',
      'info',
      'Informations de livraison fournies',
      format('Les informations de livraison ont été fournies pour la commande %s',
             COALESCE(v_order_number, 'N/A')),
      format('/canaux-vente/linkme/commandes/%s', NEW.sales_order_id),
      'Voir commande'
    FROM user_app_roles uar
    WHERE uar.app = 'back-office'
      AND uar.is_active = true;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_linkme_step4_completed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_notify_linkme_step4_completed ON sales_order_linkme_details;
CREATE TRIGGER trg_notify_linkme_step4_completed
  AFTER UPDATE ON sales_order_linkme_details
  FOR EACH ROW
  EXECUTE FUNCTION notify_linkme_step4_completed();

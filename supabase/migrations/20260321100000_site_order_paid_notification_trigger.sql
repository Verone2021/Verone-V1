-- Trigger: Create back-office notification when a site order is paid
-- Notifies all active back-office admin/owner users

CREATE OR REPLACE FUNCTION notify_backoffice_on_site_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    INSERT INTO notifications (type, severity, title, message, action_url, action_label, user_id)
    SELECT
      'business',
      'important',
      'Nouvelle commande site internet',
      NEW.customer_name || ' — ' || NEW.total || ' EUR',
      '/canaux-vente/site-internet?tab=commandes',
      'Voir la commande',
      uar.user_id
    FROM user_app_roles uar
    WHERE uar.app = 'back-office'
      AND uar.is_active = true
      AND uar.role IN ('owner', 'admin');
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists to allow re-run
DROP TRIGGER IF EXISTS trg_site_order_paid_notification ON site_orders;

CREATE TRIGGER trg_site_order_paid_notification
  AFTER INSERT OR UPDATE ON site_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_backoffice_on_site_order_paid();

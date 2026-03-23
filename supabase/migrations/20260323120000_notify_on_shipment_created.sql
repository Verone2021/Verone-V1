-- Trigger: notify back-office owners/admins when a shipment is created.
-- Handles both manual shipments and Packlink shipments (with different
-- severity and action URLs).
--
-- Multi-product shipments insert N rows with the same sales_order_id +
-- identical title/message, so the 24h dedup in create_notification_for_owners()
-- naturally collapses them into a single notification.

CREATE OR REPLACE FUNCTION notify_shipment_created()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_order_number TEXT;
  v_title TEXT;
  v_message TEXT;
  v_severity TEXT;
  v_action_url TEXT;
  v_notification_count INTEGER;
BEGIN
  -- Fetch order number for the notification message
  SELECT order_number INTO v_order_number
  FROM sales_orders WHERE id = NEW.sales_order_id;

  IF NEW.packlink_status = 'a_payer' THEN
    v_title := 'Expedition Packlink creee';
    v_message := 'Commande ' || COALESCE(v_order_number, 'N/A')
      || ' — Transport Packlink a finaliser';
    v_severity := 'important';
    v_action_url := '/stocks/expeditions';
  ELSE
    v_title := 'Expedition enregistree';
    v_message := 'Commande ' || COALESCE(v_order_number, 'N/A')
      || ' — Expedition ' || COALESCE(NEW.delivery_method, 'colis') || ' creee';
    v_severity := 'info';
    v_action_url := '/commandes/clients?id=' || NEW.sales_order_id;
  END IF;

  -- Create notification for all back-office owners/admins (with 24h dedup)
  SELECT create_notification_for_owners(
    'operations', v_severity,
    v_title, v_message,
    v_action_url, 'Voir expedition'
  ) INTO v_notification_count;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block shipment insertion if notification fails
  RAISE NOTICE 'Error in notify_shipment_created: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_shipment_created
  AFTER INSERT ON sales_order_shipments
  FOR EACH ROW
  EXECUTE FUNCTION notify_shipment_created();

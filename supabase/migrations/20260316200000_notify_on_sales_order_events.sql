-- Trigger: notify back-office owners/admins when key email events
-- are recorded in sales_order_events (order confirmation, approval,
-- rejection, step4 delivery confirmation).
--
-- Skips email_info_request_sent because linkme_info_requests already
-- has its own notification trigger (trg_notify_linkme_info_request_sent).

CREATE OR REPLACE FUNCTION notify_sales_order_event()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_order_number TEXT;
  v_title TEXT;
  v_message TEXT;
  v_severity TEXT := 'info';
  v_action_url TEXT;
  v_notification_count INTEGER;
BEGIN
  -- Fetch order number for the notification message
  SELECT order_number INTO v_order_number
  FROM sales_orders WHERE id = NEW.sales_order_id;

  v_action_url := '/canaux-vente/linkme/commandes/' || NEW.sales_order_id;

  -- Map event_type to notification content
  CASE NEW.event_type
    WHEN 'email_confirmation_sent' THEN
      v_title := 'Nouvelle commande LinkMe';
      v_message := 'Commande ' || COALESCE(v_order_number, 'N/A')
        || ' — Email de confirmation envoyé à '
        || COALESCE(NEW.metadata->>'recipient_email', '');
      v_severity := 'important';

    WHEN 'email_approval_sent' THEN
      v_title := 'Commande approuvée';
      v_message := 'Commande ' || COALESCE(v_order_number, 'N/A')
        || ' approuvée — Email envoyé à '
        || COALESCE(NEW.metadata->>'recipient_email', '');
      v_severity := 'important';

    WHEN 'email_rejection_sent' THEN
      v_title := 'Commande refusée';
      v_message := 'Commande ' || COALESCE(v_order_number, 'N/A')
        || ' refusée — Email envoyé à '
        || COALESCE(NEW.metadata->>'recipient_email', '');
      v_severity := 'important';

    WHEN 'email_step4_confirmed' THEN
      v_title := 'Livraison confirmée';
      v_message := 'Commande ' || COALESCE(v_order_number, 'N/A')
        || ' — Informations de livraison complétées';
      v_severity := 'important';

    ELSE
      -- Unknown or already-handled event type (e.g. email_info_request_sent)
      -- Skip notification to avoid duplicates
      RETURN NEW;
  END CASE;

  -- Create notification for all back-office owners/admins (with 24h dedup)
  SELECT create_notification_for_owners(
    'operations', v_severity,
    v_title, v_message,
    v_action_url, 'Voir commande'
  ) INTO v_notification_count;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block event insertion if notification fails
  RAISE NOTICE 'Error in notify_sales_order_event: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_sales_order_event
  AFTER INSERT ON sales_order_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_sales_order_event();

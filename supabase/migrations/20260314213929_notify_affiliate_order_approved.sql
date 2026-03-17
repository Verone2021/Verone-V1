-- ============================================================================
-- Migration: Notification affilié quand commande approuvée
-- Date: 2026-03-14
-- Description: Notifie l'utilisateur qui a créé la commande (created_by)
--              quand sa commande passe de pending_approval à draft (approuvée)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_affiliate_order_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement quand status passe de pending_approval à draft
  IF OLD.status = 'pending_approval' AND NEW.status = 'draft'
     AND NEW.created_by IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url)
    VALUES (
      NEW.created_by,
      'business',
      'important',
      'Commande approuvée',
      format('Votre commande %s a été approuvée. Un devis détaillé incluant les frais de transport vous sera adressé prochainement.', NEW.order_number),
      format('/commandes/%s', NEW.id)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating order approval notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_affiliate_order_approved ON sales_orders;
CREATE TRIGGER trg_notify_affiliate_order_approved
AFTER UPDATE ON sales_orders
FOR EACH ROW
WHEN (OLD.status = 'pending_approval' AND NEW.status = 'draft')
EXECUTE FUNCTION notify_affiliate_order_approved();

COMMENT ON FUNCTION notify_affiliate_order_approved() IS
'Notifie l''affilié (created_by) quand sa commande est approuvée (pending_approval → draft)';

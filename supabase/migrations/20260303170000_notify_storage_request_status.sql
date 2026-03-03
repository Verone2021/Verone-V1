-- ============================================================================
-- Storage Request Status Notification Triggers
--
-- Notifies affiliate users (LinkMe) when their storage request is:
-- 1. Approved (status -> 'reception_created')
-- 2. Rejected (status -> 'rejected')
--
-- Targets: all active LinkMe users for the affiliate's enseigne OR organisation
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Notification: Storage request approved
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_storage_request_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
BEGIN
  -- Only fire when status changes to 'reception_created'
  IF NEW.status = 'reception_created'
     AND OLD.status IS DISTINCT FROM NEW.status THEN

    SELECT name INTO v_product_name
    FROM products
    WHERE id = NEW.product_id;

    -- Notify all LinkMe users of the affiliate's enseigne or organisation
    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    SELECT
      uar.user_id,
      'business',
      'important',
      'Demande de stockage approuvee',
      format('Votre demande pour %s (%s unites) a ete approuvee. Vous pouvez envoyer vos produits.',
             COALESCE(v_product_name, 'Produit'),
             NEW.quantity),
      '/stockage?tab=demandes',
      'Voir mes demandes'
    FROM user_app_roles uar
    WHERE uar.app = 'linkme'
      AND uar.is_active = true
      AND (
        (NEW.owner_enseigne_id IS NOT NULL AND uar.enseigne_id = NEW.owner_enseigne_id)
        OR
        (NEW.owner_organisation_id IS NOT NULL AND uar.organisation_id = NEW.owner_organisation_id)
      );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_storage_request_approved: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_notify_storage_request_approved ON affiliate_storage_requests;
CREATE TRIGGER trg_notify_storage_request_approved
  AFTER UPDATE ON affiliate_storage_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_storage_request_approved();

-- --------------------------------------------------------------------------
-- 2. Notification: Storage request rejected
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_storage_request_rejected()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
BEGIN
  -- Only fire when status changes to 'rejected'
  IF NEW.status = 'rejected'
     AND OLD.status IS DISTINCT FROM NEW.status THEN

    SELECT name INTO v_product_name
    FROM products
    WHERE id = NEW.product_id;

    -- Notify all LinkMe users of the affiliate's enseigne or organisation
    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    SELECT
      uar.user_id,
      'business',
      'important',
      'Demande de stockage rejetee',
      format('Votre demande pour %s (%s unites) a ete rejetee. Raison : %s',
             COALESCE(v_product_name, 'Produit'),
             NEW.quantity,
             COALESCE(NEW.rejection_reason, 'Non specifiee')),
      '/stockage?tab=demandes',
      'Voir mes demandes'
    FROM user_app_roles uar
    WHERE uar.app = 'linkme'
      AND uar.is_active = true
      AND (
        (NEW.owner_enseigne_id IS NOT NULL AND uar.enseigne_id = NEW.owner_enseigne_id)
        OR
        (NEW.owner_organisation_id IS NOT NULL AND uar.organisation_id = NEW.owner_organisation_id)
      );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_storage_request_rejected: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_notify_storage_request_rejected ON affiliate_storage_requests;
CREATE TRIGGER trg_notify_storage_request_rejected
  AFTER UPDATE ON affiliate_storage_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_storage_request_rejected();

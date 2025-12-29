-- ============================================================================
-- Migration: Affiliate Order Notifications
-- Date: 2025-12-19
-- Description: Trigger pour notifier les admins quand un affilié crée une commande
-- ============================================================================

-- 1. Fonction de notification
CREATE OR REPLACE FUNCTION notify_admin_affiliate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement pour les nouvelles commandes avec pending_admin_validation = true
  IF NEW.pending_admin_validation = true AND NEW.created_by_affiliate_id IS NOT NULL THEN
    -- Insérer notification pour les admins
    INSERT INTO notifications (
      type,
      title,
      message,
      data,
      target_roles,
      created_at,
      read
    ) VALUES (
      'affiliate_order_pending',
      'Nouvelle commande affilié',
      format('Commande %s en attente de validation', NEW.order_number),
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'affiliate_id', NEW.created_by_affiliate_id,
        'total_ttc', NEW.total_ttc
      ),
      ARRAY['owner', 'admin']::text[],
      NOW(),
      false
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    -- Si la table notifications n'existe pas, on ignore silencieusement
    RAISE NOTICE 'Table notifications does not exist, skipping notification';
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas bloquer la création de commande
    RAISE NOTICE 'Error creating notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger sur INSERT
DROP TRIGGER IF EXISTS trg_notify_affiliate_order ON sales_orders;

CREATE TRIGGER trg_notify_affiliate_order
AFTER INSERT ON sales_orders
FOR EACH ROW
WHEN (NEW.pending_admin_validation = true)
EXECUTE FUNCTION notify_admin_affiliate_order();

-- 3. Commentaire
COMMENT ON FUNCTION notify_admin_affiliate_order() IS
'Notifie les admins (owner, admin) quand un affilié crée une commande en attente de validation';

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_notify_affiliate_order ON sales_orders;
-- DROP FUNCTION IF EXISTS notify_admin_affiliate_order();

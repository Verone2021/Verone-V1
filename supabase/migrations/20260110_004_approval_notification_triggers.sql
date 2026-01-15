-- ============================================================================
-- Migration: Approval Notification Triggers
-- Date: 2026-01-10
-- Description: Crée des notifications pour les admins back-office lors des
--              demandes d'approbation (commandes, produits, organisations)
-- ============================================================================

-- ============================================
-- TRIGGER 1: FIX - Notification pour Commandes en Attente
-- (Corrige le trigger existant avec le bon schéma)
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_affiliate_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pending_admin_validation = true THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url)
    SELECT u.id, 'business', 'important',
           'Nouvelle commande à valider',
           format('Commande %s en attente de validation', NEW.order_number),
           '/canaux-vente/linkme/approbations?tab=commandes'
    FROM auth.users u
    JOIN user_app_roles uar ON uar.user_id = u.id
    WHERE uar.app = 'back-office';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating order notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_notify_affiliate_order ON sales_orders;
CREATE TRIGGER trg_notify_affiliate_order
AFTER INSERT ON sales_orders
FOR EACH ROW
WHEN (NEW.pending_admin_validation = true)
EXECUTE FUNCTION notify_admin_affiliate_order();

COMMENT ON FUNCTION notify_admin_affiliate_order() IS
'Notifie les admins back-office quand une commande est créée avec pending_admin_validation = true';

-- ============================================
-- TRIGGER 2: Notification pour Produits en Approbation
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_product_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement quand le statut passe à pending_approval
  IF NEW.affiliate_approval_status = 'pending_approval'
     AND (OLD.affiliate_approval_status IS DISTINCT FROM 'pending_approval') THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url)
    SELECT u.id, 'business', 'important',
           'Nouveau produit à approuver',
           'Le produit "' || NEW.name || '" attend votre validation.',
           '/canaux-vente/linkme/approbations?tab=produits'
    FROM auth.users u
    JOIN user_app_roles uar ON uar.user_id = u.id
    WHERE uar.app = 'back-office';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating product notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_product_approval_notification ON products;
CREATE TRIGGER trg_product_approval_notification
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION notify_admin_product_approval();

COMMENT ON FUNCTION notify_admin_product_approval() IS
'Notifie les admins back-office quand un produit est soumis pour approbation';

-- ============================================
-- TRIGGER 3: Notification pour Organisations en Validation
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_organisation_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement pour les nouvelles organisations en pending_validation
  IF NEW.approval_status = 'pending_validation' THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url)
    SELECT u.id, 'business', 'important',
           'Nouvelle organisation à valider',
           'Organisation "' || COALESCE(NEW.trade_name, NEW.legal_name) || '" en attente de validation.',
           '/canaux-vente/linkme/approbations?tab=organisations'
    FROM auth.users u
    JOIN user_app_roles uar ON uar.user_id = u.id
    WHERE uar.app = 'back-office';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating organisation notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_organisation_approval_notification ON organisations;
CREATE TRIGGER trg_organisation_approval_notification
AFTER INSERT ON organisations
FOR EACH ROW
EXECUTE FUNCTION notify_admin_organisation_approval();

COMMENT ON FUNCTION notify_admin_organisation_approval() IS
'Notifie les admins back-office quand une organisation est créée en attente de validation';

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_notify_affiliate_order ON sales_orders;
-- DROP TRIGGER IF EXISTS trg_product_approval_notification ON products;
-- DROP TRIGGER IF EXISTS trg_organisation_approval_notification ON organisations;
-- DROP FUNCTION IF EXISTS notify_admin_affiliate_order();
-- DROP FUNCTION IF EXISTS notify_admin_product_approval();
-- DROP FUNCTION IF EXISTS notify_admin_organisation_approval();

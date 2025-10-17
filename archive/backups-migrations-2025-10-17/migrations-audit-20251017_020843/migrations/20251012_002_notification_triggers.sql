-- Migration: Notification Triggers Phase 2 - Événements Critiques
-- Date: 2025-10-12
-- Description: Implémentation des triggers automatiques pour notifications temps réel
--              (Stock Critique, Validation Commande, Paiement Reçu)

-- =============================================================================
-- FONCTION HELPER: Créer notification pour tous les owners
-- =============================================================================

CREATE OR REPLACE FUNCTION create_notification_for_owners(
  p_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_record RECORD;
  v_notification_count INT := 0;
BEGIN
  -- Boucle sur tous les users avec role 'owner'
  FOR v_owner_record IN
    SELECT user_id
    FROM user_profiles
    WHERE role = 'owner'
  LOOP
    -- Créer une notification pour cet owner
    INSERT INTO notifications (
      type,
      severity,
      title,
      message,
      action_url,
      action_label,
      user_id,
      read
    ) VALUES (
      p_type,
      p_severity,
      p_title,
      p_message,
      p_action_url,
      p_action_label,
      v_owner_record.user_id,
      false
    );

    v_notification_count := v_notification_count + 1;
  END LOOP;

  RETURN v_notification_count;
END;
$$;

COMMENT ON FUNCTION create_notification_for_owners IS
'Crée une notification pour tous les utilisateurs avec rôle owner. Retourne le nombre de notifications créées.';


-- =============================================================================
-- TRIGGER 1: STOCK CRITIQUE (stock_quantity < min_stock)
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  -- Vérifier si le stock est passé sous le seuil min_stock
  IF NEW.stock_quantity IS NOT NULL
     AND NEW.min_stock IS NOT NULL
     AND NEW.stock_quantity < NEW.min_stock
     AND (OLD.stock_quantity IS NULL OR OLD.stock_quantity >= OLD.min_stock)
  THEN
    -- Créer notification pour tous les owners
    SELECT create_notification_for_owners(
      'business',
      'urgent',
      '🚨 Stock Critique',
      'Stock épuisé : ' || NEW.name || ' (' || NEW.stock_quantity || ' unités restantes, seuil min: ' || NEW.min_stock || ')',
      '/stocks/inventaire',
      'Réapprovisionner'
    ) INTO v_notification_count;

    RAISE NOTICE 'Stock alert: % notifications créées pour le produit %', v_notification_count, NEW.name;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_stock_alert_notification ON products;
CREATE TRIGGER trigger_stock_alert_notification
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_stock_alert();

COMMENT ON FUNCTION notify_stock_alert IS
'Trigger function: Crée une notification quand stock_quantity passe sous min_stock';


-- =============================================================================
-- TRIGGER 2: VALIDATION COMMANDE (draft → confirmed)
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  -- Vérifier si la commande vient d'être confirmée
  IF NEW.status::TEXT = 'confirmed' AND OLD.status::TEXT = 'draft' THEN
    -- Créer notification pour tous les owners
    SELECT create_notification_for_owners(
      'business',
      'important',
      '✅ Commande Validée',
      'La commande ' || NEW.order_number || ' a été validée avec succès.',
      '/commandes/clients',
      'Voir Détails'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order confirmed: % notifications créées pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_order_confirmed_notification ON sales_orders;
CREATE TRIGGER trigger_order_confirmed_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_confirmed();

COMMENT ON FUNCTION notify_order_confirmed IS
'Trigger function: Crée une notification quand une commande passe de draft à confirmed';


-- =============================================================================
-- TRIGGER 3: PAIEMENT REÇU (payment_status → paid)
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  -- Vérifier si le paiement vient d'être marqué comme payé
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'paid') THEN
    -- Créer notification pour tous les owners
    SELECT create_notification_for_owners(
      'operations',
      'important',
      '💰 Paiement Reçu',
      'Paiement de ' || ROUND(NEW.total_ttc, 2)::TEXT || '€ reçu pour la commande ' || NEW.order_number || '.',
      '/commandes/clients',
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'Payment received: % notifications créées pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_payment_received_notification ON sales_orders;
CREATE TRIGGER trigger_payment_received_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

COMMENT ON FUNCTION notify_payment_received IS
'Trigger function: Crée une notification quand payment_status passe à paid';


-- =============================================================================
-- ROLLBACK (pour tests uniquement)
-- =============================================================================

-- Pour supprimer tous les triggers et functions créés:
/*
DROP TRIGGER IF EXISTS trigger_stock_alert_notification ON products;
DROP TRIGGER IF EXISTS trigger_order_confirmed_notification ON sales_orders;
DROP TRIGGER IF EXISTS trigger_payment_received_notification ON sales_orders;

DROP FUNCTION IF EXISTS notify_stock_alert();
DROP FUNCTION IF EXISTS notify_order_confirmed();
DROP FUNCTION IF EXISTS notify_payment_received();
DROP FUNCTION IF EXISTS create_notification_for_owners(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
*/

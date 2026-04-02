-- ============================================================
-- Migration: Liens directs dans les notifications
-- Les triggers incluent maintenant l'ID de l'entite dans action_url
-- Ex: /commandes/clients?id=<order_uuid> au lieu de /commandes/clients
-- ============================================================

-- 1. Commande validee → /commandes/clients?id=ORDER_ID
CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'validated' AND OLD.status::TEXT <> 'validated' THEN
    SELECT create_notification_for_owners(
      'business', 'important',
      'Commande validée',
      'La commande ' || NEW.order_number || ' a été validée.',
      '/commandes/clients?id=' || NEW.id::TEXT, 'Voir Détails'
    ) INTO v_notification_count;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Commande annulee → /commandes/clients?id=ORDER_ID
CREATE OR REPLACE FUNCTION notify_order_cancelled()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'cancelled' AND OLD.status::TEXT <> 'cancelled' THEN
    SELECT create_notification_for_owners(
      'business', 'important',
      'Commande annulée',
      'La commande ' || NEW.order_number || ' a été annulée.',
      '/commandes/clients?id=' || NEW.id::TEXT, 'Voir Détails'
    ) INTO v_notification_count;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Paiement recu → /commandes/clients?id=ORDER_ID
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_notification_count INT;
BEGIN
  IF NEW.payment_status_v2 = 'paid' AND (OLD.payment_status_v2 IS NULL OR OLD.payment_status_v2 <> 'paid') THEN
    SELECT create_notification_for_owners(
      'operations', 'important',
      'Paiement reçu',
      'Paiement de ' || ROUND(NEW.total_ttc, 2)::TEXT || ' EUR reçu pour la commande ' || NEW.order_number || '.',
      '/commandes/clients?id=' || NEW.id::TEXT, 'Voir Commande'
    ) INTO v_notification_count;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Commande expediee → /stocks/expeditions?order=ORDER_ID
CREATE OR REPLACE FUNCTION notify_order_shipped()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'shipped' AND OLD.status::TEXT <> 'shipped' THEN
    SELECT create_notification_for_owners(
      'operations', 'info',
      'Commande expédiée',
      'La commande ' || NEW.order_number || ' a été expédiée avec succès.',
      '/stocks/expeditions?order=' || NEW.id::TEXT, 'Voir Expédition'
    ) INTO v_notification_count;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Expedition partielle → /stocks/expeditions?order=ORDER_ID
CREATE OR REPLACE FUNCTION notify_so_partial_shipped()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'partially_shipped' AND OLD.status::TEXT <> 'partially_shipped' THEN
    SELECT create_notification_for_owners(
      'operations', 'info',
      'Expédition partielle',
      'Expédition partielle pour la commande client ' || NEW.order_number || '.',
      '/stocks/expeditions?order=' || NEW.id::TEXT, 'Voir Expédition'
    ) INTO v_notification_count;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Commande en retard → /commandes/clients?id=ORDER_ID
CREATE OR REPLACE FUNCTION notify_so_delayed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'delayed' AND OLD.status::TEXT <> 'delayed' THEN
    SELECT create_notification_for_owners(
      'operations', 'important',
      'Commande en retard',
      'La commande ' || NEW.order_number || ' est en retard.',
      '/commandes/clients?id=' || NEW.id::TEXT, 'Voir Détails'
    ) INTO v_notification_count;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Corriger les notifications existantes
-- Commandes → lien direct avec ID
UPDATE notifications n
SET action_url = '/commandes/clients?id=' || so.id::TEXT
FROM sales_orders so
WHERE n.message LIKE '%' || so.order_number || '%'
  AND n.title IN ('Commande validée', 'Commande annulée', 'Paiement reçu', 'Commande en retard')
  AND n.action_url = '/commandes/clients';

-- Expeditions → lien direct avec ID
UPDATE notifications n
SET action_url = '/stocks/expeditions?order=' || so.id::TEXT
FROM sales_orders so
WHERE n.message LIKE '%' || so.order_number || '%'
  AND n.title IN ('Commande expédiée', 'Expédition partielle')
  AND n.action_url = '/stocks/expeditions';

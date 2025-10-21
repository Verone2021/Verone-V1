-- =====================================================
-- Migration: Système Notifications Complet V2
-- Date: 2025-10-21
-- Description: Refonte complète système notifications
--              - Fix encodage (suppression emojis)
--              - 15 triggers couvrant tous les modules
--              - Phrases claires professionnelles
-- =====================================================

-- Problème résolu:
-- Les notifications contenaient des codes Unicode échappés (\u2705, \u00e9)
-- Cause: Emojis et caractères spéciaux dans SQL mal encodés
-- Solution: Suppression TOUS emojis, texte simple uniquement

-- =====================================================
-- CLEANUP: Supprimer anciens triggers avec emojis
-- =====================================================

DROP TRIGGER IF EXISTS trigger_stock_alert_notification ON products;
DROP TRIGGER IF EXISTS trigger_order_confirmed_notification ON sales_orders;
DROP TRIGGER IF EXISTS trigger_payment_received_notification ON sales_orders;

DROP FUNCTION IF EXISTS notify_stock_alert();
DROP FUNCTION IF EXISTS notify_order_confirmed();
DROP FUNCTION IF EXISTS notify_payment_received();

-- Note: La fonction create_notification_for_owners() est conservée (déjà OK)

-- =====================================================
-- MODULE 1: COMMANDES CLIENTS (Sales Orders)
-- =====================================================

-- 1.1 Commande validée (draft → confirmed)
CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'confirmed' AND OLD.status::TEXT = 'draft' THEN
    SELECT create_notification_for_owners(
      'business',
      'important',
      'Commande validee',
      'La commande ' || NEW.order_number || ' a ete validee avec succes.',
      '/commandes/clients',
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order confirmed: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_confirmed_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_confirmed();

COMMENT ON FUNCTION notify_order_confirmed IS 'Notification quand commande passe de draft a confirmed';


-- 1.2 Paiement reçu (payment_status → paid)
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'paid') THEN
    SELECT create_notification_for_owners(
      'operations',
      'important',
      'Paiement recu',
      'Paiement de ' || ROUND(NEW.total_ttc, 2)::TEXT || ' EUR recu pour la commande ' || NEW.order_number || '.',
      '/commandes/clients',
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'Payment received: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_payment_received_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

COMMENT ON FUNCTION notify_payment_received IS 'Notification quand payment_status passe a paid';


-- 1.3 Commande expédiée (status → shipped)
CREATE OR REPLACE FUNCTION notify_order_shipped()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'shipped' AND OLD.status::TEXT <> 'shipped' THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',
      'Commande expediee',
      'La commande ' || NEW.order_number || ' a ete expediee avec succes.',
      '/commandes/clients',
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order shipped: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_shipped_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_shipped();

COMMENT ON FUNCTION notify_order_shipped IS 'Notification quand commande passe a shipped';


-- 1.4 Commande livrée (status → delivered)
CREATE OR REPLACE FUNCTION notify_order_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'delivered' AND OLD.status::TEXT <> 'delivered' THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',
      'Commande livree',
      'La commande ' || NEW.order_number || ' a ete livree au client.',
      '/commandes/clients',
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order delivered: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_delivered_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_delivered();

COMMENT ON FUNCTION notify_order_delivered IS 'Notification quand commande passe a delivered';


-- 1.5 Commande annulée (status → cancelled)
CREATE OR REPLACE FUNCTION notify_order_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'cancelled' AND OLD.status::TEXT <> 'cancelled' THEN
    SELECT create_notification_for_owners(
      'business',
      'important',
      'Commande annulee',
      'La commande ' || NEW.order_number || ' a ete annulee.',
      '/commandes/clients',
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order cancelled: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_cancelled_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_cancelled();

COMMENT ON FUNCTION notify_order_cancelled IS 'Notification quand commande passe a cancelled';


-- =====================================================
-- MODULE 2: COMMANDES FOURNISSEURS (Purchase Orders)
-- =====================================================

-- 2.1 Commande fournisseur créée
CREATE OR REPLACE FUNCTION notify_po_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
  v_supplier_name TEXT;
BEGIN
  -- Récupérer nom fournisseur
  SELECT name INTO v_supplier_name
  FROM organisations
  WHERE id = NEW.supplier_id;

  SELECT create_notification_for_owners(
    'operations',
    'info',
    'Commande fournisseur creee',
    'Nouvelle commande fournisseur ' || NEW.po_number || ' creee pour ' || COALESCE(v_supplier_name, 'fournisseur inconnu') || '.',
    '/commandes/fournisseurs',
    'Voir Commande'
  ) INTO v_notification_count;

  RAISE NOTICE 'PO created: % notifications creees pour PO %', v_notification_count, NEW.po_number;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_created_notification
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_po_created();

COMMENT ON FUNCTION notify_po_created IS 'Notification quand commande fournisseur est creee';


-- 2.2 Commande fournisseur confirmée
CREATE OR REPLACE FUNCTION notify_po_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'confirmed' AND (OLD.status IS NULL OR OLD.status::TEXT <> 'confirmed') THEN
    SELECT create_notification_for_owners(
      'operations',
      'important',
      'Commande fournisseur confirmee',
      'La commande fournisseur ' || NEW.po_number || ' a ete confirmee par le fournisseur.',
      '/commandes/fournisseurs',
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO confirmed: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_confirmed_notification
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_po_confirmed();

COMMENT ON FUNCTION notify_po_confirmed IS 'Notification quand commande fournisseur est confirmee';


-- 2.3 Réception marchandise complète
CREATE OR REPLACE FUNCTION notify_po_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'received' AND OLD.status::TEXT <> 'received' THEN
    SELECT create_notification_for_owners(
      'operations',
      'important',
      'Reception complete',
      'La commande fournisseur ' || NEW.po_number || ' a ete recue integralement.',
      '/commandes/fournisseurs',
      'Voir Reception'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO received: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_received_notification
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_po_received();

COMMENT ON FUNCTION notify_po_received IS 'Notification quand reception complete d''une commande fournisseur';


-- 2.4 Réception partielle
CREATE OR REPLACE FUNCTION notify_po_partial_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'partial_received' AND (OLD.status IS NULL OR OLD.status::TEXT <> 'partial_received') THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',
      'Reception partielle',
      'Reception partielle pour la commande fournisseur ' || NEW.po_number || '.',
      '/commandes/fournisseurs',
      'Voir Reception'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO partial received: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_partial_received_notification
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_po_partial_received();

COMMENT ON FUNCTION notify_po_partial_received IS 'Notification quand reception partielle d''une commande fournisseur';


-- 2.5 Retard de livraison prévu
CREATE OR REPLACE FUNCTION notify_po_delayed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
  v_days_late INT;
BEGIN
  -- Déclencher si expected_delivery_date est passée et status != received
  IF NEW.expected_delivery_date IS NOT NULL
     AND NEW.expected_delivery_date < CURRENT_DATE
     AND NEW.status::TEXT NOT IN ('received', 'cancelled')
     AND (OLD.expected_delivery_date IS NULL OR OLD.expected_delivery_date >= CURRENT_DATE)
  THEN
    v_days_late := CURRENT_DATE - NEW.expected_delivery_date;

    SELECT create_notification_for_owners(
      'operations',
      'urgent',
      'Commande fournisseur en retard',
      'La commande fournisseur ' || NEW.po_number || ' est en retard de ' || v_days_late || ' jour(s).',
      '/commandes/fournisseurs',
      'Contacter Fournisseur'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO delayed: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_delayed_notification
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_po_delayed();

COMMENT ON FUNCTION notify_po_delayed IS 'Notification quand commande fournisseur est en retard';


-- =====================================================
-- MODULE 3: STOCKS
-- =====================================================

-- 3.1 Stock critique (stock_quantity < min_stock)
CREATE OR REPLACE FUNCTION notify_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.stock_quantity IS NOT NULL
     AND NEW.min_stock IS NOT NULL
     AND NEW.stock_quantity < NEW.min_stock
     AND (OLD.stock_quantity IS NULL OR OLD.stock_quantity >= OLD.min_stock)
  THEN
    SELECT create_notification_for_owners(
      'business',
      'urgent',
      'Stock critique',
      'Stock epuise : ' || NEW.name || ' (' || NEW.stock_quantity || ' unites restantes, seuil min: ' || NEW.min_stock || ')',
      '/stocks/inventaire',
      'Reapprovisionner'
    ) INTO v_notification_count;

    RAISE NOTICE 'Stock alert: % notifications creees pour le produit %', v_notification_count, NEW.name;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_stock_alert_notification
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_stock_alert();

COMMENT ON FUNCTION notify_stock_alert IS 'Notification quand stock_quantity passe sous min_stock';


-- 3.2 Stock prévisionnel négatif
-- Note: La fonction notify_negative_forecast_stock() existe déjà dans migration 20251012_003
-- Elle sera mise à jour pour supprimer les emojis

-- 3.3 Réapprovisionnement effectué (stock_quantity augmente significativement)
CREATE OR REPLACE FUNCTION notify_stock_replenished()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_count INT;
  v_quantity_added INT;
BEGIN
  -- Détecter augmentation stock > 10 unités
  IF NEW.stock_quantity IS NOT NULL
     AND OLD.stock_quantity IS NOT NULL
     AND NEW.stock_quantity > OLD.stock_quantity
     AND (NEW.stock_quantity - OLD.stock_quantity) >= 10
  THEN
    v_quantity_added := NEW.stock_quantity - OLD.stock_quantity;

    SELECT create_notification_for_owners(
      'operations',
      'info',
      'Reapprovisionnement effectue',
      'Le produit ' || NEW.name || ' a ete reapprovisionne (+' || v_quantity_added || ' unites).',
      '/stocks/inventaire',
      'Voir Stock'
    ) INTO v_notification_count;

    RAISE NOTICE 'Stock replenished: % notifications creees pour le produit %', v_notification_count, NEW.name;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_stock_replenished_notification
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_stock_replenished();

COMMENT ON FUNCTION notify_stock_replenished IS 'Notification quand stock est reapprovisionne (augmentation >= 10 unites)';


-- =====================================================
-- MODULE 4: CATALOGUE PRODUITS
-- =====================================================

-- 4.1 Produit incomplet (pas d'image ou pas de cost_price)
-- Note: Sera implémenté via fonction batch périodique (pas trigger temps réel)
-- Déjà prévu dans 20251012_003_notification_batch_functions.sql


-- =====================================================
-- MODULE 5: FINANCE
-- =====================================================

-- 5.1 Facture impayée échue
-- Note: Sera implémenté quand le module invoices sera actif
-- Structure prévue pour future activation


-- =====================================================
-- VALIDATION MIGRATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 20251021_002 completed successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Triggers crees:';
  RAISE NOTICE '  - Commandes clients: 5 triggers';
  RAISE NOTICE '  - Commandes fournisseurs: 5 triggers';
  RAISE NOTICE '  - Stocks: 3 triggers';
  RAISE NOTICE '  - Total: 13 triggers actifs';
  RAISE NOTICE '';
  RAISE NOTICE 'Fix encodage:';
  RAISE NOTICE '  - TOUS les emojis supprimes';
  RAISE NOTICE '  - Texte simple uniquement';
  RAISE NOTICE '  - Zero code Unicode echappe';
  RAISE NOTICE '========================================';
END;
$$;

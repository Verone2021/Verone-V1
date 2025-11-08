-- Migration: Fix notification severity values to match DB constraint
-- Date: 2025-10-30
-- Author: Claude Code
-- Description:
--   Fix bug in migration 20251030_002 - severity values used don't match
--   the DB constraint CHECK (severity IN ('urgent', 'important', 'info')).
--
--   Mapping:
--   - 'success' → 'info' (positive notifications)
--   - 'warning' → 'important' (attention required)
--   - 'critical' → 'urgent' (urgent action)

-- =============================================================================
-- 1. PURCHASE ORDERS - Commandes Fournisseurs
-- =============================================================================

-- 1.5 notify_po_received - Réception complète commande fournisseur
CREATE OR REPLACE FUNCTION public.notify_po_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'received' AND OLD.status::TEXT != 'received' THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',  -- ✅ FIX: 'success' → 'info'
      'Commande recue',
      'La commande fournisseur ' || NEW.po_number || ' a ete entierement recue.',
      '/commandes/fournisseurs?id=' || NEW.id,
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO received: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2.4 notify_order_delivered - Livraison commande client
CREATE OR REPLACE FUNCTION public.notify_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'delivered' AND OLD.status::TEXT != 'delivered' THEN
    SELECT create_notification_for_owners(
      'business',
      'info',  -- ✅ FIX: 'success' → 'info'
      'Commande livree',
      'La commande ' || NEW.order_number || ' a ete livree avec succes.',
      '/commandes/clients?id=' || NEW.id,
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order delivered: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2.5 notify_payment_received - Paiement reçu commande client
CREATE OR REPLACE FUNCTION public.notify_payment_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'paid' AND OLD.status::TEXT != 'paid' THEN
    SELECT create_notification_for_owners(
      'business',
      'info',  -- ✅ FIX: 'success' → 'info'
      'Paiement recu',
      'Le paiement de la commande ' || NEW.order_number || ' a ete recu.',
      '/commandes/clients?id=' || NEW.id,
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'Payment received: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2.2 notify_order_cancelled - Annulation commande client
CREATE OR REPLACE FUNCTION public.notify_order_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'cancelled' AND OLD.status::TEXT != 'cancelled' THEN
    SELECT create_notification_for_owners(
      'business',
      'important',  -- ✅ FIX: 'warning' → 'important'
      'Commande annulee',
      'La commande ' || NEW.order_number || ' a ete annulee.',
      '/commandes/clients?id=' || NEW.id,
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order cancelled: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 1.3 notify_po_delayed - Commande fournisseur en retard
CREATE OR REPLACE FUNCTION public.notify_po_delayed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.expected_delivery_date < CURRENT_DATE AND NEW.status::TEXT NOT IN ('received', 'cancelled') THEN
    SELECT create_notification_for_owners(
      'operations',
      'important',  -- ✅ FIX: 'warning' → 'important'
      'Commande fournisseur en retard',
      'La commande ' || NEW.po_number || ' est en retard de ' || (CURRENT_DATE - NEW.expected_delivery_date) || ' jour(s).',
      '/commandes/fournisseurs?id=' || NEW.id,
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO delayed: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3.1 notify_stock_alert - Stock critique
CREATE OR REPLACE FUNCTION public.notify_stock_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.stock_quantity <= NEW.min_stock AND (OLD.stock_quantity IS NULL OR OLD.stock_quantity > OLD.min_stock) THEN
    SELECT create_notification_for_owners(
      'operations',
      'urgent',  -- ✅ FIX: 'critical' → 'urgent'
      'Stock critique',
      'Le produit ' || NEW.name || ' (SKU: ' || NEW.sku || ') a atteint le seuil critique de stock.',
      '/stocks/inventaire?id=' || NEW.id,
      'Voir Stock'
    ) INTO v_notification_count;

    RAISE NOTICE 'Stock alert: % notifications creees pour produit % (SKU: %)', v_notification_count, NEW.name, NEW.sku;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3.2 notify_stock_replenished - Stock réapprovisionné
CREATE OR REPLACE FUNCTION public.notify_stock_replenished()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.stock_quantity > NEW.min_stock AND OLD.stock_quantity <= OLD.min_stock THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',  -- ✅ FIX: 'success' → 'info'
      'Stock reapprovisionne',
      'Le produit ' || NEW.name || ' (SKU: ' || NEW.sku || ') a ete reapprovisionne.',
      '/stocks/inventaire?id=' || NEW.id,
      'Voir Stock'
    ) INTO v_notification_count;

    RAISE NOTICE 'Stock replenished: % notifications creees pour produit % (SKU: %)', v_notification_count, NEW.name, NEW.sku;
  END IF;

  RETURN NEW;
END;
$function$;

-- =============================================================================
-- COMMENTAIRES FINAUX
-- =============================================================================

COMMENT ON FUNCTION notify_po_received IS
'✅ FIX 2025-10-30 severity: success → info pour respecter contrainte DB';

COMMENT ON FUNCTION notify_order_delivered IS
'✅ FIX 2025-10-30 severity: success → info pour respecter contrainte DB';

COMMENT ON FUNCTION notify_payment_received IS
'✅ FIX 2025-10-30 severity: success → info pour respecter contrainte DB';

COMMENT ON FUNCTION notify_order_cancelled IS
'✅ FIX 2025-10-30 severity: warning → important pour respecter contrainte DB';

COMMENT ON FUNCTION notify_po_delayed IS
'✅ FIX 2025-10-30 severity: warning → important pour respecter contrainte DB';

COMMENT ON FUNCTION notify_stock_alert IS
'✅ FIX 2025-10-30 severity: critical → urgent pour respecter contrainte DB';

COMMENT ON FUNCTION notify_stock_replenished IS
'✅ FIX 2025-10-30 severity: success → info pour respecter contrainte DB';

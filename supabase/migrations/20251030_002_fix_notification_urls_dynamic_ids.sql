-- Migration: Fix notification URLs to include dynamic IDs (?id=X)
-- Date: 2025-10-30
-- Author: Claude Code
-- Description:
--   Modifie toutes les fonctions notify_* pour générer des URLs dynamiques
--   avec le paramètre ?id=X permettant l'ouverture automatique des modals.
--   Correction du bug reporté où les notifications renvoyaient vers des pages
--   générales au lieu des détails spécifiques.

-- =============================================================================
-- 1. PURCHASE ORDERS - Commandes Fournisseurs
-- =============================================================================

-- 1.1 notify_po_created - Création commande fournisseur
CREATE OR REPLACE FUNCTION public.notify_po_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
  v_supplier_name TEXT;
BEGIN
  -- Récupérer nom fournisseur (trade_name prioritaire, sinon legal_name)
  SELECT COALESCE(trade_name, legal_name) INTO v_supplier_name
  FROM organisations
  WHERE id = NEW.supplier_id;

  SELECT create_notification_for_owners(
    'operations',
    'info',
    'Commande fournisseur creee',
    'Nouvelle commande fournisseur ' || NEW.po_number || ' creee pour ' || COALESCE(v_supplier_name, 'fournisseur inconnu') || '.',
    '/commandes/fournisseurs?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
    'Voir Commande'
  ) INTO v_notification_count;

  RAISE NOTICE 'PO created: % notifications creees pour PO %', v_notification_count, NEW.po_number;

  RETURN NEW;
END;
$function$;

-- 1.2 notify_po_confirmed - Confirmation commande fournisseur
CREATE OR REPLACE FUNCTION public.notify_po_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'confirmed' AND OLD.status::TEXT = 'draft' THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',
      'Commande fournisseur confirmee',
      'La commande fournisseur ' || NEW.po_number || ' a ete confirmee.',
      '/commandes/fournisseurs?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO confirmed: % notifications creees pour PO %', v_notification_count, NEW.po_number;
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
      'warning',
      'Commande fournisseur en retard',
      'La commande ' || NEW.po_number || ' est en retard de ' || (CURRENT_DATE - NEW.expected_delivery_date) || ' jour(s).',
      '/commandes/fournisseurs?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO delayed: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 1.4 notify_po_partial_received - Réception partielle commande fournisseur
CREATE OR REPLACE FUNCTION public.notify_po_partial_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'partially_received' AND OLD.status::TEXT != 'partially_received' THEN
    SELECT create_notification_for_owners(
      'operations',
      'info',
      'Reception partielle',
      'La commande ' || NEW.po_number || ' a ete partiellement recue.',
      '/commandes/fournisseurs?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO partial received: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$function$;

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
      'success',
      'Commande recue',
      'La commande fournisseur ' || NEW.po_number || ' a ete entierement recue.',
      '/commandes/fournisseurs?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'PO received: % notifications creees pour PO %', v_notification_count, NEW.po_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- =============================================================================
-- 2. SALES ORDERS - Commandes Clients
-- =============================================================================

-- 2.1 notify_order_confirmed - Confirmation commande client
CREATE OR REPLACE FUNCTION public.notify_order_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'confirmed' AND OLD.status::TEXT = 'draft' THEN
    SELECT create_notification_for_owners(
      'business',
      'important',
      'Commande validee',
      'La commande ' || NEW.order_number || ' a ete validee avec succes.',
      '/commandes/clients?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order confirmed: % notifications creees pour commande %', v_notification_count, NEW.order_number;
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
      'warning',
      'Commande annulee',
      'La commande ' || NEW.order_number || ' a ete annulee.',
      '/commandes/clients?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order cancelled: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2.3 notify_order_shipped - Expédition commande client
CREATE OR REPLACE FUNCTION public.notify_order_shipped()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.status::TEXT = 'shipped' AND OLD.status::TEXT != 'shipped' THEN
    SELECT create_notification_for_owners(
      'business',
      'info',
      'Commande expediee',
      'La commande ' || NEW.order_number || ' a ete expediee.',
      '/commandes/clients?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Suivre Expedition'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order shipped: % notifications creees pour commande %', v_notification_count, NEW.order_number;
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
      'success',
      'Commande livree',
      'La commande ' || NEW.order_number || ' a ete livree avec succes.',
      '/commandes/clients?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
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
      'success',
      'Paiement recu',
      'Le paiement de la commande ' || NEW.order_number || ' a ete recu.',
      '/commandes/clients?id=' || NEW.id,  -- ✅ URL DYNAMIQUE
      'Voir Commande'
    ) INTO v_notification_count;

    RAISE NOTICE 'Payment received: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- =============================================================================
-- 3. STOCK - Alertes stock
-- =============================================================================

-- 3.1 notify_stock_alert - Stock critique
-- Note: Ce trigger est attaché à products, donc NEW.id = product_id
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
      'critical',
      'Stock critique',
      'Le produit ' || NEW.name || ' (SKU: ' || NEW.sku || ') a atteint le seuil critique de stock.',
      '/stocks/inventaire?id=' || NEW.id,  -- ✅ URL DYNAMIQUE (product_id)
      'Voir Stock'
    ) INTO v_notification_count;

    RAISE NOTICE 'Stock alert: % notifications creees pour produit % (SKU: %)', v_notification_count, NEW.name, NEW.sku;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3.2 notify_stock_replenished - Stock réapprovisionné
-- Note: Ce trigger est attaché à products, donc NEW.id = product_id
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
      'success',
      'Stock reapprovisionne',
      'Le produit ' || NEW.name || ' (SKU: ' || NEW.sku || ') a ete reapprovisionne.',
      '/stocks/inventaire?id=' || NEW.id,  -- ✅ URL DYNAMIQUE (product_id)
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

COMMENT ON FUNCTION notify_po_created IS
'✅ FIX 2025-10-30: URL dynamique /commandes/fournisseurs?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_po_confirmed IS
'✅ FIX 2025-10-30: URL dynamique /commandes/fournisseurs?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_po_delayed IS
'✅ FIX 2025-10-30: URL dynamique /commandes/fournisseurs?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_po_partial_received IS
'✅ FIX 2025-10-30: URL dynamique /commandes/fournisseurs?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_po_received IS
'✅ FIX 2025-10-30: URL dynamique /commandes/fournisseurs?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_order_confirmed IS
'✅ FIX 2025-10-30: URL dynamique /commandes/clients?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_order_cancelled IS
'✅ FIX 2025-10-30: URL dynamique /commandes/clients?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_order_shipped IS
'✅ FIX 2025-10-30: URL dynamique /commandes/clients?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_order_delivered IS
'✅ FIX 2025-10-30: URL dynamique /commandes/clients?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_payment_received IS
'✅ FIX 2025-10-30: URL dynamique /commandes/clients?id=X pour auto-ouverture modal';

COMMENT ON FUNCTION notify_stock_alert IS
'✅ FIX 2025-10-30: URL dynamique /stocks/inventaire?id=X (product_id) pour auto-ouverture détail';

COMMENT ON FUNCTION notify_stock_replenished IS
'✅ FIX 2025-10-30: URL dynamique /stocks/inventaire?id=X (product_id) pour auto-ouverture détail';

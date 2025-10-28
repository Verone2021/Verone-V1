-- Migration: Fix trigger notify_po_created() - organisations.name n'existe plus
-- Date: 2025-10-26
-- Description: Remplace organisations.name par COALESCE(trade_name, legal_name)
--              suite à la migration 20251022_001 qui a renommé name → legal_name + trade_name

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
    '/commandes/fournisseurs',
    'Voir Commande'
  ) INTO v_notification_count;

  RAISE NOTICE 'PO created: % notifications creees pour PO %', v_notification_count, NEW.po_number;

  RETURN NEW;
END;
$function$;

-- Commentaire de documentation
COMMENT ON FUNCTION public.notify_po_created() IS
'Trigger appelé après insertion dans purchase_orders. Crée une notification pour les propriétaires.
FIX 2025-10-26: Remplace organisations.name (supprimée) par COALESCE(trade_name, legal_name).';

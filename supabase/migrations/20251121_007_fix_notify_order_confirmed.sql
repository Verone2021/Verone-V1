--
-- Migration: Corriger dernière fonction notify_order_confirmed utilisant 'confirmed' → 'validated'
-- Date: 2025-11-21
-- Raison: Finalisation TOTALE migration enums sales_order_status
--

-- ============================================================================
-- FUNCTION: notify_order_confirmed (TRIGGER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_order_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  -- ✅ FIX: Détecter transition 'draft' → 'validated' (pas 'confirmed')
  IF NEW.status::TEXT = 'validated' AND OLD.status::TEXT = 'draft' THEN
    SELECT create_notification_for_owners(
      'business',
      'important',
      'Commande validee',
      'La commande ' || NEW.order_number || ' a ete validee avec succes.',
      '/commandes/clients',
      'Voir Details'
    ) INTO v_notification_count;

    RAISE NOTICE 'Order validated: % notifications creees pour commande %', v_notification_count, NEW.order_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- Commentaire
-- ============================================================================

COMMENT ON FUNCTION public.notify_order_confirmed IS
'Trigger: Créer notification quand commande passe de draft → validated (ancien nom conservé pour compatibilité)';

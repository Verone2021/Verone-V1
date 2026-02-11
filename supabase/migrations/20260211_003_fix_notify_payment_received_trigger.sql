-- Fix: notify_payment_received() référençait payment_status (colonne supprimée)
-- Corrigé pour utiliser payment_status_v2
-- Bug découvert en tentant de changer le statut de F-25-050

CREATE OR REPLACE FUNCTION public.notify_payment_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_notification_count INT;
BEGIN
  IF NEW.payment_status_v2 = 'paid' AND (OLD.payment_status_v2 IS NULL OR OLD.payment_status_v2 <> 'paid') THEN
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
$function$;

-- Migration: notification in-app à l'affilié quand sa demande de paiement est soldée
--
-- Quand le statut d'une demande de paiement LinkMe passe à 'paid' (réglée intégralement),
-- on crée une notification dans la table `notifications` pour chaque utilisateur LinkMe
-- rattaché à l'affilié (via user_app_roles → enseigne_id / organisation_id).
-- L'email de confirmation est envoyé côté applicatif (route API Resend) — hors de ce trigger.

CREATE OR REPLACE FUNCTION notify_affiliate_payment_request_paid()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_aff linkme_affiliates%ROWTYPE;
  v_msg text;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    SELECT * INTO v_aff FROM linkme_affiliates WHERE id = NEW.affiliate_id;

    v_msg := 'Votre demande de paiement ' || NEW.request_number
             || ' (' || NEW.total_amount_ttc::text || ' € TTC) a été réglée'
             || COALESCE(' — réf. ' || NEW.payment_reference, '') || '.';

    INSERT INTO notifications (type, severity, title, message, action_url, action_label, user_id)
    SELECT
      'linkme_payment_paid',
      'success',
      'Versement effectué',
      v_msg,
      '/commissions/demandes/' || NEW.id,
      'Voir la demande',
      uar.user_id
    FROM user_app_roles uar
    WHERE uar.app = 'linkme'
      AND uar.is_active = true
      AND (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = v_aff.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = v_aff.organisation_id)
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_affiliate_payment_paid ON linkme_payment_requests;
CREATE TRIGGER trigger_notify_affiliate_payment_paid
  AFTER UPDATE ON linkme_payment_requests
  FOR EACH ROW EXECUTE FUNCTION notify_affiliate_payment_request_paid();

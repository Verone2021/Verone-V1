-- Migration: Trigger notifications pour transactions bancaires
-- Date: 2026-02-24
-- Objectif: Notifier le staff back-office lors de nouvelles transactions bancaires

-- Fonction trigger pour créer une notification sur INSERT de bank_transactions
CREATE OR REPLACE FUNCTION notify_new_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_severity TEXT := 'info';
BEGIN
  -- Transaction entrante (montant positif)
  IF NEW.amount > 0 THEN
    v_title := 'Paiement entrant';
    v_message := format(
      '+ %s € — %s',
      ROUND(ABS(NEW.amount)::NUMERIC, 2)::TEXT,
      COALESCE(NEW.label, NEW.counterparty_name, 'Transaction')
    );
  ELSE
    -- Transaction sortante (montant négatif ou nul)
    v_title := 'Paiement sortant';
    v_message := format(
      '- %s € — %s',
      ROUND(ABS(NEW.amount)::NUMERIC, 2)::TEXT,
      COALESCE(NEW.label, NEW.counterparty_name, 'Transaction')
    );
  END IF;

  -- Insérer notification pour tous les utilisateurs back-office actifs
  INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
  SELECT
    uar.user_id,
    'business',
    v_severity,
    v_title,
    v_message,
    '/finance/transactions',
    'Voir transactions'
  FROM user_app_roles uar
  WHERE uar.app = 'back-office'
    AND uar.is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Trigger sur INSERT de bank_transactions
DROP TRIGGER IF EXISTS trg_notify_bank_transaction ON bank_transactions;
CREATE TRIGGER trg_notify_bank_transaction
  AFTER INSERT ON bank_transactions
  FOR EACH ROW EXECUTE FUNCTION notify_new_bank_transaction();

-- Migration: Fix trigger bank transactions - dedup + enrichir message
-- Date: 2026-03-05
-- Objectif: Deduplication + date paiement + statut rapprochement + action_url avec ID
-- Fix: utiliser side='credit' au lieu de amount>0 (Qonto stocke tout en positif)

CREATE OR REPLACE FUNCTION notify_new_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_severity TEXT := 'info';
  v_action_url TEXT;
BEGIN
  -- CORRECT: utiliser side (pas amount) — Qonto stocke tout en positif
  IF NEW.side = 'credit' THEN
    v_title := 'Paiement entrant';
    v_message := format('+ %s E -- %s | %s',
      ROUND(NEW.amount::NUMERIC, 2)::TEXT,
      COALESCE(NEW.counterparty_name, NEW.label, 'Transaction'),
      TO_CHAR(COALESCE(NEW.settled_at, NEW.created_at), 'DD/MM/YYYY'));
  ELSE
    v_title := 'Paiement sortant';
    v_message := format('- %s E -- %s | %s',
      ROUND(NEW.amount::NUMERIC, 2)::TEXT,
      COALESCE(NEW.counterparty_name, NEW.label, 'Transaction'),
      TO_CHAR(COALESCE(NEW.settled_at, NEW.created_at), 'DD/MM/YYYY'));
  END IF;

  -- Statut rapprochement
  IF NEW.matching_status IN ('auto_matched', 'manual_matched') THEN
    v_message := v_message || ' | Rapproche';
  ELSE
    v_message := v_message || ' | Non rapproche';
  END IF;

  v_action_url := '/finance/transactions?transaction=' || NEW.id::TEXT;

  -- Deduplication : pas de notif si deja creee pour cette transaction (meme titre+message)
  INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
  SELECT uar.user_id, 'business', v_severity, v_title, v_message, v_action_url, 'Voir transaction'
  FROM user_app_roles uar
  WHERE uar.app = 'back-office' AND uar.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = uar.user_id AND n.title = v_title AND n.message = v_message
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- ============================================================================
-- Migration 1: Fix notify_admin_new_form_submission trigger
-- ============================================================================
-- Issue: The trigger references a non-existent 'data' column in notifications table
-- Fix: Remove 'data' column from INSERT and enrich the message instead
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_admin_new_form_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_type RECORD;
  v_enriched_message TEXT;
BEGIN
  -- Récupérer config du type de formulaire
  SELECT * INTO v_form_type
  FROM form_types
  WHERE code = NEW.form_type;

  -- Enrichir le message avec les informations clés
  v_enriched_message := format(
    '%s %s - %s | Email: %s | Tél: %s | Source: %s',
    NEW.first_name,
    NEW.last_name,
    COALESCE(NEW.company_name, 'Particulier'),
    NEW.email,
    COALESCE(NEW.phone, 'Non renseigné'),
    NEW.source
  );

  -- Créer notification pour tous les users back-office
  -- Note: Removed 'data' column as it doesn't exist in notifications table
  INSERT INTO notifications (user_id, type, severity, title, message, action_url)
  SELECT
    u.id,
    'business',
    CASE NEW.priority
      WHEN 'urgent' THEN 'urgent'
      WHEN 'high' THEN 'important'
      ELSE 'info'
    END,
    format('Nouveau: %s', v_form_type.label),
    v_enriched_message,
    '/prises-contact?id=' || NEW.id
  FROM auth.users u
  JOIN user_app_roles uar ON uar.user_id = u.id
  WHERE uar.app = 'back-office';

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_admin_new_form_submission IS 'Creates in-app notification for all back-office users when a new form submission is received (fixed: removed data column reference)';

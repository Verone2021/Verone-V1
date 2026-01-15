-- ============================================================================
-- Trigger 1: Notifier les admins back-office lors d'une nouvelle demande
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_admin_new_form_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_type RECORD;
BEGIN
  -- Récupérer config du type de formulaire
  SELECT * INTO v_form_type
  FROM form_types
  WHERE code = NEW.form_type;

  -- Créer notification pour tous les users back-office
  INSERT INTO notifications (user_id, type, severity, title, message, action_url, data)
  SELECT
    u.id,
    'business',
    CASE NEW.priority
      WHEN 'urgent' THEN 'urgent'
      WHEN 'high' THEN 'important'
      ELSE 'info'
    END,
    format('Nouveau: %s', v_form_type.label),
    format('%s %s (%s)', NEW.first_name, NEW.last_name, NEW.source),
    '/prises-contact?id=' || NEW.id,
    jsonb_build_object(
      'form_submission_id', NEW.id,
      'form_type', NEW.form_type,
      'source', NEW.source,
      'email', NEW.email
    )
  FROM auth.users u
  JOIN user_app_roles uar ON uar.user_id = u.id
  WHERE uar.app = 'back-office';

  RETURN NEW;
END;
$$;

-- Trigger sur INSERT de form_submissions
CREATE TRIGGER trg_notify_form_submission
AFTER INSERT ON form_submissions
FOR EACH ROW EXECUTE FUNCTION notify_admin_new_form_submission();

COMMENT ON FUNCTION notify_admin_new_form_submission IS 'Creates in-app notification for all back-office users when a new form submission is received';

-- ============================================================================
-- Trigger 2: Calculer SLA deadline automatiquement
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sla_hours INTEGER;
BEGIN
  -- Récupérer SLA du type de formulaire
  SELECT sla_hours INTO v_sla_hours
  FROM form_types
  WHERE code = NEW.form_type;

  -- Si SLA défini, calculer deadline
  IF v_sla_hours IS NOT NULL THEN
    -- Calculer deadline (simple: ajouter les heures)
    -- Note: Pour les heures ouvrées (lun-ven 9h-18h), il faudrait une logique plus complexe
    NEW.sla_deadline := NOW() + (v_sla_hours || ' hours')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger BEFORE INSERT pour calculer SLA
CREATE TRIGGER trg_calculate_sla
BEFORE INSERT ON form_submissions
FOR EACH ROW EXECUTE FUNCTION calculate_sla_deadline();

COMMENT ON FUNCTION calculate_sla_deadline IS 'Automatically calculates SLA deadline based on form type configuration';

-- ============================================================================
-- Trigger 3: Mettre à jour updated_at sur modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_form_submission_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_form_submission_timestamp
BEFORE UPDATE ON form_submissions
FOR EACH ROW EXECUTE FUNCTION update_form_submission_updated_at();

-- Même trigger pour form_types et app_settings
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_form_types_timestamp
BEFORE UPDATE ON form_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_app_settings_timestamp
BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

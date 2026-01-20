-- ============================================================================
-- Migration: Trigger notification changement contact facturation
-- Date: 2026-01-22
-- Contexte: Notifier les admins quand un contact facturation change
-- ============================================================================

-- ============================================================================
-- 1. FONCTION: Créer notification changement contact facturation
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_billing_contact_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_name TEXT;
  v_org_name TEXT;
  v_org_id UUID;
  v_enseigne_id UUID;
  v_admin_users UUID[];
  v_admin_id UUID;
  v_change_type TEXT;
  v_message TEXT;
BEGIN
  -- Déterminer le type de changement
  IF TG_OP = 'INSERT' AND NEW.is_billing_contact = true THEN
    v_change_type := 'nouveau';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Changement de is_billing_contact
    IF OLD.is_billing_contact = false AND NEW.is_billing_contact = true THEN
      v_change_type := 'ajouté';
    ELSIF OLD.is_billing_contact = true AND NEW.is_billing_contact = false THEN
      v_change_type := 'retiré';
    -- Changement d'email sur un contact facturation
    ELSIF NEW.is_billing_contact = true AND OLD.email != NEW.email THEN
      v_change_type := 'email_modifié';
    -- Changement de nom sur un contact facturation
    ELSIF NEW.is_billing_contact = true AND (OLD.first_name != NEW.first_name OR OLD.last_name != NEW.last_name) THEN
      v_change_type := 'nom_modifié';
    ELSE
      -- Pas de changement pertinent pour facturation
      RETURN NEW;
    END IF;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Récupérer le nom du contact
  v_contact_name := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '');

  -- Récupérer l'organisation et l'enseigne
  v_org_id := NEW.organisation_id;
  v_enseigne_id := NEW.enseigne_id;

  -- Récupérer le nom de l'organisation
  IF v_org_id IS NOT NULL THEN
    SELECT COALESCE(trade_name, legal_name) INTO v_org_name
    FROM organisations
    WHERE id = v_org_id;
  ELSIF v_enseigne_id IS NOT NULL THEN
    SELECT name INTO v_org_name
    FROM enseignes
    WHERE id = v_enseigne_id;
  ELSE
    v_org_name := 'Organisation inconnue';
  END IF;

  -- Construire le message selon le type de changement
  CASE v_change_type
    WHEN 'nouveau' THEN
      v_message := 'Nouveau contact facturation: ' || v_contact_name || ' pour ' || v_org_name;
    WHEN 'ajouté' THEN
      v_message := v_contact_name || ' est maintenant contact facturation pour ' || v_org_name;
    WHEN 'retiré' THEN
      v_message := v_contact_name || ' n''est plus contact facturation pour ' || v_org_name;
    WHEN 'email_modifié' THEN
      v_message := 'Email du contact facturation modifié: ' || OLD.email || ' → ' || NEW.email || ' (' || v_org_name || ')';
    WHEN 'nom_modifié' THEN
      v_message := 'Nom du contact facturation modifié: ' || OLD.first_name || ' ' || OLD.last_name || ' → ' || v_contact_name || ' (' || v_org_name || ')';
    ELSE
      v_message := 'Changement contact facturation pour ' || v_org_name;
  END CASE;

  -- Trouver les admins à notifier
  -- 1. Admins Vérone (back-office users avec rôle admin)
  SELECT ARRAY_AGG(DISTINCT auth_user_id)
  INTO v_admin_users
  FROM back_office_users
  WHERE role IN ('admin', 'super_admin')
    AND auth_user_id IS NOT NULL;

  -- 2. Si organisation liée à une enseigne, notifier aussi les admins enseigne (via linkme_affiliates)
  IF v_enseigne_id IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT la.user_id) || v_admin_users
    INTO v_admin_users
    FROM linkme_affiliates la
    WHERE la.enseigne_id = v_enseigne_id
      AND la.status = 'active'
      AND la.user_id IS NOT NULL;
  END IF;

  -- Créer les notifications pour chaque admin
  IF v_admin_users IS NOT NULL THEN
    FOREACH v_admin_id IN ARRAY v_admin_users
    LOOP
      IF v_admin_id IS NOT NULL THEN
        INSERT INTO notifications (
          user_id,
          type,
          severity,
          title,
          message,
          action_url,
          action_label,
          read,
          created_at
        ) VALUES (
          v_admin_id,
          'business',
          CASE
            WHEN v_change_type IN ('email_modifié', 'retiré') THEN 'important'
            ELSE 'info'
          END,
          'Contact facturation modifié',
          v_message,
          CASE
            WHEN v_org_id IS NOT NULL THEN '/contacts-organisations?id=' || v_org_id
            ELSE '/contacts-organisations'
          END,
          'Voir le contact',
          false,
          NOW()
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'opération
    RAISE WARNING 'Erreur notification contact facturation: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 2. TRIGGER: Sur INSERT et UPDATE de contacts
-- ============================================================================

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trg_notify_billing_contact_change ON contacts;

-- Créer le trigger
CREATE TRIGGER trg_notify_billing_contact_change
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW
  WHEN (
    -- INSERT avec is_billing_contact = true
    (pg_trigger_depth() = 0 AND NEW.is_billing_contact = true)
    OR
    -- UPDATE avec changement pertinent pour facturation
    (pg_trigger_depth() = 0 AND (
      -- Changement du flag is_billing_contact
      (TG_OP = 'UPDATE' AND OLD.is_billing_contact IS DISTINCT FROM NEW.is_billing_contact)
      OR
      -- Changement d'email sur un contact facturation
      (TG_OP = 'UPDATE' AND NEW.is_billing_contact = true AND OLD.email IS DISTINCT FROM NEW.email)
      OR
      -- Changement de nom sur un contact facturation
      (TG_OP = 'UPDATE' AND NEW.is_billing_contact = true AND (OLD.first_name IS DISTINCT FROM NEW.first_name OR OLD.last_name IS DISTINCT FROM NEW.last_name))
    ))
  )
  EXECUTE FUNCTION notify_billing_contact_change();

-- ============================================================================
-- 3. COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION notify_billing_contact_change() IS
'Crée une notification quand un contact facturation est ajouté, retiré ou modifié.
Notifie les admins back-office et les admins enseigne concernés.
Types de changements détectés:
- nouveau: INSERT avec is_billing_contact = true
- ajouté: UPDATE is_billing_contact false → true
- retiré: UPDATE is_billing_contact true → false
- email_modifié: changement email sur contact facturation
- nom_modifié: changement nom sur contact facturation';

COMMENT ON TRIGGER trg_notify_billing_contact_change ON contacts IS
'Trigger pour notifications automatiques lors de changements de contacts facturation';

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================

-- DROP TRIGGER IF EXISTS trg_notify_billing_contact_change ON contacts;
-- DROP FUNCTION IF EXISTS notify_billing_contact_change();

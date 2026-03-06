-- Fix: RETURN OLD → RETURN NEW dans prevent_last_owner_deletion_modern
-- Bug: RETURN OLD dans un BEFORE UPDATE annule silencieusement toutes les modifications
-- sur user_app_roles (désactivation, changement de rôle, etc.)
-- Impact: toutes les opérations UPDATE sur user_app_roles étaient silencieusement ignorées

CREATE OR REPLACE FUNCTION prevent_last_owner_deletion_modern()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Protéger le dernier owner back-office uniquement quand on le supprime ou désactive
  IF OLD.role = 'owner'
     AND OLD.app = 'back-office'
     AND OLD.is_active = true
     AND (TG_OP = 'DELETE' OR NEW.is_active = false)
     AND (SELECT count_active_owners()) = 1
  THEN
    RAISE EXCEPTION 'Impossible de supprimer le dernier owner du système';
  END IF;

  -- DELETE doit retourner OLD, UPDATE doit retourner NEW
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Migration: Corriger le système de rôles Owner/Admin
-- Date: 2026-02-06
-- Contexte: Migration de user_profiles.role vers user_app_roles
-- ============================================================================

-- ============================================================================
-- ÉTAPE 0 : MODIFIER la contrainte CHECK pour autoriser 'owner'
-- ============================================================================

ALTER TABLE user_app_roles DROP CONSTRAINT IF EXISTS valid_backoffice_role;

ALTER TABLE user_app_roles ADD CONSTRAINT valid_backoffice_role
  CHECK (
    app <> 'back-office'::app_type
    OR role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'user'::text])
  );

COMMENT ON CONSTRAINT valid_backoffice_role ON user_app_roles IS
  'Rôles valides pour back-office: owner, admin, manager, user';

-- ============================================================================
-- ÉTAPE 1 : Promouvoir Romeo → Owner
-- ============================================================================

UPDATE user_app_roles
SET role = 'owner'
WHERE user_id = '100d2439-0f52-46b1-9c30-ad7934b44719'
  AND app = 'back-office';

-- Vérifier : devrait retourner 1
DO $$
DECLARE
  owner_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO owner_count
  FROM user_app_roles
  WHERE app = 'back-office' AND role = 'owner';

  IF owner_count != 1 THEN
    RAISE EXCEPTION 'ERREUR: Nombre de owners = %, attendu 1', owner_count;
  END IF;

  RAISE NOTICE 'OK: 1 owner créé (Romeo)';
END $$;

-- ============================================================================
-- ÉTAPE 2 : Créer Fonctions Helper Modernes
-- ============================================================================

CREATE OR REPLACE FUNCTION is_back_office_owner()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role = 'owner'
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION is_back_office_owner() IS
  'Vérifie si l''utilisateur est owner du back-office (basé sur user_app_roles)';

CREATE OR REPLACE FUNCTION is_back_office_privileged()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION is_back_office_privileged() IS
  'Vérifie si l''utilisateur est owner OU admin du back-office';

CREATE OR REPLACE FUNCTION count_active_owners()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET row_security = off
AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_app_roles
  WHERE app = 'back-office'
    AND role = 'owner'
    AND is_active = true;
$$;

COMMENT ON FUNCTION count_active_owners() IS
  'Compte le nombre de owners actifs dans le back-office';

-- ============================================================================
-- ÉTAPE 3 : Protection Dernier Owner (Moderne)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_last_owner_role_change_modern()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
BEGIN
  -- Si on change le rôle d'owner vers autre chose
  IF OLD.role = 'owner'
     AND NEW.role != 'owner'
     AND OLD.app = 'back-office'
     AND (SELECT count_active_owners()) = 1
  THEN
    RAISE EXCEPTION 'Impossible de modifier le rôle du dernier owner du système';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION prevent_last_owner_role_change_modern() IS
  'Empêche de changer le rôle du dernier owner actif';

CREATE OR REPLACE FUNCTION prevent_last_owner_deletion_modern()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
BEGIN
  -- Si on supprime (ou désactive) le dernier owner
  IF OLD.role = 'owner'
     AND OLD.app = 'back-office'
     AND OLD.is_active = true
     AND (SELECT count_active_owners()) = 1
  THEN
    RAISE EXCEPTION 'Impossible de supprimer le dernier owner du système';
  END IF;

  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION prevent_last_owner_deletion_modern() IS
  'Empêche de supprimer ou désactiver le dernier owner actif';

DROP TRIGGER IF EXISTS prevent_last_owner_role_change_trigger ON user_app_roles;
CREATE TRIGGER prevent_last_owner_role_change_trigger
  BEFORE UPDATE ON user_app_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_role_change_modern();

DROP TRIGGER IF EXISTS prevent_last_owner_deletion_trigger ON user_app_roles;
CREATE TRIGGER prevent_last_owner_deletion_trigger
  BEFORE DELETE OR UPDATE ON user_app_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_deletion_modern();

-- ============================================================================
-- ÉTAPE 4 : SUPPRIMER Anciennes Fonctions Obsolètes
-- ============================================================================

DROP FUNCTION IF EXISTS is_owner() CASCADE;
DROP FUNCTION IF EXISTS is_current_user_owner() CASCADE;
DROP FUNCTION IF EXISTS count_owners() CASCADE;
DROP FUNCTION IF EXISTS prevent_last_owner_deletion() CASCADE;
DROP FUNCTION IF EXISTS prevent_last_owner_role_change() CASCADE;
DROP FUNCTION IF EXISTS create_notification_for_owners(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

DROP TRIGGER IF EXISTS trigger_prevent_last_owner_deletion ON user_profiles;
DROP TRIGGER IF EXISTS trigger_prevent_last_owner_role_change ON user_profiles;

-- ============================================================================
-- ÉTAPE 5 : Créer Policies RLS Owner-Specific
-- ============================================================================

DROP POLICY IF EXISTS "Back-office admins can delete roles" ON user_app_roles;
DROP POLICY IF EXISTS "Back-office admins can insert roles" ON user_app_roles;
DROP POLICY IF EXISTS "Back-office admins can view all roles" ON user_app_roles;
DROP POLICY IF EXISTS "backoffice_admin_manage_user_app_roles" ON user_app_roles;

CREATE POLICY "owner_insert_roles" ON user_app_roles
  FOR INSERT TO authenticated
  WITH CHECK (is_back_office_owner());

CREATE POLICY "owner_update_roles" ON user_app_roles
  FOR UPDATE TO authenticated
  USING (is_back_office_owner())
  WITH CHECK (is_back_office_owner());

CREATE POLICY "owner_delete_roles" ON user_app_roles
  FOR DELETE TO authenticated
  USING (is_back_office_owner());

CREATE POLICY "privileged_view_all_roles" ON user_app_roles
  FOR SELECT TO authenticated
  USING (is_back_office_privileged());

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  owner_count INTEGER;
  romeo_role TEXT;
BEGIN
  SELECT count_active_owners() INTO owner_count;

  SELECT role INTO romeo_role
  FROM user_app_roles
  WHERE user_id = '100d2439-0f52-46b1-9c30-ad7934b44719'
    AND app = 'back-office';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rôle de Romeo: %', romeo_role;
  RAISE NOTICE 'Nombre de owners actifs: %', owner_count;
  RAISE NOTICE 'Fonctions créées: is_back_office_owner(), is_back_office_privileged(), count_active_owners()';
  RAISE NOTICE 'Protections activées: trigger prevent_last_owner_role_change_trigger, prevent_last_owner_deletion_trigger';
  RAISE NOTICE 'Policies RLS mises à jour: owner CRUD complet, admin+owner lecture seule';
  RAISE NOTICE '========================================';
END $$;

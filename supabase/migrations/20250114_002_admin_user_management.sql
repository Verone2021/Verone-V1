-- =====================================================
-- Migration: Administration des utilisateurs
-- Date: 2025-01-14
-- Description: Ajout des politiques RLS pour permettre
--              aux owners de gérer les utilisateurs
-- =====================================================

-- Politique pour permettre aux owners de créer/modifier/supprimer des profils utilisateur
-- Cette politique remplace la politique existante "users_can_manage_own_profile"
DROP POLICY IF EXISTS "users_can_manage_own_profile" ON user_profiles;

-- Nouvelle politique : utilisateurs peuvent gérer leur propre profil
CREATE POLICY "users_can_manage_own_profile" ON user_profiles
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Nouvelle politique : owners peuvent gérer tous les profils utilisateur
CREATE POLICY "owners_can_manage_all_profiles" ON user_profiles
  FOR ALL USING (
    get_user_role() = 'owner'
  );

-- Politique pour permettre aux owners de voir les détails de tous les utilisateurs
-- (nécessaire pour l'interface d'administration)
CREATE POLICY "owners_can_view_all_user_details" ON user_profiles
  FOR SELECT USING (
    get_user_role() = 'owner'
  );

-- Fonction helper pour vérifier si un utilisateur est owner
-- Utilisée pour les Server Actions
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction helper pour compter le nombre d'owners
-- Utilisée pour empêcher la suppression du dernier owner
CREATE OR REPLACE FUNCTION count_owners()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM user_profiles WHERE role = 'owner'
$$ LANGUAGE SQL SECURITY DEFINER;

-- Trigger pour empêcher la suppression du dernier owner
CREATE OR REPLACE FUNCTION prevent_last_owner_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on supprime un owner et qu'il n'en reste qu'un, empêcher la suppression
  IF OLD.role = 'owner' AND (SELECT count_owners()) = 1 THEN
    RAISE EXCEPTION 'Impossible de supprimer le dernier propriétaire du système';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_owner_deletion
  BEFORE DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_deletion();

-- Trigger pour empêcher la modification du rôle du dernier owner
CREATE OR REPLACE FUNCTION prevent_last_owner_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on modifie le rôle d'un owner vers autre chose et qu'il n'en reste qu'un, empêcher la modification
  IF OLD.role = 'owner' AND NEW.role != 'owner' AND (SELECT count_owners()) = 1 THEN
    RAISE EXCEPTION 'Impossible de modifier le rôle du dernier propriétaire du système';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_owner_role_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_role_change();

-- Index pour optimiser les requêtes sur les rôles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_lookup
  ON user_profiles(role)
  WHERE role IN ('owner', 'admin');

-- Commentaires pour documentation
COMMENT ON FUNCTION is_owner() IS 'Vérifie si l''utilisateur actuel est un owner';
COMMENT ON FUNCTION count_owners() IS 'Compte le nombre d''owners dans le système';
COMMENT ON FUNCTION prevent_last_owner_deletion() IS 'Empêche la suppression du dernier owner';
COMMENT ON FUNCTION prevent_last_owner_role_change() IS 'Empêche la modification du rôle du dernier owner';

-- Test de validation des politiques
DO $$
BEGIN
  -- Vérifier que les nouvelles politiques sont bien créées
  PERFORM 1 FROM pg_policies
  WHERE tablename = 'user_profiles'
  AND policyname IN ('owners_can_manage_all_profiles', 'owners_can_view_all_user_details');

  RAISE NOTICE 'Migration completed successfully - Admin user management policies created';
END
$$;
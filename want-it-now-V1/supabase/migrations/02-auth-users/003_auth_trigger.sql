-- Migration 003: Synchronisation auth.users <-> public.utilisateurs
-- Création: 2025-01-09
-- Description: Triggers bidirectionnels entre auth.users et public.utilisateurs

-- Ajouter le super admin existant dans la table utilisateurs
INSERT INTO public.utilisateurs (id, email, role, nom, prenom, created_at, updated_at)
VALUES (
  '9ab3e5c6-06c9-42bf-806f-08c468cfde5c',
  'veronebyromeo@gmail.com',
  'super_admin',
  'Admin',
  'Super',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'super_admin',
  updated_at = now();

-- Fonction pour créer automatiquement un profil utilisateur après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Créer un profil dans public.utilisateurs lors de la création d'un compte auth
  INSERT INTO public.utilisateurs (
    id,
    email,
    role,
    organisation_id,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    (new.raw_user_meta_data->>'role')::varchar(50), -- Pas de rôle par défaut
    (new.raw_user_meta_data->>'organisation_id')::uuid, -- Organisation si fournie
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour supprimer le profil utilisateur lors de la suppression du compte auth
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.utilisateurs WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour supprimer le profil lors de la suppression du compte
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Fonction pour synchroniser les changements d'email
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.utilisateurs 
  SET 
    email = new.email,
    updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour synchroniser les changements d'email
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (old.email IS DISTINCT FROM new.email)
  EXECUTE FUNCTION public.handle_user_email_update();

-- Fonction pour créer un utilisateur auth quand un profil est créé manuellement
CREATE OR REPLACE FUNCTION public.handle_manual_user_creation()
RETURNS trigger AS $$
BEGIN
  -- Vérifier si l'utilisateur existe déjà dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
    -- Créer un compte temporaire dans auth.users (sera activé lors de la première connexion)
    -- Note: Cette fonction nécessite les privilèges appropriés
    RAISE NOTICE 'Utilisateur % créé manuellement, un compte Auth doit être créé via l''interface admin', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour notifier quand un utilisateur est créé manuellement
DROP TRIGGER IF EXISTS on_manual_user_created ON public.utilisateurs;
CREATE TRIGGER on_manual_user_created
  AFTER INSERT ON public.utilisateurs
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_manual_user_creation();

-- Note importante: Les comptes de test doivent être créés dans Supabase Auth Dashboard
-- avec les métadonnées appropriées puis les profils seront créés automatiquement

-- Informations des comptes à créer manuellement dans Supabase Auth:
-- 1. admin.test@wantitnow.com (password: TestAdmin123)
--    Métadonnées: {"role": "admin", "nom": "Test", "prenom": "Admin"}
--
-- 2. proprietaire.test@example.com (password: TestProp123) 
--    Métadonnées: {"role": "proprietaire", "nom": "Test", "prenom": "Propriétaire"}
--
-- 3. locataire.test@example.com (password: TestLoc123)
--    Métadonnées: {"role": "locataire", "nom": "Test", "prenom": "Locataire"}

-- Commentaires
COMMENT ON FUNCTION public.handle_new_user() IS 'Crée automatiquement un profil utilisateur lors de l''inscription';
COMMENT ON FUNCTION public.handle_user_delete() IS 'Supprime le profil utilisateur lors de la suppression du compte';
COMMENT ON FUNCTION public.handle_user_email_update() IS 'Synchronise les changements d''email entre auth et profil';

COMMENT ON FUNCTION public.handle_manual_user_creation() IS 'Notifie quand un utilisateur est créé manuellement sans compte Auth correspondant';
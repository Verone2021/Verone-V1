-- ============================================
-- Migration: RLS policies pour contacts (profil utilisateur LinkMe)
-- Date: 2025-12-18
-- Description: Permettre à un utilisateur LinkMe de lire/modifier son propre contact
-- ============================================

-- ============================================
-- PHASE 1: Activer RLS sur contacts (si pas déjà fait)
-- ============================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 2: Policies pour utilisateurs LinkMe
-- ============================================

-- Policy SELECT : User peut voir son propre contact (via email)
DROP POLICY IF EXISTS "linkme_users_can_view_own_contact" ON contacts;

CREATE POLICY "linkme_users_can_view_own_contact"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Policy UPDATE : User peut modifier son propre contact
DROP POLICY IF EXISTS "linkme_users_can_update_own_contact" ON contacts;

CREATE POLICY "linkme_users_can_update_own_contact"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

-- ============================================
-- PHASE 3: Policies pour back-office (admin)
-- ============================================

-- Le back-office doit pouvoir lire/écrire tous les contacts
-- On utilise une fonction pour vérifier si l'user est back-office

CREATE OR REPLACE FUNCTION is_backoffice_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND is_active = true
  );
$$;

-- Policy SELECT : Back-office peut voir tous les contacts
DROP POLICY IF EXISTS "backoffice_can_view_all_contacts" ON contacts;

CREATE POLICY "backoffice_can_view_all_contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (is_backoffice_user());

-- Policy INSERT : Back-office peut créer des contacts
DROP POLICY IF EXISTS "backoffice_can_insert_contacts" ON contacts;

CREATE POLICY "backoffice_can_insert_contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_backoffice_user());

-- Policy UPDATE : Back-office peut modifier tous les contacts
DROP POLICY IF EXISTS "backoffice_can_update_all_contacts" ON contacts;

CREATE POLICY "backoffice_can_update_all_contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- Policy DELETE : Back-office peut supprimer des contacts
DROP POLICY IF EXISTS "backoffice_can_delete_contacts" ON contacts;

CREATE POLICY "backoffice_can_delete_contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (is_backoffice_user());

-- ============================================
-- PHASE 4: Commentaires et validation
-- ============================================

COMMENT ON POLICY "linkme_users_can_view_own_contact" ON contacts IS
'Permet à un utilisateur LinkMe de voir son propre contact (via email)';

COMMENT ON POLICY "linkme_users_can_update_own_contact" ON contacts IS
'Permet à un utilisateur LinkMe de modifier son propre contact (via email).
Utilisé par la page /profil de l app LinkMe.';

COMMENT ON FUNCTION is_backoffice_user() IS
'Retourne true si l utilisateur courant a un rôle back-office actif';

-- Validation
DO $$
DECLARE
  v_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'contacts';

  RAISE NOTICE '✅ Migration RLS contacts réussie - % policies créées', v_policy_count;
END $$;

-- ============================================
-- Migration: RPC pour mettre a jour le profil utilisateur LinkMe
-- Date: 2025-12-18
-- Description: Fonction RPC avec SECURITY DEFINER pour bypass RLS
-- ============================================

-- RPC pour mettre a jour le profil utilisateur
CREATE OR REPLACE FUNCTION update_user_contact(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifier que l email est fourni
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Email is required');
  END IF;

  -- Mettre a jour le contact
  UPDATE contacts
  SET
    first_name = p_first_name,
    last_name = p_last_name,
    phone = p_phone,
    title = p_title,
    updated_at = NOW()
  WHERE email = p_email;

  -- Si aucune ligne mise a jour, retourner erreur
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contact not found for email: ' || p_email);
  END IF;

  -- Retourner succes
  RETURN json_build_object('success', true, 'email', p_email);
END;
$$;

-- Donner les droits d execution
GRANT EXECUTE ON FUNCTION update_user_contact(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION update_user_contact IS
'Met a jour le profil utilisateur dans la table contacts.
Utilise SECURITY DEFINER pour bypass les policies RLS.
Appelee depuis la page /profil de l app LinkMe.';

-- Validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_user_contact'
  ) THEN
    RAISE EXCEPTION 'RPC update_user_contact non creee';
  END IF;

  RAISE NOTICE 'Migration RPC update_user_contact reussie';
END $$;

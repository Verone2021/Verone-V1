-- ============================================
-- Migration: Fix RPC update_user_contact avec UPSERT
-- Date: 2025-12-18
-- Description:
--   - Remplace UPDATE par INSERT ... ON CONFLICT DO UPDATE (UPSERT)
--   - Crée le contact automatiquement s'il n'existe pas
--   - Corrige l'erreur "Contact not found for email"
-- ============================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS update_user_contact(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Nouvelle fonction avec UPSERT
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
  -- Verifier que l'email est fourni
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Email is required');
  END IF;

  -- UPSERT: Créer ou mettre à jour le contact
  INSERT INTO contacts (
    email,
    first_name,
    last_name,
    phone,
    title,
    is_active,
    is_primary_contact,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    p_email,
    p_first_name,
    p_last_name,
    p_phone,
    p_title,
    true,
    true,
    'Contact créé/mis à jour via profil LinkMe',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    title = EXCLUDED.title,
    updated_at = NOW();

  -- Retourner succes
  RETURN json_build_object('success', true, 'email', p_email);
END;
$$;

-- Donner les droits d'execution
GRANT EXECUTE ON FUNCTION update_user_contact(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION update_user_contact IS
'Met à jour ou crée le profil utilisateur dans la table contacts (UPSERT).
Utilise SECURITY DEFINER pour bypass les policies RLS.
Appelée depuis la page /profil de l app LinkMe.';

-- Validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_user_contact'
  ) THEN
    RAISE EXCEPTION 'RPC update_user_contact non créée';
  END IF;

  RAISE NOTICE '✅ Migration RPC update_user_contact (UPSERT) réussie';
END $$;

-- ============================================================================
-- Migration: RPC pour récupérer les infos du créateur de commande
-- Date: 2025-12-19
-- Description: Permet d'afficher nom, prénom, email du créateur dans le détail
-- ============================================================================

-- Fonction pour récupérer les infos d'un utilisateur par son ID
CREATE OR REPLACE FUNCTION get_user_info(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    COALESCE(up.first_name, u.raw_user_meta_data->>'first_name', 'Utilisateur')::TEXT as first_name,
    COALESCE(up.last_name, u.raw_user_meta_data->>'last_name', '')::TEXT as last_name,
    u.email::TEXT
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.user_id = u.id
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION get_user_info(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_info(UUID) IS
'Récupère les informations d un utilisateur (nom, prénom, email) pour affichage.
Utilisé pour afficher le créateur d une commande.';

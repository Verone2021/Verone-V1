-- ============================================
-- Migration: RPC get_affiliates_with_users
-- Date: 2025-12-21
-- Description: Retourne uniquement les affiliés qui ont au moins
--              un utilisateur LinkMe actif (user_app_roles.app = 'linkme')
-- Bug fix: Le hook affichait TOUS les linkme_affiliates, même ceux
--          sans utilisateur LinkMe (ex: "Vérone" organisation back-office)
-- ============================================

CREATE OR REPLACE FUNCTION get_affiliates_with_users()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  slug TEXT,
  affiliate_type TEXT,
  enseigne_id UUID,
  enseigne_name TEXT,
  organisation_id UUID,
  organisation_name TEXT,
  users_count INT
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT
    la.id,
    la.display_name,
    la.slug,
    CASE WHEN la.enseigne_id IS NOT NULL THEN 'enseigne' ELSE 'org_independante' END AS affiliate_type,
    la.enseigne_id,
    e.name AS enseigne_name,
    la.organisation_id,
    o.legal_name AS organisation_name,
    COUNT(DISTINCT uar.user_id)::INT AS users_count
  FROM linkme_affiliates la
  LEFT JOIN enseignes e ON e.id = la.enseigne_id
  LEFT JOIN organisations o ON o.id = la.organisation_id
  -- INNER JOIN garantit qu'on ne retourne que les affiliés avec au moins 1 utilisateur LinkMe
  INNER JOIN user_app_roles uar ON (
    uar.app = 'linkme'
    AND uar.is_active = true
    AND (
      -- Match par enseigne
      (la.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
      OR
      -- Match par organisation indépendante
      (la.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
  )
  WHERE la.status = 'active'
  GROUP BY la.id, la.display_name, la.slug, la.enseigne_id, e.name, la.organisation_id, o.legal_name
  HAVING COUNT(DISTINCT uar.user_id) > 0
  ORDER BY la.display_name;
$$;

-- Commentaire explicatif
COMMENT ON FUNCTION get_affiliates_with_users IS
'Retourne les affiliés LinkMe actifs qui ont au moins 1 utilisateur LinkMe.
Utilisé par le formulaire de stockage CMS pour n afficher que les vrais affiliés.
IMPORTANT: Ne retourne PAS les affiliés sans utilisateur (ex: organisations back-office).';

-- Grant
GRANT EXECUTE ON FUNCTION get_affiliates_with_users TO authenticated;

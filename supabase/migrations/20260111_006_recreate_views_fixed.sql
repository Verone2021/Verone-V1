-- Migration: Recreate Views Fixed (after column errors)
--
-- Les vues ont été supprimées par 005 mais pas recréées à cause d'erreurs de colonnes
-- Cette migration les recrée avec les bonnes colonnes
--
-- @since 2026-01-11

-- ============================================================================
-- STEP 1: Créer une fonction helper sécurisée pour obtenir l'email
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_email(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;

  RETURN v_email;
END;
$$;

COMMENT ON FUNCTION get_user_email(uuid) IS
'Secure helper to get user email without exposing auth.users directly';

-- ============================================================================
-- STEP 2: Recréer v_users_with_roles
-- ============================================================================
CREATE OR REPLACE VIEW public.v_users_with_roles AS
SELECT
  up.user_id,
  get_user_email(up.user_id) as email,
  COALESCE(up.first_name || ' ' || up.last_name, up.first_name, up.last_name) as full_name,
  up.avatar_url,
  up.role,
  up.app,
  up.created_at,
  up.updated_at,
  COALESCE(
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'app', uar.app,
        'role', uar.role,
        'is_active', uar.is_active
      )
    ) FILTER (WHERE uar.id IS NOT NULL),
    '[]'::jsonb
  ) as app_roles
FROM user_profiles up
LEFT JOIN user_app_roles uar ON up.user_id = uar.user_id
GROUP BY up.user_id, up.first_name, up.last_name, up.avatar_url, up.role, up.app, up.created_at, up.updated_at;

-- Ne PAS appliquer security_invoker car la vue utilise une fonction SECURITY DEFINER
-- Mais restreindre l'accès
REVOKE ALL ON public.v_users_with_roles FROM anon, public;
GRANT SELECT ON public.v_users_with_roles TO authenticated;

COMMENT ON VIEW public.v_users_with_roles IS
'Staff-only view: Users with roles. Access restricted to authenticated. Security fix 2026-01-11';

-- ============================================================================
-- STEP 3: Recréer v_linkme_users
-- ============================================================================
CREATE OR REPLACE VIEW public.v_linkme_users AS
SELECT
  up.user_id,
  get_user_email(up.user_id) as email,
  COALESCE(up.first_name || ' ' || up.last_name, up.first_name, up.last_name) as full_name,
  up.avatar_url,
  uar.role as linkme_role,
  uar.is_active,
  uar.enseigne_id,
  uar.organisation_id,
  e.name as enseigne_name,
  o.legal_name as organisation_name,
  uar.created_at,
  uar.updated_at
FROM user_profiles up
INNER JOIN user_app_roles uar ON up.user_id = uar.user_id AND uar.app = 'linkme'
LEFT JOIN enseignes e ON uar.enseigne_id = e.id
LEFT JOIN organisations o ON uar.organisation_id = o.id
WHERE uar.is_active = true;

-- Permissions
REVOKE ALL ON public.v_linkme_users FROM anon, public;
GRANT SELECT ON public.v_linkme_users TO authenticated;

COMMENT ON VIEW public.v_linkme_users IS
'Staff-only view: LinkMe users. Access restricted to authenticated. Security fix 2026-01-11';

-- ============================================================================
-- STEP 4: Recréer v_pending_invoice_uploads
-- ============================================================================
CREATE OR REPLACE VIEW public.v_pending_invoice_uploads AS
SELECT
  fd.id,
  fd.document_type,
  fd.uploaded_file_name as file_name,
  fd.uploaded_file_url as file_url,
  fd.total_ttc as amount_ttc,
  fd.upload_status as status,
  fd.created_at,
  COALESCE(up.first_name || ' ' || up.last_name, up.first_name, up.last_name) as uploader_name,
  get_user_email(fd.uploaded_by) as uploader_email
FROM financial_documents fd
LEFT JOIN user_profiles up ON fd.uploaded_by = up.user_id
WHERE fd.upload_status = 'pending'
  AND fd.document_type IN ('supplier_invoice', 'credit_note');

-- Permissions
REVOKE ALL ON public.v_pending_invoice_uploads FROM anon, public;
GRANT SELECT ON public.v_pending_invoice_uploads TO authenticated;

COMMENT ON VIEW public.v_pending_invoice_uploads IS
'Staff-only view: Pending invoice uploads. Access restricted to authenticated. Security fix 2026-01-11';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_views
  WHERE schemaname = 'public'
  AND viewname IN ('v_users_with_roles', 'v_linkme_users', 'v_pending_invoice_uploads');

  RAISE NOTICE 'Views recreated: % of 3 expected', v_count;
END $$;

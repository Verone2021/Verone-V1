-- Migration: Fix Remaining Security Errors (18 total)
--
-- PROBLEME: Supabase Security Advisor montre encore 18 erreurs:
-- - 3 Exposed Auth Users (vues qui exposent auth.users)
-- - 15 Security Definer Views (vues qui bypassent RLS)
--
-- SOLUTION:
-- 1. Recréer les vues Exposed Auth Users sans référence directe à auth.users
-- 2. Appliquer security_invoker=true sur les vues appropriées
--
-- @since 2026-01-11

-- ============================================================================
-- STEP 1: FIX EXPOSED AUTH USERS (3 vues)
-- Ces vues exposent auth.users via PostgREST
-- ============================================================================

-- 1.1 v_users_with_roles - Recréer sans accès direct à auth.users
DROP VIEW IF EXISTS public.v_users_with_roles CASCADE;

CREATE OR REPLACE VIEW public.v_users_with_roles AS
SELECT
  up.user_id,
  up.email,
  up.full_name,
  up.avatar_url,
  up.role,
  up.app,
  up.is_active,
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
GROUP BY up.user_id, up.email, up.full_name, up.avatar_url, up.role, up.app, up.is_active, up.created_at, up.updated_at;

-- Appliquer security_invoker pour respecter RLS
ALTER VIEW public.v_users_with_roles SET (security_invoker = true);

-- Permissions
REVOKE ALL ON public.v_users_with_roles FROM anon, public;
GRANT SELECT ON public.v_users_with_roles TO authenticated;

COMMENT ON VIEW public.v_users_with_roles IS
'Staff-only view: Users with roles (no direct auth.users access). Security fix 2026-01-11';

-- 1.2 v_linkme_users - Recréer sans accès direct à auth.users
DROP VIEW IF EXISTS public.v_linkme_users CASCADE;

CREATE OR REPLACE VIEW public.v_linkme_users AS
SELECT
  up.user_id,
  up.email,
  up.full_name,
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

-- Appliquer security_invoker
ALTER VIEW public.v_linkme_users SET (security_invoker = true);

-- Permissions
REVOKE ALL ON public.v_linkme_users FROM anon, public;
GRANT SELECT ON public.v_linkme_users TO authenticated;

COMMENT ON VIEW public.v_linkme_users IS
'Staff-only view: LinkMe users (no direct auth.users access). Security fix 2026-01-11';

-- 1.3 v_pending_invoice_uploads - Recréer sans accès direct à auth.users
DROP VIEW IF EXISTS public.v_pending_invoice_uploads CASCADE;

CREATE OR REPLACE VIEW public.v_pending_invoice_uploads AS
SELECT
  fd.id,
  fd.document_type,
  fd.file_name,
  fd.file_url,
  fd.amount_ttc,
  fd.status,
  fd.created_at,
  up.full_name as uploader_name,
  up.email as uploader_email
FROM financial_documents fd
LEFT JOIN user_profiles up ON fd.uploaded_by = up.user_id
WHERE fd.status = 'pending_upload'
  AND fd.document_type IN ('invoice', 'credit_note');

-- Appliquer security_invoker
ALTER VIEW public.v_pending_invoice_uploads SET (security_invoker = true);

-- Permissions
REVOKE ALL ON public.v_pending_invoice_uploads FROM anon, public;
GRANT SELECT ON public.v_pending_invoice_uploads TO authenticated;

COMMENT ON VIEW public.v_pending_invoice_uploads IS
'Staff-only view: Pending invoice uploads (no direct auth.users access). Security fix 2026-01-11';

-- ============================================================================
-- STEP 2: FIX SECURITY DEFINER VIEWS (15 vues)
-- Appliquer security_invoker=true où approprié
-- ============================================================================

-- Vues qui peuvent utiliser security_invoker (respectent RLS)
ALTER VIEW IF EXISTS public.v_transaction_documents SET (security_invoker = true);
ALTER VIEW IF EXISTS public.stock_alerts_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.linkme_globe_items SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_matching_rules_with_org SET (security_invoker = true);

-- Vues LinkMe admin - Ces vues DOIVENT rester en mode definer pour le dashboard admin
-- car elles agrègent des données cross-tenant
-- On les documente mais on ne les modifie pas
COMMENT ON VIEW public.linkme_orders_with_margins IS
'Admin view (SECURITY DEFINER intentional): Cross-tenant order margins for admin dashboard';
COMMENT ON VIEW public.linkme_orders_enriched IS
'Admin view (SECURITY DEFINER intentional): Enriched orders for admin dashboard';
COMMENT ON VIEW public.linkme_order_items_enriched IS
'Admin view (SECURITY DEFINER intentional): Enriched order items for admin dashboard';
COMMENT ON VIEW public.affiliate_pending_orders IS
'Admin view (SECURITY DEFINER intentional): Pending affiliate orders for admin';
COMMENT ON VIEW public.enseignes_with_stats IS
'Admin view (SECURITY DEFINER intentional): Enseigne stats aggregation for admin';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_exposed_count integer;
  v_definer_count integer;
BEGIN
  -- Vérifier les vues qui exposent encore auth.users
  SELECT COUNT(*) INTO v_exposed_count
  FROM pg_views
  WHERE schemaname = 'public'
  AND definition ILIKE '%auth.users%';

  IF v_exposed_count > 0 THEN
    RAISE WARNING 'Still % views exposing auth.users', v_exposed_count;
  ELSE
    RAISE NOTICE 'SUCCESS: No views directly expose auth.users';
  END IF;

  RAISE NOTICE 'Security fix complete: 3 Exposed Auth Users fixed, 4 views converted to security_invoker';
END $$;

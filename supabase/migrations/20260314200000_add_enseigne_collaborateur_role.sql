-- Migration: Add enseigne_collaborateur role for LinkMe
-- This role has reduced permissions compared to enseigne_admin:
-- - No access to commissions, selections management, organisations, contacts, stockage, settings
-- - Can view/create orders, browse catalogue, propose products, view statistics (except commissions)

-- 1. Update CHECK constraint to accept new role
ALTER TABLE public.user_app_roles
  DROP CONSTRAINT IF EXISTS valid_linkme_role;

ALTER TABLE public.user_app_roles
  ADD CONSTRAINT valid_linkme_role CHECK (
    app <> 'linkme' OR role IN ('enseigne_admin', 'organisation_admin', 'enseigne_collaborateur')
  );

COMMENT ON CONSTRAINT valid_linkme_role ON public.user_app_roles IS
  'LinkMe roles: enseigne_admin (full access), organisation_admin (org-level), enseigne_collaborateur (reduced permissions)';

-- 2. Add CHECK: enseigne_collaborateur requires enseigne_id (like enseigne_admin)
ALTER TABLE public.user_app_roles
  ADD CONSTRAINT collaborateur_needs_enseigne CHECK (
    NOT (app = 'linkme' AND role = 'enseigne_collaborateur' AND enseigne_id IS NULL)
  );

COMMENT ON CONSTRAINT collaborateur_needs_enseigne ON public.user_app_roles IS
  'enseigne_collaborateur must be linked to an enseigne (enseigne_id NOT NULL)';

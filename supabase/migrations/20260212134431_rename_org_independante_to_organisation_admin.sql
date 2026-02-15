-- ============================================================================
-- Migration: Rename org_independante → organisation_admin
-- Description:
--   1. Rename role value in user_app_roles data
--   2. Update CHECK constraints (valid_linkme_role, drop org_independante_needs_org)
--   3. Update RLS policies referencing org_independante
-- Date: 2026-02-12
-- Ticket: LM-USERS-001
-- Note: session_replication_role used to bypass contact sync trigger during rename
-- ============================================================================

-- Bypass triggers for the rename (contact sync trigger causes ON CONFLICT issues)
SET session_replication_role = 'replica';

-- 1. Rename the role value in user_app_roles
UPDATE public.user_app_roles
SET role = 'organisation_admin'
WHERE app = 'linkme' AND role = 'org_independante';

-- Restore normal trigger behavior
SET session_replication_role = 'origin';

-- 2. Update CHECK constraints
-- Drop old constraints
ALTER TABLE public.user_app_roles DROP CONSTRAINT IF EXISTS valid_linkme_role;
ALTER TABLE public.user_app_roles DROP CONSTRAINT IF EXISTS org_independante_needs_org;

-- Add updated constraint (only 2 active roles for LinkMe)
ALTER TABLE public.user_app_roles
ADD CONSTRAINT valid_linkme_role CHECK (
  app != 'linkme' OR role IN ('enseigne_admin', 'organisation_admin')
);

-- Note: org_admin_needs_org already exists and handles organisation_admin

-- 3. Update RLS policies
-- 3a. organisations_select_all - change org_independante → organisation_admin
DROP POLICY IF EXISTS "organisations_select_all" ON public.organisations;
CREATE POLICY "organisations_select_all" ON public.organisations
FOR SELECT TO authenticated
USING (
  is_backoffice_user()
  OR EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND (
        (uar.role = 'enseigne_admin' AND uar.enseigne_id IS NOT NULL AND uar.enseigne_id = organisations.enseigne_id)
        OR
        (uar.role = 'organisation_admin' AND uar.organisation_id IS NOT NULL AND uar.organisation_id = organisations.id)
      )
  )
);

-- 3b. linkme_users_view_catalog_products - remove org_independante, keep only 2 roles
DROP POLICY IF EXISTS "linkme_users_view_catalog_products" ON public.products;
CREATE POLICY "linkme_users_view_catalog_products" ON public.products
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.role IN ('enseigne_admin', 'organisation_admin')
  )
);

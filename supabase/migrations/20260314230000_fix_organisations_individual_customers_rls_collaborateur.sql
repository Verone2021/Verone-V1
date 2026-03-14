-- Fix: enseigne_collaborateur can't see customer names → "Client inconnu" in orders
-- Root cause: organisations_select_all only allows enseigne_admin + organisation_admin
--             individual_customers has no SELECT policy for LinkMe users
-- Solution: Add enseigne_collaborateur to organisations RLS + add individual_customers SELECT for LinkMe

-- ============================================================================
-- PART 1: Fix organisations SELECT policy
-- Add enseigne_collaborateur (same scope as enseigne_admin: sees orgs in their enseigne)
-- ============================================================================

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
        -- Enseigne admin + collaborateur: see all orgs in their enseigne
        (uar.role IN ('enseigne_admin', 'enseigne_collaborateur')
         AND uar.enseigne_id IS NOT NULL
         AND uar.enseigne_id = organisations.enseigne_id)
        OR
        -- Organisation admin: see only their own org
        (uar.role = 'organisation_admin'
         AND uar.organisation_id IS NOT NULL
         AND uar.organisation_id = organisations.id)
      )
  )
);

-- ============================================================================
-- PART 2: Add individual_customers SELECT policy for LinkMe users
-- LinkMe affiliates need to see individual customers linked to their orders
-- ============================================================================

DROP POLICY IF EXISTS "linkme_users_read_individual_customers" ON public.individual_customers;
CREATE POLICY "linkme_users_read_individual_customers" ON public.individual_customers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.role IN ('enseigne_admin', 'organisation_admin', 'enseigne_collaborateur')
      AND uar.is_active = true
  )
);

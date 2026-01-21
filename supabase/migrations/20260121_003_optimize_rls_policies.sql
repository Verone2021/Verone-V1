-- ============================================================================
-- Migration: Optimize RLS policies for performance
-- Date: 2026-01-21
-- Description: Optimiser les politiques RLS pour eviter le probleme
--              "Auth RLS Initialization Plan" ou auth.uid() est revalue
--              pour chaque ligne au lieu d'etre evalue une seule fois.
--
-- PROBLEME DE PERFORMANCE:
-- Quand auth.uid() est utilise directement dans une condition RLS,
-- PostgreSQL le reevalue pour chaque ligne de la table.
--
-- SOLUTION:
-- Wrapper auth.uid() dans un sous-select: (SELECT auth.uid())
-- Cela force PostgreSQL a evaluer la valeur une seule fois.
--
-- AVANT (lent):
--   USING (user_id = auth.uid())
--
-- APRES (optimise):
--   USING (user_id = (SELECT auth.uid()))
--
-- Tables optimisees:
-- 1. user_dashboard_preferences
-- 2. user_app_roles
-- 3. addresses
-- ============================================================================

-- ============================================================================
-- TABLE 1: user_dashboard_preferences
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own dashboard preferences" ON user_dashboard_preferences;
DROP POLICY IF EXISTS "Users can insert own dashboard preferences" ON user_dashboard_preferences;
DROP POLICY IF EXISTS "Users can update own dashboard preferences" ON user_dashboard_preferences;
DROP POLICY IF EXISTS "Users can delete own dashboard preferences" ON user_dashboard_preferences;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own dashboard preferences"
  ON user_dashboard_preferences
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own dashboard preferences"
  ON user_dashboard_preferences
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own dashboard preferences"
  ON user_dashboard_preferences
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own dashboard preferences"
  ON user_dashboard_preferences
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TABLE 2: user_app_roles
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Back-office admins can view all roles" ON user_app_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can view their enseigne roles" ON user_app_roles;
DROP POLICY IF EXISTS "Back-office admins can insert roles" ON user_app_roles;
DROP POLICY IF EXISTS "Enseigne admins can insert roles for their enseigne" ON user_app_roles;
DROP POLICY IF EXISTS "Back-office admins can delete roles" ON user_app_roles;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Back-office admins can view all roles"
  ON user_app_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
    )
  );

CREATE POLICY "Users can view their own roles"
  ON user_app_roles
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Enseigne admins can view their enseigne roles"
  ON user_app_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.role = 'enseigne_admin'
        AND uar.enseigne_id = user_app_roles.enseigne_id
        AND uar.is_active = true
    )
  );

CREATE POLICY "Back-office admins can insert roles"
  ON user_app_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
    )
  );

CREATE POLICY "Enseigne admins can insert roles for their enseigne"
  ON user_app_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.role = 'enseigne_admin'
        AND uar.enseigne_id = user_app_roles.enseigne_id
        AND uar.is_active = true
    )
  );

CREATE POLICY "Back-office admins can delete roles"
  ON user_app_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
    )
  );

-- ============================================================================
-- TABLE 3: addresses
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "addresses_select_policy" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_policy" ON addresses;
DROP POLICY IF EXISTS "addresses_update_policy" ON addresses;
DROP POLICY IF EXISTS "addresses_delete_policy" ON addresses;

-- Recreate with optimized auth.uid() and auth.jwt() calls
CREATE POLICY "addresses_select_policy" ON addresses
  FOR SELECT
  USING (
    (SELECT auth.role()) = 'authenticated'
    AND (
      -- User can see their own addresses
      (owner_type = 'user' AND owner_id = (SELECT auth.uid()))
      OR
      -- User can see addresses of organisations in their enseigne
      (owner_type = 'organisation')
      OR
      -- Admin/service role can see all
      (SELECT auth.jwt()->>'role') IN ('service_role', 'admin')
    )
  );

CREATE POLICY "addresses_insert_policy" ON addresses
  FOR INSERT
  WITH CHECK (
    (SELECT auth.role()) = 'authenticated'
  );

CREATE POLICY "addresses_update_policy" ON addresses
  FOR UPDATE
  USING (
    (SELECT auth.role()) = 'authenticated'
  );

CREATE POLICY "addresses_delete_policy" ON addresses
  FOR DELETE
  USING (
    (SELECT auth.jwt()->>'role') IN ('service_role', 'admin')
  );

-- ============================================================================
-- TABLE 4: Optimiser is_backoffice_user() helper function
-- ============================================================================
-- Note: Cette fonction utilise auth.uid() en interne.
-- L'optimisation ici est de s'assurer qu'elle est STABLE et SECURITY DEFINER

CREATE OR REPLACE FUNCTION is_backoffice_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = (SELECT auth.uid())
      AND app = 'back-office'
      AND is_active = true
  );
$$;

-- ============================================================================
-- TABLE 5: form_submissions - Optimisation des policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Back-office full access to form_submissions" ON form_submissions;
DROP POLICY IF EXISTS "LinkMe view own selection requests" ON form_submissions;
DROP POLICY IF EXISTS "Public can insert form_submissions" ON form_submissions;

-- Recreate with optimized queries
CREATE POLICY "Back-office full access to form_submissions" ON form_submissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = (SELECT auth.uid()) AND app = 'back-office'
  )
);

CREATE POLICY "LinkMe view own selection requests" ON form_submissions
FOR SELECT USING (
  form_type = 'selection_inquiry' AND
  source = 'linkme' AND
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
      (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    JOIN linkme_selections ls ON ls.affiliate_id = la.id
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND ls.id = form_submissions.source_reference_id
  )
);

CREATE POLICY "Public can insert form_submissions" ON form_submissions
FOR INSERT WITH CHECK (true);

-- ============================================================================
-- TABLE 6: form_submission_messages - Optimisation des policies
-- ============================================================================

DROP POLICY IF EXISTS "Back-office full access to messages" ON form_submission_messages;
DROP POLICY IF EXISTS "LinkMe view messages for own requests" ON form_submission_messages;

CREATE POLICY "Back-office full access to messages" ON form_submission_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = (SELECT auth.uid()) AND app = 'back-office'
  )
);

CREATE POLICY "LinkMe view messages for own requests" ON form_submission_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM form_submissions fs
    JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
      (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    JOIN linkme_selections ls ON ls.affiliate_id = la.id
    WHERE fs.id = form_submission_messages.form_submission_id
      AND fs.form_type = 'selection_inquiry'
      AND fs.source = 'linkme'
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND ls.id = fs.source_reference_id
  )
);

-- ============================================================================
-- TABLE 7: form_types et app_settings - Optimisation
-- ============================================================================

DROP POLICY IF EXISTS "Back-office full access to form_types" ON form_types;
DROP POLICY IF EXISTS "Back-office full access to app_settings" ON app_settings;

CREATE POLICY "Back-office full access to form_types" ON form_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = (SELECT auth.uid()) AND app = 'back-office'
  )
);

CREATE POLICY "Back-office full access to app_settings" ON app_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = (SELECT auth.uid()) AND app = 'back-office'
  )
);

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260121_003: Politiques RLS optimisees';
  RAISE NOTICE 'auth.uid() encapsule dans (SELECT auth.uid()) pour evaluation unique';
END $$;

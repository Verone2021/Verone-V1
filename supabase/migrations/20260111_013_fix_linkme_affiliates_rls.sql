-- ============================================================================
-- Migration: Fix linkme_affiliates RLS Policy
-- Date: 2026-01-11
--
-- La policy "linkme_affiliates_unified" référence une colonne user_id qui
-- n'existe pas dans la table linkme_affiliates. Cette migration restaure
-- la logique originale qui utilise user_app_roles pour vérifier l'accès
-- via enseigne_id ou organisation_id.
--
-- Policies restaurées:
-- 1. linkme_affiliates_own - Accès utilisateurs LinkMe via user_app_roles
-- 2. linkme_affiliates_staff_all - Accès staff back-office
-- 3. linkme_affiliates_public_read - Lecture publique affiliés actifs
-- ============================================================================

-- Supprimer la policy cassée
DROP POLICY IF EXISTS "linkme_affiliates_unified" ON linkme_affiliates;

-- Restaurer la policy pour les utilisateurs LinkMe (via user_app_roles)
CREATE POLICY "linkme_affiliates_own" ON linkme_affiliates
FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = linkme_affiliates.enseigne_id))
    OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = linkme_affiliates.organisation_id))
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = linkme_affiliates.enseigne_id))
    OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = linkme_affiliates.organisation_id))
  )
));

-- Policy pour le staff back-office
CREATE POLICY "linkme_affiliates_staff_all" ON linkme_affiliates
FOR ALL TO public
USING (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
    AND user_profiles.app = 'back-office'::app_type
  )
);

-- Policy pour lecture publique des affiliés actifs
CREATE POLICY "linkme_affiliates_public_read" ON linkme_affiliates
FOR SELECT TO public
USING (status = 'active');

-- Vérification
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'linkme_affiliates';

  IF v_count >= 3 THEN
    RAISE NOTICE 'SUCCESS: linkme_affiliates has % policies restored', v_count;
  ELSE
    RAISE WARNING 'PROBLEM: linkme_affiliates has only % policies', v_count;
  END IF;
END $$;

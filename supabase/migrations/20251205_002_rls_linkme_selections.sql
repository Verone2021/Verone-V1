-- ============================================================================
-- Migration: RLS Policies pour linkme_selections et linkme_selection_items
-- Date: 2025-12-05
-- Description: Ajoute les RLS policies manquantes pour permettre aux affiliés
--              LinkMe de gérer leurs sélections et produits
-- ============================================================================

-- ============================================================================
-- 1. ACTIVER RLS SUR LES TABLES (si pas déjà fait)
-- ============================================================================

ALTER TABLE IF EXISTS linkme_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS linkme_selection_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS POLICIES POUR linkme_selections
-- ============================================================================

-- Supprimer les anciennes policies si existantes
DROP POLICY IF EXISTS linkme_selections_staff_all ON linkme_selections;
DROP POLICY IF EXISTS linkme_selections_affiliate_select ON linkme_selections;
DROP POLICY IF EXISTS linkme_selections_affiliate_insert ON linkme_selections;
DROP POLICY IF EXISTS linkme_selections_affiliate_update ON linkme_selections;
DROP POLICY IF EXISTS linkme_selections_affiliate_delete ON linkme_selections;
DROP POLICY IF EXISTS linkme_selections_public_read ON linkme_selections;

-- Staff/Admin peut tout faire (back-office)
CREATE POLICY linkme_selections_staff_all ON linkme_selections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
    )
  );

-- Affiliés peuvent voir leurs propres sélections
-- (via organisation_id ou enseigne_id dans linkme_affiliates)
CREATE POLICY linkme_selections_affiliate_select ON linkme_selections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE la.id = linkme_selections.affiliate_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          -- L'affilié est lié à la même organisation
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          -- L'affilié est lié à la même enseigne
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Affiliés peuvent créer des sélections pour leur affilié
CREATE POLICY linkme_selections_affiliate_insert ON linkme_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE la.id = linkme_selections.affiliate_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Affiliés peuvent modifier leurs propres sélections
CREATE POLICY linkme_selections_affiliate_update ON linkme_selections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE la.id = linkme_selections.affiliate_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE la.id = linkme_selections.affiliate_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Affiliés peuvent supprimer leurs propres sélections
CREATE POLICY linkme_selections_affiliate_delete ON linkme_selections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE la.id = linkme_selections.affiliate_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Lecture publique pour sélections publiques (pour les clients finaux)
CREATE POLICY linkme_selections_public_read ON linkme_selections
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND status = 'active');

-- ============================================================================
-- 3. RLS POLICIES POUR linkme_selection_items
-- ============================================================================

-- Supprimer les anciennes policies si existantes
DROP POLICY IF EXISTS linkme_selection_items_staff_all ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_affiliate_select ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_affiliate_insert ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_affiliate_update ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_affiliate_delete ON linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_public_read ON linkme_selection_items;

-- Staff/Admin peut tout faire (back-office)
CREATE POLICY linkme_selection_items_staff_all ON linkme_selection_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'manager')
    )
  );

-- Affiliés peuvent voir les items de leurs propres sélections
CREATE POLICY linkme_selection_items_affiliate_select ON linkme_selection_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_selections ls
      JOIN linkme_affiliates la ON la.id = ls.affiliate_id
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE ls.id = linkme_selection_items.selection_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Affiliés peuvent ajouter des items à leurs propres sélections
CREATE POLICY linkme_selection_items_affiliate_insert ON linkme_selection_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM linkme_selections ls
      JOIN linkme_affiliates la ON la.id = ls.affiliate_id
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE ls.id = linkme_selection_items.selection_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Affiliés peuvent modifier les items de leurs propres sélections
CREATE POLICY linkme_selection_items_affiliate_update ON linkme_selection_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_selections ls
      JOIN linkme_affiliates la ON la.id = ls.affiliate_id
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE ls.id = linkme_selection_items.selection_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM linkme_selections ls
      JOIN linkme_affiliates la ON la.id = ls.affiliate_id
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE ls.id = linkme_selection_items.selection_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Affiliés peuvent supprimer les items de leurs propres sélections
CREATE POLICY linkme_selection_items_affiliate_delete ON linkme_selection_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_selections ls
      JOIN linkme_affiliates la ON la.id = ls.affiliate_id
      JOIN user_app_roles uar ON uar.user_id = auth.uid()
      WHERE ls.id = linkme_selection_items.selection_id
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR
          (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

-- Lecture publique pour items de sélections publiques (pour les clients finaux)
CREATE POLICY linkme_selection_items_public_read ON linkme_selection_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkme_selections ls
      WHERE ls.id = linkme_selection_items.selection_id
        AND ls.is_public = true
        AND ls.status = 'active'
    )
  );

-- ============================================================================
-- 4. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON linkme_selections TO authenticated;
GRANT SELECT ON linkme_selections TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON linkme_selection_items TO authenticated;
GRANT SELECT ON linkme_selection_items TO anon;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON POLICY linkme_selections_affiliate_select ON linkme_selections IS
  'Permet aux affiliés de voir leurs propres sélections via user_app_roles';

COMMENT ON POLICY linkme_selections_affiliate_insert ON linkme_selections IS
  'Permet aux affiliés de créer des sélections pour leur compte affilié';

COMMENT ON POLICY linkme_selection_items_affiliate_insert ON linkme_selection_items IS
  'Permet aux affiliés d''ajouter des produits à leurs propres sélections';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

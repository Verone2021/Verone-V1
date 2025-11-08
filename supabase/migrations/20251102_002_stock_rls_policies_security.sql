-- Migration: RLS Policies Sécurité - Module Stock
-- Date: 2025-11-02
-- Objectif: Sécuriser l'accès aux mouvements de stock par organisation
-- Impact: Utilisateurs voient UNIQUEMENT leur organisation

-- ============================================================================
-- 1. ACTIVER RLS SUR STOCK_MOVEMENTS (si pas déjà activé)
-- ============================================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLITIQUE SELECT : Utilisateurs authentifiés voient LEUR organisation
-- ============================================================================

DROP POLICY IF EXISTS stock_movements_select_own_org ON stock_movements;

CREATE POLICY stock_movements_select_own_org ON stock_movements
  FOR SELECT
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY stock_movements_select_own_org ON stock_movements IS
  'Utilisateurs authentifiés voient uniquement les mouvements de leur organisation';

-- ============================================================================
-- 3. POLITIQUE INSERT : Owner/Admin uniquement
-- ============================================================================

DROP POLICY IF EXISTS stock_movements_insert_owner_admin ON stock_movements;

CREATE POLICY stock_movements_insert_owner_admin ON stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id
      FROM user_profiles
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
    )
  );

COMMENT ON POLICY stock_movements_insert_owner_admin ON stock_movements IS
  'Seuls Owner et Admin peuvent créer des mouvements de stock';

-- ============================================================================
-- 4. POLITIQUE UPDATE : Owner/Admin uniquement
-- ============================================================================

DROP POLICY IF EXISTS stock_movements_update_owner_admin ON stock_movements;

CREATE POLICY stock_movements_update_owner_admin ON stock_movements
  FOR UPDATE
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id
      FROM user_profiles
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
    )
  )
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id
      FROM user_profiles
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
    )
  );

COMMENT ON POLICY stock_movements_update_owner_admin ON stock_movements IS
  'Seuls Owner et Admin peuvent modifier des mouvements de stock';

-- ============================================================================
-- 5. POLITIQUE DELETE : Admin uniquement (protection maximale)
-- ============================================================================

DROP POLICY IF EXISTS stock_movements_delete_admin_only ON stock_movements;

CREATE POLICY stock_movements_delete_admin_only ON stock_movements
  FOR DELETE
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id
      FROM user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'
    )
  );

COMMENT ON POLICY stock_movements_delete_admin_only ON stock_movements IS
  'Seuls Admin peuvent supprimer des mouvements de stock (audit trail protection)';

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Vérifier que les 4 policies sont créées
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'stock_movements'
    AND policyname LIKE 'stock_movements_%';

  IF policy_count < 4 THEN
    RAISE EXCEPTION 'RLS policies manquantes sur stock_movements (attendu: 4, trouvé: %)', policy_count;
  END IF;

  RAISE NOTICE '✅ Migration RLS Policies: 4 policies créées avec succès';
END $$;

-- Migration: RLS Policies - stock_reservations
-- Date: 2025-11-19
-- Objectif: Activer RLS et creer policies pour stock_reservations
-- Probleme resolu: PGRST200 "Could not find relationship between stock_reservations and products"
-- Cause: PostgREST refuse les joins sur tables sans RLS policies
-- Solution: Activer RLS + policies simples (pattern products)

-- ============================================================================
-- 1. ACTIVER RLS SUR STOCK_RESERVATIONS
-- ============================================================================

ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLITIQUE SELECT : Utilisateurs authentifies
-- ============================================================================
-- Pattern simple comme products: tous les users authentifies voient tout

DROP POLICY IF EXISTS stock_reservations_select_authenticated ON stock_reservations;

CREATE POLICY stock_reservations_select_authenticated ON stock_reservations
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY stock_reservations_select_authenticated ON stock_reservations IS
  'Utilisateurs authentifies peuvent voir les reservations';

-- ============================================================================
-- 3. POLITIQUE INSERT : Utilisateurs authentifies
-- ============================================================================

DROP POLICY IF EXISTS stock_reservations_insert_authenticated ON stock_reservations;

CREATE POLICY stock_reservations_insert_authenticated ON stock_reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY stock_reservations_insert_authenticated ON stock_reservations IS
  'Utilisateurs authentifies peuvent creer des reservations';

-- ============================================================================
-- 4. POLITIQUE UPDATE : Utilisateurs authentifies
-- ============================================================================

DROP POLICY IF EXISTS stock_reservations_update_authenticated ON stock_reservations;

CREATE POLICY stock_reservations_update_authenticated ON stock_reservations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY stock_reservations_update_authenticated ON stock_reservations IS
  'Utilisateurs authentifies peuvent modifier des reservations';

-- ============================================================================
-- 5. POLITIQUE DELETE : Utilisateurs authentifies
-- ============================================================================

DROP POLICY IF EXISTS stock_reservations_delete_authenticated ON stock_reservations;

CREATE POLICY stock_reservations_delete_authenticated ON stock_reservations
  FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON POLICY stock_reservations_delete_authenticated ON stock_reservations IS
  'Utilisateurs authentifies peuvent supprimer des reservations';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'stock_reservations'
    AND policyname LIKE 'stock_reservations_%';

  IF policy_count < 4 THEN
    RAISE EXCEPTION 'RLS policies manquantes sur stock_reservations (attendu: 4, trouve: %)', policy_count;
  END IF;

  RAISE NOTICE 'Migration RLS Policies stock_reservations: 4 policies creees avec succes';
END $$;

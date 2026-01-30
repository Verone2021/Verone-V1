-- ============================================================================
-- Migration: Fix RLS policies pour linkme_payment_requests (staff back-office)
-- Date: 2026-01-30
-- Problème: Policies utilisent user_profiles.app qui N'EXISTE PAS
-- Solution: Remplacer par is_backoffice_user() helper function
-- Référence: .claude/rules/database/rls-patterns.md
-- ============================================================================

-- PROBLÈME IDENTIFIÉ :
-- Migration 20251211030000 utilise:
--   WHERE user_profiles.app = 'back-office'
-- Cette colonne N'EXISTE PAS dans user_profiles.
--
-- SOLUTION :
-- Utiliser is_backoffice_user() (défini dans migration 20260121_005)
-- qui vérifie user_app_roles.app = 'back-office' (table CORRECTE)
-- ============================================================================

-- 1. Supprimer policies incorrectes (4 policies)
DROP POLICY IF EXISTS "Back-office staff can create payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Back-office staff can create request items" ON linkme_payment_request_items;
DROP POLICY IF EXISTS "Back-office staff can update payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Back-office staff can view all payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Back-office staff can view all request items" ON linkme_payment_request_items;

-- ============================================================================
-- POLICIES CORRECTES : linkme_payment_requests
-- ============================================================================

-- SELECT: Staff back-office voit TOUTES les demandes
CREATE POLICY "staff_view_all_payment_requests"
  ON linkme_payment_requests
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- INSERT: Staff back-office peut créer des demandes
CREATE POLICY "staff_create_payment_requests"
  ON linkme_payment_requests
  FOR INSERT TO authenticated
  WITH CHECK (is_backoffice_user());

-- UPDATE: Staff back-office peut modifier des demandes
CREATE POLICY "staff_update_payment_requests"
  ON linkme_payment_requests
  FOR UPDATE TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- DELETE: Staff back-office peut supprimer des demandes
CREATE POLICY "staff_delete_payment_requests"
  ON linkme_payment_requests
  FOR DELETE TO authenticated
  USING (is_backoffice_user());

-- ============================================================================
-- POLICIES CORRECTES : linkme_payment_request_items
-- ============================================================================

-- SELECT: Staff back-office voit TOUS les items
CREATE POLICY "staff_view_all_request_items"
  ON linkme_payment_request_items
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- INSERT: Staff back-office peut créer des items
CREATE POLICY "staff_create_request_items"
  ON linkme_payment_request_items
  FOR INSERT TO authenticated
  WITH CHECK (is_backoffice_user());

-- UPDATE: Staff back-office peut modifier des items
CREATE POLICY "staff_update_request_items"
  ON linkme_payment_request_items
  FOR UPDATE TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- DELETE: Staff back-office peut supprimer des items
CREATE POLICY "staff_delete_request_items"
  ON linkme_payment_request_items
  FOR DELETE TO authenticated
  USING (is_backoffice_user());

-- ============================================================================
-- POLICIES AFFILIÉS : linkme_payment_requests (conservées)
-- ============================================================================
-- Note: Les policies pour les affiliés LinkMe sont déjà correctes
-- et sont conservées (non modifiées par cette migration).
-- ============================================================================

-- Commentaires pour documentation
COMMENT ON POLICY "staff_view_all_payment_requests" ON linkme_payment_requests
  IS 'Staff back-office voit TOUTES les demandes de paiement LinkMe';

COMMENT ON POLICY "staff_create_payment_requests" ON linkme_payment_requests
  IS 'Staff back-office peut créer des demandes pour tous les affiliés';

COMMENT ON POLICY "staff_update_payment_requests" ON linkme_payment_requests
  IS 'Staff back-office peut modifier toutes les demandes';

COMMENT ON POLICY "staff_delete_payment_requests" ON linkme_payment_requests
  IS 'Staff back-office peut supprimer toutes les demandes';

COMMENT ON POLICY "staff_view_all_request_items" ON linkme_payment_request_items
  IS 'Staff back-office voit TOUS les items de demandes';

COMMENT ON POLICY "staff_create_request_items" ON linkme_payment_request_items
  IS 'Staff back-office peut créer des items pour toutes les demandes';

COMMENT ON POLICY "staff_update_request_items" ON linkme_payment_request_items
  IS 'Staff back-office peut modifier tous les items';

COMMENT ON POLICY "staff_delete_request_items" ON linkme_payment_request_items
  IS 'Staff back-office peut supprimer tous les items';

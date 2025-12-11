-- ============================================================================
-- Migration: Corriger RLS policy pour back-office sur linkme_payment_requests
-- Date: 2025-12-11
-- Description: Utilise le même pattern que linkme_affiliates_staff_all pour permettre
--              aux admin/owner/partner_manager du back-office de gérer TOUS les affiliés
--              (y compris ceux de type enseigne qui ont organisation_id = NULL)
-- ============================================================================

-- ============================================================================
-- PROBLÈME IDENTIFIÉ :
-- L'ancienne policy faisait: JOIN user_profiles up ON up.organisation_id = la.organisation_id
-- Ceci échoue quand l'affilié est de type "enseigne" car la.organisation_id = NULL
--
-- SOLUTION :
-- Utiliser le même pattern que linkme_affiliates_staff_all qui vérifie simplement
-- si l'utilisateur est admin/owner/partner_manager dans le back-office
-- ============================================================================

-- 1. Supprimer les anciennes policies incorrectes
DROP POLICY IF EXISTS "Back-office can create payment requests" ON linkme_payment_requests;
DROP POLICY IF EXISTS "Back-office can create request items" ON linkme_payment_request_items;

-- 2. Nouvelle policy INSERT pour linkme_payment_requests
-- Pattern identique à linkme_affiliates_staff_all
CREATE POLICY "Back-office staff can create payment requests" ON linkme_payment_requests
  FOR INSERT
  WITH CHECK (
    -- L'utilisateur doit être admin, owner ou partner_manager dans le back-office
    auth.uid() IN (
      SELECT user_profiles.user_id
      FROM user_profiles
      WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
      AND user_profiles.app = 'back-office'::app_type
    )
  );

-- 3. Nouvelle policy INSERT pour linkme_payment_request_items
CREATE POLICY "Back-office staff can create request items" ON linkme_payment_request_items
  FOR INSERT
  WITH CHECK (
    -- L'utilisateur doit être admin, owner ou partner_manager dans le back-office
    auth.uid() IN (
      SELECT user_profiles.user_id
      FROM user_profiles
      WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
      AND user_profiles.app = 'back-office'::app_type
    )
  );

-- ============================================================================
-- Mettre à jour les policies UPDATE existantes avec le même pattern
-- ============================================================================

-- 4. Recréer la policy UPDATE pour linkme_payment_requests
DROP POLICY IF EXISTS "Back-office can update payment requests" ON linkme_payment_requests;
CREATE POLICY "Back-office staff can update payment requests" ON linkme_payment_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_profiles.user_id
      FROM user_profiles
      WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
      AND user_profiles.app = 'back-office'::app_type
    )
  );

-- 5. Recréer la policy SELECT pour linkme_payment_requests
DROP POLICY IF EXISTS "Back-office can view all payment requests" ON linkme_payment_requests;
CREATE POLICY "Back-office staff can view all payment requests" ON linkme_payment_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_profiles.user_id
      FROM user_profiles
      WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
      AND user_profiles.app = 'back-office'::app_type
    )
  );

-- 6. Recréer la policy SELECT pour linkme_payment_request_items
DROP POLICY IF EXISTS "Back-office can view all request items" ON linkme_payment_request_items;
CREATE POLICY "Back-office staff can view all request items" ON linkme_payment_request_items
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_profiles.user_id
      FROM user_profiles
      WHERE user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'partner_manager'::user_role_type])
      AND user_profiles.app = 'back-office'::app_type
    )
  );

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON POLICY "Back-office staff can create payment requests" ON linkme_payment_requests
  IS 'Permet aux admin/owner/partner_manager du back-office de créer des demandes de paiement pour TOUS les affiliés';

COMMENT ON POLICY "Back-office staff can create request items" ON linkme_payment_request_items
  IS 'Permet aux admin/owner/partner_manager du back-office de créer des items pour TOUTES les demandes';

COMMENT ON POLICY "Back-office staff can update payment requests" ON linkme_payment_requests
  IS 'Permet aux admin/owner/partner_manager du back-office de modifier les demandes de paiement';

COMMENT ON POLICY "Back-office staff can view all payment requests" ON linkme_payment_requests
  IS 'Permet aux admin/owner/partner_manager du back-office de voir toutes les demandes';

COMMENT ON POLICY "Back-office staff can view all request items" ON linkme_payment_request_items
  IS 'Permet aux admin/owner/partner_manager du back-office de voir tous les items';

-- ============================================================================
-- Migration: Ajouter policy INSERT pour back-office sur linkme_payment_requests
-- Date: 2025-12-11
-- Description: Permet au back-office de créer des demandes de paiement pour les affiliés
-- ============================================================================

-- Policy: Back-office peut créer des demandes pour les affiliés de leur organisation
DROP POLICY IF EXISTS "Back-office can create payment requests" ON linkme_payment_requests;
CREATE POLICY "Back-office can create payment requests" ON linkme_payment_requests
  FOR INSERT
  WITH CHECK (
    -- L'affilié doit appartenir à l'organisation de l'utilisateur back-office
    EXISTS (
      SELECT 1 FROM linkme_affiliates la
      JOIN user_profiles up ON up.organisation_id = la.organisation_id
      WHERE la.id = affiliate_id
      AND up.user_id = auth.uid()
    )
  );

-- Policy items: Back-office peut créer les items des demandes
DROP POLICY IF EXISTS "Back-office can create request items" ON linkme_payment_request_items;
CREATE POLICY "Back-office can create request items" ON linkme_payment_request_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      JOIN user_profiles up ON up.organisation_id = la.organisation_id
      WHERE pr.id = payment_request_id
      AND up.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTAIRE
-- ============================================================================
COMMENT ON POLICY "Back-office can create payment requests" ON linkme_payment_requests IS 'Permet au back-office de créer des demandes de paiement pour les affiliés de leur organisation';
COMMENT ON POLICY "Back-office can create request items" ON linkme_payment_request_items IS 'Permet au back-office de créer les items des demandes de paiement';

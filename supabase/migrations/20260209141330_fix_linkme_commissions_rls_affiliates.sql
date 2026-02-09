-- ============================================================================
-- Migration: Fix RLS linkme_commissions - Allow affiliates to view their commissions
-- Date: 2026-02-09
-- Context: Dashboard vide pour users LinkMe car policy SELECT manquante
-- Issue: Table linkme_commissions n'avait qu'une policy "staff_manage" (back-office only)
-- Solution: Ajouter policy permettant aux affiliés de voir LEURS commissions
-- ============================================================================

-- Pattern similaire à linkme_affiliates_own :
-- User LinkMe peut voir commissions si son enseigne_id OU organisation_id
-- (depuis user_app_roles) matche l'affiliate lié à la commission

CREATE POLICY "affiliates_view_own_commissions" ON linkme_commissions
  FOR SELECT TO authenticated
  USING (
    -- Staff back-office voit tout (déjà géré par policy existante)
    is_backoffice_user()
    OR
    -- Affilié voit ses commissions via affiliate_id
    EXISTS (
      SELECT 1
      FROM user_app_roles uar
      JOIN linkme_affiliates la ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND la.id = linkme_commissions.affiliate_id
    )
  );

COMMENT ON POLICY "affiliates_view_own_commissions" ON linkme_commissions IS
  'Permet aux affiliés LinkMe de voir leurs propres commissions (via enseigne_id ou organisation_id)';

-- ============================================================================
-- Vérification : Tester avec admin@pokawa-test.fr
-- ============================================================================
-- Après cette migration, admin@pokawa-test.fr (enseigne_admin Pokawa) devrait pouvoir :
-- 1. Voir l'affiliate Pokawa (déjà fonctionnel)
-- 2. Voir les commissions liées à cet affiliate (fixé ici)
-- 3. Dashboard affiche les vrais montants (pas 0,00 €)

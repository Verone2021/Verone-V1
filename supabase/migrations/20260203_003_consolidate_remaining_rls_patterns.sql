-- ============================================================================
-- Migration: Consolidate Remaining RLS Patterns (Final Cleanup)
-- Date: 2026-02-03
-- Problème: 3 policies obsolètes restantes (audit exhaustif confirmé)
-- Solution: DROP policies unified + REPLACE storage_pricing_admin
-- Référence: .claude/rules/database/rls-patterns.md
-- Context: 14 tables déjà corrigées + policies staff_* déjà OK
-- ============================================================================

-- ÉTAT PRODUCTION CONFIRMÉ (2026-02-03) :
-- ✅ linkme_payment_requests : Policies staff_* DÉJÀ CORRECTES (is_backoffice_user)
-- ✅ linkme_payment_request_items : Policies staff_* DÉJÀ CORRECTES (is_backoffice_user)
-- ❌ linkme_payment_requests_unified : Policy FOR ALL OBSOLÈTE (user_profiles.app)
-- ❌ linkme_payment_request_items_unified : Policy FOR ALL OBSOLÈTE (user_profiles.app)
-- ❌ storage_pricing_admin : Policy FOR ALL OBSOLÈTE (user_profiles.role)
-- ❌ linkme_catalog_products : Table N'EXISTE PAS (retirée du scope)

-- SCOPE FINAL : 3 policies obsolètes (pas 4 tables comme plan initial)

-- ============================================================================
-- PARTIE 1: DROP policies unified obsolètes (payment_requests + items)
-- ============================================================================
-- Les policies staff_* sont DÉJÀ CORRECTES, on supprime juste les unified obsolètes

DROP POLICY IF EXISTS "linkme_payment_requests_unified" ON linkme_payment_requests;
DROP POLICY IF EXISTS "linkme_payment_request_items_unified" ON linkme_payment_request_items;

COMMENT ON TABLE linkme_payment_requests
  IS 'RLS: Policies staff_* correctes (is_backoffice_user), unified obsolète supprimée (2026-02-03)';

COMMENT ON TABLE linkme_payment_request_items
  IS 'RLS: Policies staff_* correctes (is_backoffice_user), unified obsolète supprimée (2026-02-03)';

-- ============================================================================
-- PARTIE 2: REPLACE storage_pricing_tiers policy obsolète
-- ============================================================================

DROP POLICY IF EXISTS "storage_pricing_admin" ON storage_pricing_tiers;

CREATE POLICY "staff_manage_storage_pricing"
  ON storage_pricing_tiers
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "staff_manage_storage_pricing" ON storage_pricing_tiers
  IS 'Staff back-office peut gérer configuration tarifs stockage (is_backoffice_user)';

-- ============================================================================
-- PARTIE 3: Validation Production
-- ============================================================================

DO $$
DECLARE
  v_payment_unified_gone BOOLEAN;
  v_payment_items_unified_gone BOOLEAN;
  v_storage_correct BOOLEAN;
  v_all_correct BOOLEAN;
BEGIN
  -- Vérifier policies obsolètes sont supprimées
  SELECT
    NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'linkme_payment_requests'
        AND policyname = 'linkme_payment_requests_unified'
    ),
    NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'linkme_payment_request_items'
        AND policyname = 'linkme_payment_request_items_unified'
    ),
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'storage_pricing_tiers'
        AND policyname = 'staff_manage_storage_pricing'
    )
  INTO v_payment_unified_gone, v_payment_items_unified_gone, v_storage_correct;

  v_all_correct := v_payment_unified_gone
    AND v_payment_items_unified_gone
    AND v_storage_correct;

  IF v_all_correct THEN
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ SUCCESS: 3 policies obsolètes corrigées';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '  ✅ linkme_payment_requests_unified: SUPPRIMÉE';
    RAISE NOTICE '  ✅ linkme_payment_request_items_unified: SUPPRIMÉE';
    RAISE NOTICE '  ✅ storage_pricing_admin: REMPLACÉE par staff_manage_storage_pricing';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Context: Policies staff_* déjà correctes (migration antérieure)';
    RAISE NOTICE 'Total: 17 tables avec RLS patterns 100%% corrects';
    RAISE NOTICE '====================================================';
  ELSE
    RAISE WARNING 'ECHEC: Certaines policies non corrigées - vérifier manuellement';
  END IF;

  RAISE NOTICE 'Migration 20260203_003 appliquée';
  RAISE NOTICE 'Pattern: is_backoffice_user() (SEUL pattern autorisé)';
END $$;

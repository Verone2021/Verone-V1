-- [BO-RLS-PERF-002] Phase 2 — Faille de confidentialité individual_customers
--
-- Audit RLS (perf-optimizer 2026-05-07) a identifié que la policy
-- `linkme_users_read_individual_customers` autorise N'IMPORTE QUEL
-- utilisateur LinkMe actif (enseigne_admin, organisation_admin,
-- enseigne_collaborateur) à lire TOUS les individual_customers, sans
-- filtre sur l'enseigne ou l'organisation de l'utilisateur.
--
-- Conséquence : un affilié de l'enseigne A peut actuellement lire les
-- clients individuels de l'enseigne B. C'est une fuite de confidentialité
-- cross-enseigne.
--
-- Vérification préalable (2026-05-07) :
-- - 21 individual_customers en base
-- - 19 orphelins (enseigne_id IS NULL ET organisation_id IS NULL)
-- - Sur ces 19 orphelins, ZÉRO ne porte une commande LinkMe
-- - Donc aucun affilié LinkMe ne perdra d'accès légitime avec la nouvelle
--   policy stricte (filtre enseigne_id OR organisation_id direct).
--
-- La policy backoffice_full_access_individual_customers (FOR ALL staff,
-- déjà wrappée en Phase 1) reste inchangée — staff garde un accès complet.

BEGIN;

-- Suppression de la policy trop permissive
DROP POLICY IF EXISTS linkme_users_read_individual_customers
  ON public.individual_customers;

-- Recréation avec isolation enseigne/organisation
CREATE POLICY linkme_users_read_own_individual_customers
ON public.individual_customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'::app_type
      AND uar.is_active = true
      AND uar.role IN (
        'enseigne_admin',
        'organisation_admin',
        'enseigne_collaborateur'
      )
      AND (
        (uar.enseigne_id IS NOT NULL
         AND uar.enseigne_id = individual_customers.enseigne_id)
        OR
        (uar.organisation_id IS NOT NULL
         AND uar.organisation_id = individual_customers.organisation_id)
      )
  )
);

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
DO $$
DECLARE
  v_old_exists BOOLEAN;
  v_new_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.individual_customers'::regclass
      AND polname = 'linkme_users_read_individual_customers'
  ) INTO v_old_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.individual_customers'::regclass
      AND polname = 'linkme_users_read_own_individual_customers'
  ) INTO v_new_exists;

  RAISE NOTICE '[BO-RLS-PERF-002 Phase 2] vérifications:';
  RAISE NOTICE '  - Ancienne policy linkme_users_read_individual_customers présente: %', v_old_exists;
  RAISE NOTICE '  - Nouvelle policy linkme_users_read_own_individual_customers présente: %', v_new_exists;

  IF v_old_exists THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002 Phase 2] Ancienne policy non supprimée — migration incomplète.';
  END IF;
  IF NOT v_new_exists THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002 Phase 2] Nouvelle policy absente — migration incomplète.';
  END IF;
END $$;

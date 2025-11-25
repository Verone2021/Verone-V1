-- =====================================================
-- MIGRATION : Suppression contrainte organisation bloquante
-- Date: 2025-11-24
-- Priority: P0 - BLOQUANT
-- =====================================================
-- RAISON : Contrainte empêche création utilisateurs admin/owner back-office
-- PROBLÈME : Salariés Vérone (Romeo, etc.) ne sont PAS liés à une organisation
-- IMPACT : Impossible de créer des utilisateurs avec organisation_id = NULL
-- SOLUTION : Supprimer contrainte, validation métier en application layer
-- =====================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : Supprimer la contrainte bloquante
-- =============================================================================

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_organisation_required_for_admin;

-- =============================================================================
-- ÉTAPE 2 : Documenter le changement
-- =============================================================================

COMMENT ON COLUMN user_profiles.organisation_id IS
'Organisation de rattachement.
- NULL: Salariés back-office Vérone (accès CRM/ERP complet, gestion multi-organisations)
- NOT NULL: Utilisateurs liés à une organisation cliente/fournisseur (accès limité à leur organisation)

Validation métier:
- Les admin/owner back-office (NULL) ont accès à toutes les organisations
- Les admin/owner organisations (NOT NULL) ont accès uniquement à leur organisation
- La validation du rattachement se fait en application layer (RLS policies)';

-- =============================================================================
-- ÉTAPE 3 : Log de confirmation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 20251124_008 : CONTRAINTE SUPPRIMÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🔓 Contrainte supprimée : check_organisation_required_for_admin';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Impact :';
    RAISE NOTICE '   - Les utilisateurs admin/owner peuvent avoir organisation_id = NULL';
    RAISE NOTICE '   - Salariés back-office Vérone débloqués';
    RAISE NOTICE '   - Utilisateurs organisations inchangés (organisation_id NOT NULL)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Validation métier :';
    RAISE NOTICE '   - Déplacée vers application layer (RLS policies)';
    RAISE NOTICE '   - Distinction back-office vs organisation via organisation_id NULL/NOT NULL';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Création utilisateurs back-office maintenant possible';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- VALIDATION FINALE
-- =============================================================================

-- Vérifier que la contrainte a bien été supprimée
DO $$
DECLARE
    v_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'user_profiles'::regclass
          AND conname = 'check_organisation_required_for_admin'
    ) INTO v_constraint_exists;

    IF v_constraint_exists THEN
        RAISE EXCEPTION '❌ ÉCHEC: La contrainte n''a pas été supprimée';
    ELSE
        RAISE NOTICE '✅ VALIDATION: Contrainte bien supprimée';
    END IF;
END $$;

COMMIT;

-- =============================================================================
-- TESTS POST-MIGRATION (À EXÉCUTER MANUELLEMENT)
-- =============================================================================

-- Test 1: Créer un admin back-office avec organisation_id = NULL
-- (doit réussir maintenant)
/*
BEGIN;

INSERT INTO user_profiles (id, email, role, organisation_id, first_name, last_name)
VALUES (
  gen_random_uuid(),
  'test.admin@verone.internal',
  'admin',
  NULL,
  'Test',
  'Admin'
);

-- Vérifier création
SELECT id, email, role, organisation_id FROM user_profiles WHERE email = 'test.admin@verone.internal';

-- Rollback (juste un test)
ROLLBACK;
*/

-- Test 2: Créer un admin organisation avec organisation_id NOT NULL
-- (doit réussir comme avant)
/*
BEGIN;

INSERT INTO user_profiles (id, email, role, organisation_id, first_name, last_name)
VALUES (
  gen_random_uuid(),
  'admin@organisation-test.fr',
  'admin',
  (SELECT id FROM organisations WHERE type = 'customer' LIMIT 1),
  'Admin',
  'Organisation'
);

-- Vérifier création
SELECT id, email, role, organisation_id FROM user_profiles WHERE email = 'admin@organisation-test.fr';

-- Rollback (juste un test)
ROLLBACK;
*/

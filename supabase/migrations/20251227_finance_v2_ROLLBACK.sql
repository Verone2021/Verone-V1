-- =====================================================================
-- ROLLBACK: Finance v2 - Annuler TOUTES les modifications
-- Date: 2025-12-27
-- =====================================================================
--
-- QUAND UTILISER CE SCRIPT:
-- - Si la v2 cause des problèmes en production
-- - Si on doit revenir à l'état avant Finance v2
-- - En cas d'urgence
--
-- PRÉREQUIS:
-- - Avoir un backup ou snapshot Supabase récent
-- - Tester d'abord en staging si possible
--
-- ORDRE D'EXÉCUTION:
-- 1. D'abord: Désactiver feature flag NEXT_PUBLIC_FINANCE_V2=false
-- 2. Ensuite: Exécuter ce script section par section
-- =====================================================================

-- =====================================================================
-- SECTION 1: Restaurer les enrichissements depuis l'audit
-- =====================================================================

-- Restaure les valeurs AVANT le reset v2
-- Conditions: action='reset' ET reason='Finance v2 initial reset'

DO $$
DECLARE
  v_count INTEGER := 0;
  v_audit RECORD;
BEGIN
  FOR v_audit IN
    SELECT
      transaction_id,
      before_json
    FROM bank_transactions_enrichment_audit
    WHERE action = 'reset'
      AND reason = 'Finance v2 initial reset'
  LOOP
    UPDATE bank_transactions
    SET
      category_pcg = (v_audit.before_json->>'category_pcg'),
      counterparty_organisation_id = (v_audit.before_json->>'counterparty_organisation_id')::uuid,
      matching_status = COALESCE(
        (v_audit.before_json->>'matching_status')::matching_status,
        'unmatched'
      ),
      matched_document_id = (v_audit.before_json->>'matched_document_id')::uuid,
      confidence_score = (v_audit.before_json->>'confidence_score')::integer,
      match_reason = (v_audit.before_json->>'match_reason')
    WHERE id = v_audit.transaction_id;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Restauré % transactions depuis l''audit', v_count;
END $$;

-- Vérification après restauration
DO $$
DECLARE
  v_restored INTEGER;
  v_with_pcg INTEGER;
  v_with_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_restored
  FROM bank_transactions
  WHERE category_pcg IS NOT NULL
     OR counterparty_organisation_id IS NOT NULL;

  SELECT COUNT(*) INTO v_with_pcg
  FROM bank_transactions WHERE category_pcg IS NOT NULL;

  SELECT COUNT(*) INTO v_with_org
  FROM bank_transactions WHERE counterparty_organisation_id IS NOT NULL;

  RAISE NOTICE 'Vérification: % transactions enrichies (% avec PCG, % avec org)',
    v_restored, v_with_pcg, v_with_org;
END $$;

-- =====================================================================
-- SECTION 2: Supprimer la vue et les fonctions v2
-- =====================================================================

-- Vue unifiée
DROP VIEW IF EXISTS v_transactions_unified CASCADE;

-- Fonctions
DROP FUNCTION IF EXISTS get_transactions_stats(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS search_transactions(TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER, UUID, INTEGER, INTEGER) CASCADE;

-- =====================================================================
-- SECTION 3: Supprimer la table d'audit (OPTIONNEL - à exécuter après validation)
-- =====================================================================

-- ATTENTION: Exécuter SEULEMENT si vous êtes sûr de ne plus avoir besoin de l'audit
-- Commenté par défaut pour sécurité

-- DROP TABLE IF EXISTS bank_transactions_enrichment_audit CASCADE;

-- =====================================================================
-- SECTION 4: Vérification finale
-- =====================================================================

DO $$
DECLARE
  v_view_exists BOOLEAN;
  v_func1_exists BOOLEAN;
  v_func2_exists BOOLEAN;
  v_audit_exists BOOLEAN;
BEGIN
  -- Vérifier que la vue n'existe plus
  SELECT EXISTS(
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'v_transactions_unified'
  ) INTO v_view_exists;

  -- Vérifier que les fonctions n'existent plus
  SELECT EXISTS(
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'get_transactions_stats'
  ) INTO v_func1_exists;

  SELECT EXISTS(
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'search_transactions'
  ) INTO v_func2_exists;

  -- Vérifier que l'audit existe toujours (pour sécurité)
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'bank_transactions_enrichment_audit'
  ) INTO v_audit_exists;

  RAISE NOTICE '=== ROLLBACK VERIFICATION ===';
  RAISE NOTICE 'Vue v_transactions_unified: %', CASE WHEN v_view_exists THEN 'EXISTE (ERREUR)' ELSE 'SUPPRIMÉE (OK)' END;
  RAISE NOTICE 'Fonction get_transactions_stats: %', CASE WHEN v_func1_exists THEN 'EXISTE (ERREUR)' ELSE 'SUPPRIMÉE (OK)' END;
  RAISE NOTICE 'Fonction search_transactions: %', CASE WHEN v_func2_exists THEN 'EXISTE (ERREUR)' ELSE 'SUPPRIMÉE (OK)' END;
  RAISE NOTICE 'Table audit: %', CASE WHEN v_audit_exists THEN 'CONSERVÉE (OK)' ELSE 'SUPPRIMÉE' END;
  RAISE NOTICE '=============================';
END $$;

-- =====================================================================
-- FIN DU ROLLBACK
-- =====================================================================
--
-- ÉTAPES POST-ROLLBACK:
-- 1. Vérifier que /finance/transactions fonctionne (legacy)
-- 2. Vérifier les KPIs dans le dashboard
-- 3. Tester la classification manuelle
-- 4. Si tout OK, supprimer la table audit (Section 3)
--
-- =====================================================================

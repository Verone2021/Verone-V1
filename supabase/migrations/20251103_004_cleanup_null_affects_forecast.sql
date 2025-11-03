-- Migration: Nettoyage valeurs NULL dans affects_forecast
-- Date: 2025-11-03
-- Auteur: Claude Code
-- Context: Corriger données historiques pour éviter exclusion par .eq(false)
--
-- Problème: Mouvements avant 2025-09-18 ont affects_forecast = NULL
-- Cause: Colonne ajoutée après création mouvements initiaux
-- Impact: .eq('affects_forecast', false) exclut ces mouvements historiques
-- Solution: SET affects_forecast = false WHERE NULL (mouvements réels historiques)

BEGIN;

-- =============================================
-- ÉTAPE 1 : ANALYSE PRÉ-MIGRATION
-- =============================================

DO $$
DECLARE
  v_null_count INTEGER;
  v_total_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ANALYSE PRÉ-MIGRATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Compter mouvements NULL
  SELECT COUNT(*) INTO v_null_count
  FROM stock_movements
  WHERE affects_forecast IS NULL;

  -- Compter total mouvements
  SELECT COUNT(*) INTO v_total_count
  FROM stock_movements;

  RAISE NOTICE 'Total mouvements: %', v_total_count;
  RAISE NOTICE 'Mouvements avec affects_forecast = NULL: %', v_null_count;
  RAISE NOTICE 'Pourcentage NULL: %%%', ROUND((v_null_count::numeric / NULLIF(v_total_count, 0)) * 100, 2);
  RAISE NOTICE '';

  IF v_null_count = 0 THEN
    RAISE NOTICE '✅ Aucun mouvement NULL - Migration déjà appliquée ou pas nécessaire';
  END IF;
END $$;

-- =============================================
-- ÉTAPE 2 : MISE À JOUR DONNÉES NULL
-- =============================================

-- Mettre à jour affects_forecast = false pour mouvements NULL
-- Rationale : Tous les mouvements historiques sont des mouvements RÉELS
-- (pas de prévisionnel avant implémentation colonne le 2025-09-18)

UPDATE stock_movements
SET
  affects_forecast = false,  -- Mouvements réels
  forecast_type = null,      -- Pas de direction prévisionnel
  updated_at = NOW()
WHERE affects_forecast IS NULL;

-- =============================================
-- ÉTAPE 3 : VALIDATION POST-MIGRATION
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER;
  v_remaining_null INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDATION POST-MIGRATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Compter lignes mises à jour (via updated_at récent)
  SELECT COUNT(*) INTO v_updated_count
  FROM stock_movements
  WHERE affects_forecast = false
    AND updated_at >= NOW() - INTERVAL '10 seconds';

  -- Vérifier qu'il ne reste plus de NULL
  SELECT COUNT(*) INTO v_remaining_null
  FROM stock_movements
  WHERE affects_forecast IS NULL;

  RAISE NOTICE 'Lignes mises à jour: %', v_updated_count;
  RAISE NOTICE 'Mouvements NULL restants: %', v_remaining_null;
  RAISE NOTICE '';

  IF v_remaining_null > 0 THEN
    RAISE EXCEPTION '❌ ÉCHEC: % mouvements NULL restants après migration', v_remaining_null;
  END IF;

  RAISE NOTICE '✅ Migration réussie: Tous les mouvements ont affects_forecast défini';
  RAISE NOTICE '';
END $$;

-- =============================================
-- ÉTAPE 4 : CONTRAINTE OPTIONNELLE (RECOMMANDÉ)
-- =============================================

-- Ajouter contrainte NOT NULL pour éviter futurs NULL
-- (À activer si tous les INSERT définissent explicitement affects_forecast)

-- ALTER TABLE stock_movements
-- ALTER COLUMN affects_forecast SET NOT NULL;
--
-- COMMENT: Décommenter cette ligne pour forcer affects_forecast NOT NULL
-- ATTENTION: Nécessite que tous les INSERT existants définissent explicitement la valeur

COMMIT;

-- =============================================
-- DOCUMENTATION POST-MIGRATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 MIGRATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Données historiques normalisées: NULL → false';
  RAISE NOTICE '✅ Queries .or() maintenant compatibles avec données complètes';
  RAISE NOTICE '✅ Aucune régression attendue (mouvements historiques = réels)';
  RAISE NOTICE '';
  RAISE NOTICE 'Impact:';
  RAISE NOTICE '  - Page /stocks/mouvements affiche maintenant TOUS mouvements réels';
  RAISE NOTICE '  - Stats incluent données historiques complètes';
  RAISE NOTICE '  - Exports incluent historique complet';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '  1. Tester page /stocks/mouvements (vérifier tous mouvements visibles)';
  RAISE NOTICE '  2. Vérifier stats (comparer avant/après)';
  RAISE NOTICE '  3. Si validation OK → Activer contrainte NOT NULL (ligne 104)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

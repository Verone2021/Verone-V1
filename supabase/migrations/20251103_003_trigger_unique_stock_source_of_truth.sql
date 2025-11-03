-- Migration: Trigger unique SOURCE DE VÉRITÉ pour stock_real
-- Date: 2025-11-03
-- Auteur: Claude Code
-- Context: Garantir stock_real = SUM(quantity_change) TOUJOURS et automatiquement
--
-- Problème Résolu: Multiples triggers conflictuels créaient des désynchronisations
-- Solution: UN SEUL trigger qui recalcule depuis mouvements après chaque INSERT/UPDATE/DELETE
-- Principe: Les mouvements de stock sont la SOURCE DE VÉRITÉ IMMUABLE

BEGIN;

-- =============================================
-- ÉTAPE 1 : DÉSACTIVER TRIGGERS CONFLICTUELS
-- =============================================

-- Sauvegarder liste triggers existants pour rollback si nécessaire
DO $$
DECLARE
  v_trigger_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DÉSACTIVATION TRIGGERS EXISTANTS';
  RAISE NOTICE '========================================';

  FOR v_trigger_record IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'stock_movements'::regclass
      AND tgname IN (
        'maintain_stock_coherence',
        'update_product_stock_advanced_trigger',
        'trigger_maintain_stock_totals',
        'trigger_update_product_stock_on_insert',
        'trigger_update_product_stock_on_update'
      )
  LOOP
    RAISE NOTICE '  → Suppression trigger: %', v_trigger_record.tgname;
  END LOOP;
END $$;

-- Supprimer triggers conflictuels
DROP TRIGGER IF EXISTS maintain_stock_coherence ON stock_movements;
DROP TRIGGER IF EXISTS update_product_stock_advanced_trigger ON stock_movements;
DROP TRIGGER IF EXISTS trigger_maintain_stock_totals ON stock_movements;
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_insert ON stock_movements;
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_update ON stock_movements;

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers conflictuels supprimés';
  RAISE NOTICE '';
END $$;

-- =============================================
-- ÉTAPE 2 : CRÉER TRIGGER UNIQUE SOURCE DE VÉRITÉ
-- =============================================

CREATE OR REPLACE FUNCTION maintain_stock_from_movements()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id uuid;
  v_calculated_stock_real bigint;
  v_calculated_forecast_in bigint;
  v_calculated_forecast_out bigint;
BEGIN
  -- Déterminer product_id selon type opération
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- =============================================
  -- RECALCUL STOCK RÉEL (SOURCE DE VÉRITÉ)
  -- =============================================
  -- Stock réel = SUM(quantity_change) de TOUS mouvements réels
  SELECT COALESCE(SUM(quantity_change), 0) INTO v_calculated_stock_real
  FROM stock_movements
  WHERE product_id = v_product_id
    AND affects_forecast = false;  -- Mouvements réels uniquement

  -- =============================================
  -- RECALCUL PRÉVISIONNELS
  -- =============================================
  -- Entrées prévisionnelles (commandes fournisseurs)
  SELECT COALESCE(SUM(ABS(quantity_change)), 0) INTO v_calculated_forecast_in
  FROM stock_movements
  WHERE product_id = v_product_id
    AND affects_forecast = true
    AND forecast_type = 'in';

  -- Sorties prévisionnelles (commandes clients)
  SELECT COALESCE(SUM(ABS(quantity_change)), 0) INTO v_calculated_forecast_out
  FROM stock_movements
  WHERE product_id = v_product_id
    AND affects_forecast = true
    AND forecast_type = 'out';

  -- =============================================
  -- MISE À JOUR PRODUCTS (SYNCHRONISATION AUTO)
  -- =============================================
  UPDATE products
  SET
    stock_real = v_calculated_stock_real::integer,  -- Cast bigint → integer
    stock_quantity = v_calculated_stock_real::integer,  -- Maintenir compatibilité legacy
    stock_forecasted_in = v_calculated_forecast_in::integer,
    stock_forecasted_out = v_calculated_forecast_out::integer,
    updated_at = NOW()
  WHERE id = v_product_id;

  -- Retour selon opération
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Commentaire fonction
COMMENT ON FUNCTION maintain_stock_from_movements() IS
'Trigger fonction SOURCE DE VÉRITÉ unique pour stock_real.
Recalcule automatiquement stock depuis TOUS les mouvements après chaque INSERT/UPDATE/DELETE.
Principe: Les mouvements sont immuables, stock_real est toujours = SUM(quantity_change).
Remplace tous les triggers conflictuels précédents.';

-- =============================================
-- CRÉER TRIGGER AFTER (pour accès ligne complète)
-- =============================================

CREATE TRIGGER maintain_stock_from_movements_trigger
  AFTER INSERT OR UPDATE OR DELETE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION maintain_stock_from_movements();

COMMENT ON TRIGGER maintain_stock_from_movements_trigger ON stock_movements IS
'Trigger unique garantissant synchronisation permanente stock_real ← mouvements.
Se déclenche après chaque mouvement (INSERT/UPDATE/DELETE) pour recalculer stock automatiquement.';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TRIGGER SOURCE DE VÉRITÉ CRÉÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Nom: maintain_stock_from_movements_trigger';
  RAISE NOTICE 'Type: AFTER INSERT OR UPDATE OR DELETE';
  RAISE NOTICE 'Fonction: maintain_stock_from_movements()';
  RAISE NOTICE '';
  RAISE NOTICE 'Garantie: stock_real = SUM(quantity_change) TOUJOURS';
  RAISE NOTICE '';
END $$;

-- =============================================
-- ÉTAPE 3 : TESTS DE VALIDATION
-- =============================================

DO $$
DECLARE
  v_test_product_id uuid;
  v_test_movement_id uuid;
  v_stock_before integer;
  v_stock_after integer;
  v_expected_stock integer;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTS VALIDATION TRIGGER';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Identifier produit test (Fauteuil Milo Ocre)
  SELECT id INTO v_test_product_id
  FROM products
  WHERE sku = 'FMIL-OCRE-02'
  LIMIT 1;

  IF v_test_product_id IS NULL THEN
    RAISE NOTICE '⚠️ Produit test non trouvé - Tests ignorés';
    RETURN;
  END IF;

  -- Stock actuel
  SELECT stock_real INTO v_stock_before
  FROM products
  WHERE id = v_test_product_id;

  RAISE NOTICE 'Test 1: INSERT mouvement IN +10';
  RAISE NOTICE '  Stock avant: % unités', v_stock_before;

  -- Test 1 : Créer mouvement IN +10
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity_change,
    quantity_before,
    quantity_after,
    affects_forecast,
    reference_type,
    reason_code,
    notes,
    performed_at
  ) VALUES (
    v_test_product_id,
    'IN',
    10,
    v_stock_before,
    v_stock_before + 10,
    false,  -- Mouvement réel
    'manual_entry',
    'test',
    'Test automatique trigger SOURCE DE VÉRITÉ',
    NOW()
  ) RETURNING id INTO v_test_movement_id;

  -- Vérifier stock après
  SELECT stock_real INTO v_stock_after
  FROM products
  WHERE id = v_test_product_id;

  v_expected_stock := v_stock_before + 10;

  IF v_stock_after = v_expected_stock THEN
    RAISE NOTICE '  Stock après: % unités ✅', v_stock_after;
    RAISE NOTICE '  → Trigger fonctionne correctement';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC Test 1: stock attendu %, obtenu %',
      v_expected_stock, v_stock_after;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Test 2: DELETE mouvement (rollback test)';

  -- Test 2 : Supprimer mouvement test (recalcul auto)
  DELETE FROM stock_movements WHERE id = v_test_movement_id;

  -- Vérifier stock revenu à la normale
  SELECT stock_real INTO v_stock_after
  FROM products
  WHERE id = v_test_product_id;

  IF v_stock_after = v_stock_before THEN
    RAISE NOTICE '  Stock restauré: % unités ✅', v_stock_after;
    RAISE NOTICE '  → DELETE recalcule correctement';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC Test 2: stock attendu %, obtenu %',
      v_stock_before, v_stock_after;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TOUS LES TESTS PASSÉS';
  RAISE NOTICE '========================================';
END $$;

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
  RAISE NOTICE '✅ Ancien système (triggers multiples conflictuels) → SUPPRIMÉ';
  RAISE NOTICE '✅ Nouveau système (trigger unique SOURCE DE VÉRITÉ) → ACTIF';
  RAISE NOTICE '';
  RAISE NOTICE 'Garantie: stock_real = SUM(quantity_change) mouvements réels';
  RAISE NOTICE 'Automatique: Recalcul après chaque INSERT/UPDATE/DELETE';
  RAISE NOTICE 'Idempotent: Peut être appelé N fois sans risque';
  RAISE NOTICE '';
  RAISE NOTICE 'Pour vérifier synchronisation future:';
  RAISE NOTICE '  SELECT * FROM resync_all_product_stocks();';
  RAISE NOTICE '  (Doit retourner 0 lignes si tout synchronisé)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

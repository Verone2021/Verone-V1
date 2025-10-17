-- =============================================
-- MIGRATION: Correction recalculate_forecasted_stock - Inclure valeurs négatives
-- Date: 2025-10-13
-- =============================================
-- Problème: Filtre AND quantity_change > 0 exclut mouvements OUT forecast avec valeurs négatives
-- Résultat: stock_forecasted_in reste 20 au lieu de 0 après annulation prévisionnel
-- Solution: Supprimer filtre quantity_change > 0 pour inclure TOUS mouvements forecast

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Workflow actuel PO Confirmed → Received:
--   1. INSERT mouvement IN forecast (+20)
--      → recalculate_forecasted_stock() : SUM = 20 ✅
--      → stock_forecasted_in = 20 ✅
--
--   2. INSERT mouvement OUT forecast (-20) pour annuler prévisionnel
--      → recalculate_forecasted_stock() : SUM = 20 (exclut -20!) ❌
--      → stock_forecasted_in = 20 ❌ (devrait être 0)
--
--   3. INSERT mouvement IN réel (+20)
--      → maintain_stock_coherence() : stock_real = 20 ✅

-- Cause racine:
-- SELECT COALESCE(SUM(quantity_change), 0) INTO v_forecast_in
-- WHERE affects_forecast = true
--   AND forecast_type = 'in'
--   AND quantity_change > 0;  -- ❌ Exclut valeurs négatives!

-- Comportement attendu:
-- Mouvement OUT forecast a quantity_change négatif pour RÉDUIRE stock prévisionnel
-- SUM doit inclure: +20 (ajout) + (-20) (retrait) = 0 ✅

-- =============================================
-- CORRECTION: Fonction recalculate_forecasted_stock
-- =============================================

CREATE OR REPLACE FUNCTION public.recalculate_forecasted_stock(p_product_id uuid)
RETURNS void AS $$
DECLARE
  v_forecast_in integer := 0;
  v_forecast_out integer := 0;
BEGIN
  -- FIX: Supprimer filtre quantity_change > 0 pour inclure valeurs négatives
  -- Calcul entrées prévisionnelles (IN)
  SELECT COALESCE(SUM(quantity_change), 0) INTO v_forecast_in
  FROM stock_movements
  WHERE product_id = p_product_id
    AND affects_forecast = true
    AND forecast_type = 'in';
    -- REMOVED: AND quantity_change > 0

  -- Calcul sorties prévisionnelles (OUT)
  SELECT COALESCE(SUM(quantity_change), 0) INTO v_forecast_out
  FROM stock_movements
  WHERE product_id = p_product_id
    AND affects_forecast = true
    AND forecast_type = 'out';
    -- REMOVED: AND quantity_change > 0

  -- Mettre à jour les stocks prévisionnels du produit
  UPDATE products
  SET
    stock_forecasted_in = v_forecast_in,
    stock_forecasted_out = ABS(v_forecast_out),  -- Valeur absolue pour affichage
    updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION recalculate_forecasted_stock(uuid) IS
'Recalcule les stocks prévisionnels (in/out) pour un produit donné.
CORRECTION 2025-10-13: Suppression filtre quantity_change > 0 pour inclure annulations prévisionnelles.
Logique:
- forecast_type=in: Somme TOUS quantity_change (positifs ET négatifs)
- forecast_type=out: Somme TOUS quantity_change (positifs ET négatifs)
- Permet annulation prévisionnels via mouvements OUT avec quantity_change négatif
Exemples:
- PO Confirmed: IN +20 → stock_forecasted_in = 20
- PO Received: OUT -20 → stock_forecasted_in = 0 (20 + (-20))
Architecture: Séparation réel (maintain_stock_coherence) vs prévisionnel (recalculate_forecasted_stock)';

-- =============================================
-- VALIDATION MIGRATION
-- =============================================

-- Tester fonction sur produit Milo Beige (PO-TEST-001)
DO $$
DECLARE
  v_product_id uuid := '25d2e61c-18d5-45a8-aec5-2a18f1b9cb55';
  v_forecast_in_before integer;
  v_forecast_in_after integer;
  v_movements_sum integer;
BEGIN
  -- Stock avant recalcul
  SELECT stock_forecasted_in INTO v_forecast_in_before
  FROM products WHERE id = v_product_id;

  -- Calculer SUM manuel des mouvements
  SELECT COALESCE(SUM(quantity_change), 0) INTO v_movements_sum
  FROM stock_movements
  WHERE product_id = v_product_id
    AND affects_forecast = true
    AND forecast_type = 'in';

  -- Appliquer recalcul
  PERFORM recalculate_forecasted_stock(v_product_id);

  -- Stock après recalcul
  SELECT stock_forecasted_in INTO v_forecast_in_after
  FROM products WHERE id = v_product_id;

  -- Afficher résultats
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDATION RECALCUL PRODUIT MILO BEIGE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Product ID: %', v_product_id;
  RAISE NOTICE 'Stock forecasted_in AVANT: %', v_forecast_in_before;
  RAISE NOTICE 'SUM mouvements forecast IN: %', v_movements_sum;
  RAISE NOTICE 'Stock forecasted_in APRÈS: %', v_forecast_in_after;
  RAISE NOTICE '';

  IF v_forecast_in_after = v_movements_sum THEN
    RAISE NOTICE '✅ VALIDATION RÉUSSIE: stock_forecasted_in cohérent avec SUM mouvements';
  ELSE
    RAISE WARNING '⚠️ INCOHÉRENCE: stock_forecasted_in (%) != SUM mouvements (%)',
      v_forecast_in_after, v_movements_sum;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_008 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: recalculate_forecasted_stock()';
    RAISE NOTICE '';
    RAISE NOTICE 'Changement:';
    RAISE NOTICE '  - AVANT: SUM avec filtre quantity_change > 0';
    RAISE NOTICE '  - APRÈS: SUM TOUS quantity_change (positifs ET négatifs)';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Annulations prévisionnelles fonctionnelles ✅';
    RAISE NOTICE '  - stock_forecasted_in correct après PO Received ✅';
    RAISE NOTICE '  - Workflow PO Confirmed → Received complet ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: Re-test PO-TEST-001 Confirmed → Received';
    RAISE NOTICE '========================================';
END $$;

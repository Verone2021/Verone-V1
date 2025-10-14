-- =============================================
-- MIGRATION: Correction Contrainte valid_quantity_logic
-- Date: 2025-10-13
-- =============================================
-- Problème: Contrainte force quantity_change > 0 pour mouvements forecast OUT
-- Résultat: Impossible d'annuler les prévisionnels (workflow Confirmed → Received bloqué)
-- Solution: Autoriser quantity_change < 0 pour forecast OUT (cohérence mathématique)

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Contrainte actuelle pour affects_forecast=true:
--   ((movement_type = 'OUT') AND (quantity_change > 0))  ← Force POSITIF ❌
--
-- Logique métier correcte:
--   1. PO Confirmed: INSERT mouvement IN (+10, affects_forecast=true)
--      → recalculate: stock_forecasted_in = SUM(10) = 10 ✅
--
--   2. PO Received: INSERT mouvement OUT (-10, affects_forecast=true)
--      → recalculate: stock_forecasted_in = SUM(10 + (-10)) = 0 ✅
--
-- Avec contrainte actuelle (force +10):
--   → recalculate: stock_forecasted_in = SUM(10 + 10) = 20 ❌ (FAUX!)
--
-- Conclusion: Contrainte est TROP RESTRICTIVE et INCORRECTE

-- =============================================
-- SUPPRESSION ANCIENNE CONTRAINTE
-- =============================================

ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS valid_quantity_logic;

RAISE NOTICE '✅ Ancienne contrainte valid_quantity_logic supprimée';

-- =============================================
-- CRÉATION NOUVELLE CONTRAINTE CORRIGÉE
-- =============================================

ALTER TABLE stock_movements
ADD CONSTRAINT valid_quantity_logic CHECK (
  -- MOUVEMENTS RÉELS (affects_forecast = false)
  -- Logique complète avec quantity_before/after
  (
    (affects_forecast = false) AND (
      -- IN: quantity_change positif, calcul cohérent
      (
        (movement_type = 'IN') AND
        (quantity_change > 0) AND
        (quantity_after = (quantity_before + quantity_change))
      ) OR
      -- OUT: quantity_change négatif, calcul cohérent
      (
        (movement_type = 'OUT') AND
        (quantity_change < 0) AND
        (quantity_after = (quantity_before + quantity_change))
      ) OR
      -- ADJUST: quantity_after >= 0 (stock ne peut pas être négatif)
      (
        (movement_type = 'ADJUST') AND
        (quantity_after >= 0)
      ) OR
      -- TRANSFER: quantity_after >= 0
      (
        (movement_type = 'TRANSFER') AND
        (quantity_after >= 0)
      )
    )
  ) OR
  -- MOUVEMENTS PRÉVISIONNELS (affects_forecast = true)
  -- Logique simplifiée: quantity_before/after non utilisés (toujours 0)
  (
    (affects_forecast = true) AND (
      -- IN: quantity_change positif (ajout prévisionnel)
      (
        (movement_type = 'IN') AND
        (quantity_change > 0)
      ) OR
      -- OUT: quantity_change négatif (annulation prévisionnel) ← FIX ICI
      (
        (movement_type = 'OUT') AND
        (quantity_change < 0)
      ) OR
      -- ADJUST: pas de restriction spécifique
      (movement_type = 'ADJUST') OR
      -- TRANSFER: pas de restriction spécifique
      (movement_type = 'TRANSFER')
    )
  )
);

RAISE NOTICE '✅ Nouvelle contrainte valid_quantity_logic créée avec logique corrigée';

-- =============================================
-- COMMENTAIRE CONTRAINTE
-- =============================================

COMMENT ON CONSTRAINT valid_quantity_logic ON stock_movements IS
'Contrainte validant la cohérence des mouvements stock selon leur type et nature (réel/prévisionnel).
CORRECTION 2025-10-13: Mouvements forecast OUT peuvent avoir quantity_change négatif pour annuler prévisionnels.
Logique:
- Mouvements réels (affects_forecast=false): validation complète quantity_before/after
  * IN: quantity_change > 0, calcul: after = before + change
  * OUT: quantity_change < 0, calcul: after = before + change
  * ADJUST/TRANSFER: after >= 0
- Mouvements prévisionnels (affects_forecast=true): validation simplifiée
  * IN: quantity_change > 0 (création prévisionnel)
  * OUT: quantity_change < 0 (annulation prévisionnel) ← FIX
  * ADJUST/TRANSFER: pas de restriction
Architecture: Séparation claire réel (maintain_stock_coherence) vs prévisionnel (recalculate_forecasted_stock)';

-- =============================================
-- VALIDATION ARCHITECTURE
-- =============================================

DO $$
BEGIN
    -- Vérifier que la contrainte existe bien
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'valid_quantity_logic'
        AND table_name = 'stock_movements'
    ) THEN
        RAISE NOTICE '✅ Contrainte valid_quantity_logic active et corrigée';
    ELSE
        RAISE EXCEPTION '❌ ERREUR: Contrainte valid_quantity_logic introuvable!';
    END IF;
END $$;

-- =============================================
-- TESTS RECOMMANDÉS POST-MIGRATION
-- =============================================

-- Test 1: Mouvement forecast IN (création prévisionnel)
-- INSERT INTO stock_movements (
--     product_id, movement_type, quantity_change,
--     affects_forecast, forecast_type
-- ) VALUES (
--     'product-uuid', 'IN', 10,  -- quantity_change POSITIF ✅
--     true, 'in'
-- );
-- Attendu: Insertion réussie

-- Test 2: Mouvement forecast OUT (annulation prévisionnel)
-- INSERT INTO stock_movements (
--     product_id, movement_type, quantity_change,
--     affects_forecast, forecast_type
-- ) VALUES (
--     'product-uuid', 'OUT', -10,  -- quantity_change NÉGATIF ✅
--     true, 'in'
-- );
-- Attendu: Insertion réussie (ÉTAIT BLOQUÉ AVANT FIX)

-- Test 3: Workflow PO Confirmed → Received
-- UPDATE purchase_orders SET status = 'received' WHERE po_number = 'PO-TEST';
-- Attendu:
-- - 2 mouvements créés (OUT forecast -10, IN réel +10)
-- - stock_forecasted_in = 0
-- - stock_real = 10

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_005 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Contrainte corrigée: valid_quantity_logic';
    RAISE NOTICE '';
    RAISE NOTICE 'Changement:';
    RAISE NOTICE '  - AVANT: forecast OUT require quantity_change > 0 (POSITIF)';
    RAISE NOTICE '  - APRÈS: forecast OUT require quantity_change < 0 (NÉGATIF)';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Annulation prévisionnels débloquée ✅';
    RAISE NOTICE '  - Workflow PO Confirmed → Received fonctionnel ✅';
    RAISE NOTICE '  - Calcul stock_forecasted_in cohérent (SUM correct) ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Logique mathématique:';
    RAISE NOTICE '  - Création: IN +10 → SUM = 10';
    RAISE NOTICE '  - Annulation: OUT -10 → SUM = 10 + (-10) = 0 ✅';
    RAISE NOTICE '  - (Avant fix: OUT +10 → SUM = 10 + 10 = 20 ❌)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: PO Confirmed → Received (conversion complète)';
    RAISE NOTICE '========================================';
END $$;

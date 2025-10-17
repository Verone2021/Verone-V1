-- =============================================
-- MIGRATION: Correction maintain_stock_coherence - Filter affects_forecast
-- Date: 2025-10-13
-- =============================================
-- Problème: maintain_stock_coherence() s'applique à TOUS les mouvements, même ceux avec affects_forecast=true
-- qui ne devraient affecter QUE les stocks prévisionnels (stock_forecasted_in/out)
-- Résultat: Mouvements prévisionnels modifient stock_real → stock_real devient négatif
-- Solution: maintain_stock_coherence() ne doit s'exécuter QUE si affects_forecast=false

-- =============================================
-- CORRECTION: Fonction maintain_stock_coherence
-- =============================================

CREATE OR REPLACE FUNCTION public.maintain_stock_coherence()
RETURNS TRIGGER AS $$
DECLARE
  calculated_stock integer;
BEGIN
  -- FIX: Ne traiter que les mouvements qui affectent le stock réel
  -- Les mouvements avec affects_forecast=true sont gérés par recalculate_forecasted_stock()
  IF NEW.affects_forecast = true THEN
    -- Mouvement prévisionnel: ne pas modifier stock_real
    -- Laisser recalculate_forecasted_stock() gérer stock_forecasted_in/out
    RETURN NEW;
  END IF;

  -- Recalculer le stock basé sur tous les mouvements RÉELS (affects_forecast=false)
  calculated_stock := get_calculated_stock_from_movements(NEW.product_id);

  -- Ajouter le nouveau mouvement au calcul
  -- IMPORTANT: quantity_change est NÉGATIF pour OUT, donc on ADDITIONNE
  CASE NEW.movement_type
    WHEN 'IN' THEN
      calculated_stock := calculated_stock + NEW.quantity_change;
    WHEN 'OUT' THEN
      calculated_stock := calculated_stock + NEW.quantity_change; -- + car quantity_change est négatif
    WHEN 'ADJUST' THEN
      calculated_stock := NEW.quantity_after; -- Pour les ajustements, utiliser la valeur fournie
    WHEN 'TRANSFER' THEN
      calculated_stock := calculated_stock + NEW.quantity_change;
  END CASE;

  -- Mettre à jour automatiquement le stock du produit
  UPDATE products
  SET
    stock_real = calculated_stock,
    stock_quantity = calculated_stock, -- Maintenir stock_quantity = stock_real
    updated_at = now()
  WHERE id = NEW.product_id;

  -- Mettre à jour quantity_after dans le mouvement pour correspondre au stock final
  NEW.quantity_after := calculated_stock;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION maintain_stock_coherence() IS
'Maintient la cohérence du stock réel (stock_real/stock_quantity) en recalculant à partir de tous les mouvements.
CORRECTION 2025-10-13: Filtre affects_forecast=false pour ne traiter QUE les mouvements réels.
Les mouvements prévisionnels (affects_forecast=true) sont gérés par recalculate_forecasted_stock().
Séparation claire: maintain_stock_coherence() → stock_real | recalculate_forecasted_stock() → stock_forecasted_in/out';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_004 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: maintain_stock_coherence()';
    RAISE NOTICE '';
    RAISE NOTICE 'Changement:';
    RAISE NOTICE '  - AVANT: Tous mouvements modifient stock_real';
    RAISE NOTICE '  - APRÈS: Seulement mouvements affects_forecast=false';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Mouvements prévisionnels ne modifient plus stock_real ✅';
    RAISE NOTICE '  - stock_real reste cohérent et positif ✅';
    RAISE NOTICE '  - Workflow PO Confirmed → Received déblo qué ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Workflow attendu:';
    RAISE NOTICE '  1. Confirmed: INSERT mouvement (affects_forecast=true)';
    RAISE NOTICE '     → recalculate_forecasted_stock() met à jour stock_forecasted_in';
    RAISE NOTICE '     → maintain_stock_coherence() SKIP (affects_forecast=true)';
    RAISE NOTICE '  2. Received: INSERT 2 mouvements';
    RAISE NOTICE '     a) OUT (affects_forecast=true) annule prévisionnel';
    RAISE NOTICE '        → recalculate_forecasted_stock() met stock_forecasted_in=0';
    RAISE NOTICE '        → maintain_stock_coherence() SKIP';
    RAISE NOTICE '     b) IN (affects_forecast=false) ajoute stock réel';
    RAISE NOTICE '        → maintain_stock_coherence() met stock_real+=quantity';
    RAISE NOTICE '        → recalculate_forecasted_stock() SKIP';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: PO Confirmed → Received (conversion réel)';
    RAISE NOTICE '========================================';
END $$;

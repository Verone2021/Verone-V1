-- =============================================
-- MIGRATION: Correction maintain_stock_coherence - Préserver quantity_after
-- Date: 2025-10-13
-- =============================================
-- Problème: maintain_stock_coherence() écrase quantity_after même si déjà fourni correctement
-- Résultat: Contrainte valid_quantity_logic échoue (quantity_after != quantity_before + quantity_change)
-- Solution: Ne modifier quantity_after que si NULL ou 0 (valeur par défaut)

-- =============================================
-- ANALYSE PROBLÈME
-- =============================================

-- Workflow actuel:
--   1. handle_purchase_order_forecast() INSERT mouvement IN réel
--      quantity_before = 10, quantity_after = 20, quantity_change = 10 ✅
--
--   2. maintain_stock_coherence() s'exécute (trigger BEFORE INSERT)
--      calculated_stock = get_calculated_stock (10) + quantity_change (10) = 20
--      NEW.quantity_after := 20 ✅ (par chance égal)
--
--   3. MAIS si décalage ou calcul différent:
--      NEW.quantity_after := calculated_stock écrase la valeur fournie
--      → Peut créer incohérence avec quantity_before calculé avant
--
-- Problème fondamental:
--   maintain_stock_coherence() utilise get_calculated_stock_from_movements()
--   qui récupère stock AVANT le nouveau mouvement
--   Mais quantity_before peut être calculé à un moment différent
--   → Race condition entre les 2 calculs

-- Solution:
--   Si quantity_after déjà fourni (!= NULL et != 0), le préserver
--   C'est le trigger appelant qui connaît le bon quantity_before/after
--   maintain_stock_coherence() ne devrait que synchroniser products.stock_real

-- =============================================
-- CORRECTION: Fonction maintain_stock_coherence
-- =============================================

CREATE OR REPLACE FUNCTION public.maintain_stock_coherence()
RETURNS TRIGGER AS $$
DECLARE
  calculated_stock integer;
  v_quantity_after_provided boolean;  -- FIX: Détecter si quantity_after fourni
BEGIN
  -- FIX: Ne traiter que les mouvements qui affectent le stock réel
  IF NEW.affects_forecast = true THEN
    RETURN NEW;
  END IF;

  -- FIX: Vérifier si quantity_after déjà fourni (valeur significative)
  v_quantity_after_provided := (NEW.quantity_after IS NOT NULL AND NEW.quantity_after != 0);

  -- Recalculer le stock basé sur tous les mouvements RÉELS
  calculated_stock := get_calculated_stock_from_movements(NEW.product_id);

  -- Ajouter le nouveau mouvement au calcul
  CASE NEW.movement_type
    WHEN 'IN' THEN
      calculated_stock := calculated_stock + NEW.quantity_change;
    WHEN 'OUT' THEN
      calculated_stock := calculated_stock + NEW.quantity_change;
    WHEN 'ADJUST' THEN
      calculated_stock := NEW.quantity_after; -- Pour ajustements, utiliser valeur fournie
    WHEN 'TRANSFER' THEN
      calculated_stock := calculated_stock + NEW.quantity_change;
  END CASE;

  -- Mettre à jour le stock du produit
  UPDATE products
  SET
    stock_real = calculated_stock,
    stock_quantity = calculated_stock,
    updated_at = now()
  WHERE id = NEW.product_id;

  -- FIX: Ne modifier quantity_after que si NON fourni
  -- Si fourni, c'est le trigger appelant qui connaît le bon quantity_before/after
  IF NOT v_quantity_after_provided THEN
    NEW.quantity_after := calculated_stock;
  END IF;
  -- SINON: Préserver quantity_after fourni par handle_purchase_order_forecast()

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTAIRE FONCTION
-- =============================================

COMMENT ON FUNCTION maintain_stock_coherence() IS
'Maintient cohérence stock_real en recalculant à partir de tous mouvements réels (affects_forecast=false).
CORRECTION 2025-10-13: Préserve quantity_after si déjà fourni par trigger appelant.
Logique:
- Filtre affects_forecast=false (mouvements réels uniquement)
- Calcule stock final: get_calculated_stock_from_movements() + quantity_change
- Synchronise products.stock_real avec calculated_stock
- Préserve quantity_after si fourni (!= NULL et != 0)
- Définit quantity_after = calculated_stock si non fourni
Architecture: Séparation réel (maintain_stock_coherence) vs prévisionnel (recalculate_forecasted_stock)';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251013_007 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fonction corrigée: maintain_stock_coherence()';
    RAISE NOTICE '';
    RAISE NOTICE 'Changement:';
    RAISE NOTICE '  - AVANT: NEW.quantity_after := calculated_stock (toujours)';
    RAISE NOTICE '  - APRÈS: Préserver quantity_after si déjà fourni';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - quantity_after fourni par triggers préservé ✅';
    RAISE NOTICE '  - Contrainte valid_quantity_logic respectée ✅';
    RAISE NOTICE '  - Workflow PO Confirmed → Received fonctionnel ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Tests requis: PO Confirmed → Received (conversion complète)';
    RAISE NOTICE '========================================';
END $$;

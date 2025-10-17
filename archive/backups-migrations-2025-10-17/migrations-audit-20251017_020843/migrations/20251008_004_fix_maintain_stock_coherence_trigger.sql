-- =============================================
-- FIX: Trigger maintain_stock_coherence() incompatible avec contrainte valid_quantity_logic
-- =============================================
-- Date: 2025-10-08
-- Issue: Le trigger soustrait quantity_change au lieu de l'additionner pour OUT
-- Impact: Violation contrainte car quantity_change est déjà négatif pour OUT
-- Exemple: stock 15 - (-3) = 18 au lieu de 15 + (-3) = 12
-- =============================================

-- Corriger la fonction maintain_stock_coherence
CREATE OR REPLACE FUNCTION public.maintain_stock_coherence()
RETURNS TRIGGER AS $$
DECLARE
  calculated_stock integer;
BEGIN
  -- Recalculer le stock basé sur tous les mouvements + le nouveau mouvement
  calculated_stock := get_calculated_stock_from_movements(NEW.product_id);

  -- Ajouter le nouveau mouvement au calcul
  -- IMPORTANT: quantity_change est NÉGATIF pour OUT, donc on ADDITIONNE
  CASE NEW.movement_type
    WHEN 'IN' THEN
      calculated_stock := calculated_stock + NEW.quantity_change;
    WHEN 'OUT' THEN
      calculated_stock := calculated_stock + NEW.quantity_change; -- FIX: + au lieu de -
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

-- Commentaire sur la logique
COMMENT ON FUNCTION public.maintain_stock_coherence() IS
'Maintient la cohérence du stock lors des mouvements.
IMPORTANT: quantity_change est négatif pour OUT, donc on additionne toujours.
Exemple: stock 15 + quantity_change -3 = 12 (sortie de 3 unités)';

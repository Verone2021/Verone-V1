-- =============================================
-- FIX: Fonction get_calculated_stock_from_movements() calcul incorrect pour OUT
-- =============================================
-- Date: 2025-10-08
-- Issue: La fonction fait -quantity_change pour OUT, mais quantity_change est déjà négatif
-- Impact: Stock calculé = 18 au lieu de 12 (inverse le signe deux fois)
-- Exemple: OUT avec quantity_change=-3 → -(-3)=+3 au lieu de -3
-- =============================================

-- Corriger la fonction get_calculated_stock_from_movements
CREATE OR REPLACE FUNCTION public.get_calculated_stock_from_movements(p_product_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- IMPORTANT: quantity_change est déjà signé correctement:
  -- - Positif pour IN (ex: +5)
  -- - Négatif pour OUT (ex: -3)
  -- - Positif/négatif pour ADJUST selon le delta
  -- Donc on ADDITIONNE directement tous les quantity_change

  RETURN COALESCE(
    (SELECT SUM(quantity_change)
     FROM stock_movements
     WHERE product_id = p_product_id
       AND affects_forecast = false), -- Mouvements réels uniquement
    0
  );
END;
$$;

-- Commentaire sur la logique
COMMENT ON FUNCTION public.get_calculated_stock_from_movements(uuid) IS
'Calcule le stock total depuis tous les mouvements réels d''un produit.
IMPORTANT: quantity_change est déjà signé (+5 pour IN, -3 pour OUT).
On fait simplement SUM(quantity_change) sans transformation.
Exemple: ADJUST +10, IN +5, OUT -3 → SUM = 12';

-- Vérification du calcul après correction
DO $$
DECLARE
  v_product_id uuid := 'acdd9528-93f7-4684-b6f8-6cf5fa278a14';
  v_calculated_stock integer;
  v_actual_stock integer;
BEGIN
  -- Calculer avec la fonction corrigée
  v_calculated_stock := get_calculated_stock_from_movements(v_product_id);

  -- Récupérer le stock réel du produit
  SELECT stock_real INTO v_actual_stock
  FROM products
  WHERE id = v_product_id;

  RAISE NOTICE 'Produit: %, Stock calculé: %, Stock réel: %',
    v_product_id, v_calculated_stock, v_actual_stock;

  IF v_calculated_stock != v_actual_stock THEN
    RAISE WARNING 'INCOHÉRENCE: Stock calculé (%) != Stock réel (%)',
      v_calculated_stock, v_actual_stock;
  ELSE
    RAISE NOTICE 'OK: Stock cohérent';
  END IF;
END $$;

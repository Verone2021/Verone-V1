-- ============================================================================
-- Migration: Correction trigger update_product_stock_after_movement
-- Date: 2025-11-27
-- Description: Le trigger doit respecter le flag affects_forecast
--              - affects_forecast = true → NE PAS modifier stock_real
--              - affects_forecast = false → Modifier stock_real
--
-- Bug découvert: Le mouvement ADJUST pour annulation reliquat PO écrasait
--                stock_real au lieu de ne modifier que stock_forecasted_in
-- ============================================================================

-- ============================================
-- 1. CORRIGER LE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_product_stock_after_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Vérifier si le mouvement affecte uniquement le forecast
  IF NEW.affects_forecast = true THEN
    -- Mouvement affecte UNIQUEMENT le stock prévisionnel (pas stock_real)
    -- Exemples: annulation reliquat PO, ajustement forecast manuel
    -- Note: stock_forecasted_in/out sont gérés par d'autres triggers spécialisés
    --       (trg_po_validation_forecasted_stock, trigger_so_update_forecasted_out)
    -- Ce trigger ne doit PAS modifier stock_real pour ces mouvements
    RAISE NOTICE 'stock_movement % (affects_forecast=true): stock_real non modifié pour produit %',
      NEW.id, NEW.product_id;
    RETURN NEW;
  END IF;

  -- Mouvement affecte le stock réel (réceptions, expéditions, ajustements manuels réels)
  UPDATE products
  SET
    stock_real = NEW.quantity_after,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;

  RAISE NOTICE 'stock_movement %: stock_real mis à jour à % pour produit %',
    NEW.id, NEW.quantity_after, NEW.product_id;

  RETURN NEW;
END;
$function$;

-- Commentaire documentation
COMMENT ON FUNCTION public.update_product_stock_after_movement() IS
'Met à jour products.stock_real après insertion stock_movement.
IMPORTANT: Respecte le flag affects_forecast:
- affects_forecast = true → Ne modifie PAS stock_real (pour ajustements forecast uniquement)
- affects_forecast = false → Modifie stock_real (réceptions, expéditions, ajustements réels)';

-- ============================================
-- 2. CORRIGER LES DONNÉES PRODUIT AFFECTÉ
-- ============================================

-- Recalculer stock_real basé sur le dernier mouvement avec affects_forecast = false
UPDATE products p
SET
  stock_real = COALESCE((
    SELECT sm.quantity_after
    FROM stock_movements sm
    WHERE sm.product_id = p.id
      AND sm.affects_forecast = false
    ORDER BY sm.created_at DESC
    LIMIT 1
  ), 0),
  updated_at = CURRENT_TIMESTAMP
WHERE p.id = '6e679b0a-70b8-48cd-a407-c28383770cca';  -- Fauteuil Milo - Bleu Indigo

-- ============================================
-- 3. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_stock_real INTEGER;
  v_product_name TEXT;
BEGIN
  -- Vérifier correction
  SELECT p.name, p.stock_real INTO v_product_name, v_stock_real
  FROM products p
  WHERE p.id = '6e679b0a-70b8-48cd-a407-c28383770cca';

  IF v_stock_real = 2 THEN
    RAISE NOTICE '✅ Correction réussie: % a maintenant stock_real = %', v_product_name, v_stock_real;
  ELSE
    RAISE WARNING '⚠️ Vérifier: % a stock_real = % (attendu: 2)', v_product_name, v_stock_real;
  END IF;
END $$;

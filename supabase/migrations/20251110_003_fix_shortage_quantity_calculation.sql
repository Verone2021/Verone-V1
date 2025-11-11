-- Migration: Fix shortage_quantity calculation in sync_stock_alert_tracking()
-- Date: 2025-11-10
-- Description: Correction du calcul shortage_quantity pour cas no_stock_but_ordered
--
-- BUG: Le calcul ne prenait en compte que stock_forecasted_out sans ajouter min_stock
-- Exemple problématique:
--   - stock_forecasted_out = 5 (commandes clients)
--   - min_stock = 10
--   - Calcul actuel: shortage = 5 ❌
--   - Calcul correct: shortage = 5 + 10 = 15 ✅
--
-- FIX: Ajouter min_stock au calcul pour garantir qu'après réception,
-- le stock sera au niveau minimum requis

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_type text;
  v_priority integer;
  v_shortage integer;
BEGIN
  -- Déterminer type d'alerte et priorité
  IF NEW.stock_real <= 0 THEN
    -- ⚠️ RUPTURE DE STOCK
    v_alert_type := 'out_of_stock';
    v_priority := 3; -- CRITICAL

    -- Calcul shortage: abs(stock réel) + min_stock pour restaurer le seuil
    v_shortage := ABS(NEW.stock_real) + COALESCE(NEW.min_stock, 0);

  ELSIF NEW.stock_real > 0 AND NEW.stock_real <= NEW.min_stock THEN
    -- ⚠️ STOCK FAIBLE (sous seuil minimum)
    v_alert_type := 'low_stock';
    v_priority := 2; -- WARNING

    -- Calcul shortage: différence pour atteindre min_stock
    v_shortage := NEW.min_stock - NEW.stock_real;

  ELSIF NEW.stock_real <= 0 AND NEW.stock_forecasted_out > 0 THEN
    -- ⚠️ PAS DE STOCK MAIS COMMANDES CLIENTS EN ATTENTE
    -- ✅ FIX: Ajouter min_stock pour garantir stock après réception
    v_alert_type := 'no_stock_but_ordered';
    v_priority := 3; -- CRITICAL

    -- ✅ CORRECTION: shortage = forecasted_out + min_stock
    -- Exemple: forecasted_out=5, min_stock=10 → shortage=15
    -- Ainsi, après réception commande fournisseur (15 unités),
    -- et après expédition commandes clients (5 unités),
    -- il reste 10 unités = min_stock ✅
    v_shortage := NEW.stock_forecasted_out + COALESCE(NEW.min_stock, 0);

  ELSE
    -- ✅ Pas d'alerte nécessaire → Supprimer alerte existante si présente
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Upsert alerte dans stock_alert_tracking
  INSERT INTO stock_alert_tracking (
    product_id,
    alert_type,
    alert_priority,
    stock_real,
    stock_forecasted_out,
    min_stock,
    shortage_quantity,
    validated,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_alert_type,
    v_priority,
    NEW.stock_real,
    NEW.stock_forecasted_out,
    NEW.min_stock,
    v_shortage,
    false, -- Nouvelle alerte non validée
    now(),
    now()
  )
  ON CONFLICT (product_id) DO UPDATE SET
    alert_type = EXCLUDED.alert_type,
    alert_priority = EXCLUDED.alert_priority,
    stock_real = EXCLUDED.stock_real,
    stock_forecasted_out = EXCLUDED.stock_forecasted_out,
    min_stock = EXCLUDED.min_stock,
    shortage_quantity = EXCLUDED.shortage_quantity,
    updated_at = now()
  WHERE stock_alert_tracking.validated = false; -- Ne pas écraser alertes validées

  RETURN NEW;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Trigger AFTER INSERT OR UPDATE sur products.
Synchronise table stock_alert_tracking avec alertes stock en temps réel.
Fix 2025-11-10: Correction calcul shortage_quantity pour no_stock_but_ordered.
Formule: shortage = stock_forecasted_out + min_stock (garantit seuil minimum après réception).';

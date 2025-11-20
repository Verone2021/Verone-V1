-- Migration: Fix sync_stock_alert_tracking to use forecasted stock
-- Bug: Trigger uses stock_real < min_stock instead of forecasted stock
-- Impact: False positives and false negatives in alerts
-- Priority: P0 - CRITICAL

DROP FUNCTION IF EXISTS sync_stock_alert_tracking() CASCADE;

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_id uuid;
  v_product_status text;
  v_alert_type TEXT;
  v_alert_priority INTEGER;
  v_shortage INTEGER;
  v_forecasted_stock INTEGER; -- ✅ NOUVEAU
BEGIN
  -- Récupérer supplier_id et product_status
  SELECT supplier_id, product_status
  INTO v_supplier_id, v_product_status
  FROM products
  WHERE id = NEW.id;

  -- Filtre UNIQUEMENT produits actifs
  IF v_product_status IS DISTINCT FROM 'active' THEN
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- ✅ CALCUL DU STOCK PRÉVISIONNEL (CORRECTION PRINCIPALE)
  v_forecasted_stock := NEW.stock_real - NEW.stock_forecasted_out + NEW.stock_forecasted_in;

  -- ✅ CALCUL TYPE ET PRIORITÉ AVEC STOCK PRÉVISIONNEL
  IF v_forecasted_stock <= 0 AND NEW.stock_forecasted_out > 0 THEN
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3;
    v_shortage := NEW.stock_forecasted_out;
  ELSIF v_forecasted_stock <= 0 THEN
    v_alert_type := 'out_of_stock';
    v_alert_priority := 3;
    v_shortage := COALESCE(NEW.min_stock, 0);
  ELSIF v_forecasted_stock <= COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
    v_alert_type := 'low_stock';
    v_alert_priority := 2;
    v_shortage := COALESCE(NEW.min_stock, 0) - v_forecasted_stock;
  ELSE
    -- Stock suffisant, supprimer alerte
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Insert or update alert
  INSERT INTO stock_alert_tracking (
    product_id,
    supplier_id,
    alert_type,
    alert_priority,
    shortage_quantity,
    stock_real,
    stock_forecasted_out,
    stock_forecasted_in,
    min_stock,
    validated,
    validated_at
  ) VALUES (
    NEW.id,
    v_supplier_id,
    v_alert_type,
    v_alert_priority,
    v_shortage,
    NEW.stock_real,
    NEW.stock_forecasted_out,
    NEW.stock_forecasted_in,
    NEW.min_stock,
    false,
    NULL
  )
  ON CONFLICT (product_id) DO UPDATE SET
    supplier_id = EXCLUDED.supplier_id,
    alert_type = EXCLUDED.alert_type,
    alert_priority = EXCLUDED.alert_priority,
    shortage_quantity = EXCLUDED.shortage_quantity,
    stock_real = EXCLUDED.stock_real,
    stock_forecasted_out = EXCLUDED.stock_forecasted_out,
    stock_forecasted_in = EXCLUDED.stock_forecasted_in,
    min_stock = EXCLUDED.min_stock,
    validated = false,
    validated_at = NULL,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer trigger
CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();

-- ✅ DATA FIX : Recalculer toutes les alertes existantes avec nouvelle logique
UPDATE products SET stock_real = stock_real WHERE product_status = 'active';

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Calcule et maintient les alertes de stock basées sur le stock prévisionnel (stock_real - forecasted_out + forecasted_in).
CORRECTION 2025-11-13 : Utilise stock prévisionnel au lieu de stock_real.';

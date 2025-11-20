-- Migration: Hotfix condition stock alert (<= au lieu de <)
-- Bug: Ligne 42 du trigger 20251113_001 utilise <= au lieu de <
-- Impact: Faux positifs pour produits avec stock_prévisionnel = min_stock
-- Priority: P0 - CRITICAL
-- Date: 2025-11-19

DROP FUNCTION IF EXISTS sync_stock_alert_tracking() CASCADE;

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_id uuid;
  v_product_status text;
  v_alert_type TEXT;
  v_alert_priority INTEGER;
  v_shortage INTEGER;
  v_forecasted_stock INTEGER;
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

  -- Calcul du stock prévisionnel
  v_forecasted_stock := NEW.stock_real - NEW.stock_forecasted_out + NEW.stock_forecasted_in;

  -- Déterminer type et priorité d'alerte
  IF v_forecasted_stock <= 0 AND NEW.stock_forecasted_out > 0 THEN
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3;
    v_shortage := NEW.stock_forecasted_out;
  ELSIF v_forecasted_stock <= 0 THEN
    v_alert_type := 'out_of_stock';
    v_alert_priority := 3;
    v_shortage := COALESCE(NEW.min_stock, 0);
  ELSIF v_forecasted_stock < COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
    -- ✅ CORRECTION : < au lieu de <= (ligne critique)
    -- Alerte UNIQUEMENT si stock prévisionnel strictement inférieur à min_stock
    -- PAS d'alerte si stock prévisionnel = min_stock (égalité acceptable)
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

-- ✅ DATA FIX : Supprimer toutes les alertes et recalculer avec logique corrigée
DELETE FROM stock_alert_tracking;
UPDATE products SET stock_real = stock_real WHERE product_status = 'active';

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Calcule et maintient les alertes de stock basées sur le stock prévisionnel.
HOTFIX 2025-11-19 : Correction condition ligne 42 (<= → <) pour éviter faux positifs.
Stock prévisionnel = stock_real - stock_forecasted_out + stock_forecasted_in.
Alerte créée SI stock prévisionnel < min_stock (strictement inférieur).';

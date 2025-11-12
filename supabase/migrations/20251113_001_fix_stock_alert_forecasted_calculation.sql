-- Migration: Fix sync_stock_alert_tracking to use forecasted stock
-- Date: 2025-11-13
-- Bug: Trigger uses stock_real < min_stock instead of forecasted stock
-- Impact: False positives and false negatives in stock alerts
-- Priority: P0 - CRITICAL
--
-- Correction: Calculate forecasted stock = stock_real - stock_forecasted_out + stock_forecasted_in
-- Before comparing with min_stock threshold

-- =============================================
-- DROP & RECREATE FUNCTION sync_stock_alert_tracking
-- =============================================

DROP FUNCTION IF EXISTS sync_stock_alert_tracking() CASCADE;

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supplier_id uuid;
  v_product_status text;
  v_alert_type TEXT;
  v_alert_priority INTEGER;
  v_shortage INTEGER;
  v_forecasted_stock INTEGER; -- ✅ NOUVEAU: Variable pour stock prévisionnel
BEGIN
  -- Récupérer supplier_id + product_status du produit
  SELECT supplier_id, product_status
  INTO v_supplier_id, v_product_status
  FROM products
  WHERE id = NEW.id;

  -- Si pas de fournisseur, ignorer
  IF v_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ✅ FILTRAGE PAR product_status : Alertes UNIQUEMENT pour produits actifs
  -- Si produit n'est PAS 'active' (preorder/discontinued/draft) → Supprimer alerte
  IF v_product_status IS DISTINCT FROM 'active' THEN
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- ✅ CORRECTION PRINCIPALE: Calculer stock prévisionnel
  -- Stock prévisionnel = stock réel - sorties prévues + entrées prévues
  v_forecasted_stock := NEW.stock_real - NEW.stock_forecasted_out + NEW.stock_forecasted_in;

  -- ✅ CORRECTION: Utiliser stock prévisionnel pour toutes les comparaisons
  -- (au lieu de NEW.stock_real)

  -- Calculer type et priorité alerte selon règles métier Vérone
  IF v_forecasted_stock <= 0 AND NEW.stock_forecasted_out > 0 THEN
    -- Stock prévisionnel épuisé mais commandes clients en cours
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3; -- Critique
    v_shortage := NEW.stock_forecasted_out;
  ELSIF v_forecasted_stock <= 0 THEN
    -- Rupture de stock prévisionnelle complète
    v_alert_type := 'out_of_stock';
    v_alert_priority := 3; -- Critique
    v_shortage := COALESCE(NEW.min_stock, 0);
  ELSIF v_forecasted_stock <= COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
    -- Stock prévisionnel faible (sous minimum)
    v_alert_type := 'low_stock';
    v_alert_priority := 2; -- Warning
    v_shortage := COALESCE(NEW.min_stock, 0) - v_forecasted_stock;
  ELSE
    -- Stock prévisionnel OK → Supprimer alerte si existe
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Insérer ou mettre à jour alerte
  INSERT INTO stock_alert_tracking (
    product_id,
    supplier_id,
    alert_type,
    alert_priority,
    stock_real,
    stock_forecasted_out,
    min_stock,
    shortage_quantity
  )
  VALUES (
    NEW.id,
    v_supplier_id,
    v_alert_type,
    v_alert_priority,
    COALESCE(NEW.stock_real, 0),
    COALESCE(NEW.stock_forecasted_out, 0),
    COALESCE(NEW.min_stock, 0),
    v_shortage
  )
  ON CONFLICT (product_id) DO UPDATE SET
    alert_type = EXCLUDED.alert_type,
    alert_priority = EXCLUDED.alert_priority,
    stock_real = EXCLUDED.stock_real,
    stock_forecasted_out = EXCLUDED.stock_forecasted_out,
    min_stock = EXCLUDED.min_stock,
    shortage_quantity = EXCLUDED.shortage_quantity,
    supplier_id = EXCLUDED.supplier_id,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Recréer trigger (même configuration qu'avant)
CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE OF stock_real, stock_forecasted_out, stock_forecasted_in, min_stock, product_status
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Trigger 1: Maintient stock_alert_tracking synchronisé avec products.
Déclenché sur INSERT/UPDATE de stock_real, stock_forecasted_out, stock_forecasted_in, min_stock, product_status.
Filtre UNIQUEMENT produits avec product_status = ''active''.
Calcule automatiquement type alerte et priorité selon règles métier.
CORRECTION 2025-11-13: Utilise stock prévisionnel (real - forecasted_out + forecasted_in) au lieu de stock_real.';

-- =============================================
-- DATA FIX: Recalculer toutes les alertes existantes
-- =============================================

-- Force le recalcul de toutes les alertes pour produits actifs
-- en déclenchant le trigger via UPDATE
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Compter produits actifs avant
  SELECT COUNT(*) INTO v_count
  FROM products
  WHERE product_status = 'active';

  RAISE NOTICE 'Recalcul alertes pour % produits actifs...', v_count;

  -- Déclencher trigger pour recalculer alertes
  UPDATE products
  SET stock_real = stock_real
  WHERE product_status = 'active';

  RAISE NOTICE 'Recalcul terminé.';
END $$;

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

-- Afficher statistiques alertes après correction
DO $$
DECLARE
  v_total_alerts INTEGER;
  v_critical_alerts INTEGER;
  v_warning_alerts INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_alerts FROM stock_alert_tracking;
  SELECT COUNT(*) INTO v_critical_alerts FROM stock_alert_tracking WHERE alert_priority = 3;
  SELECT COUNT(*) INTO v_warning_alerts FROM stock_alert_tracking WHERE alert_priority = 2;

  RAISE NOTICE '✅ Statistiques alertes après correction:';
  RAISE NOTICE '   Total alertes: %', v_total_alerts;
  RAISE NOTICE '   Alertes critiques (P3): %', v_critical_alerts;
  RAISE NOTICE '   Alertes warning (P2): %', v_warning_alerts;
END $$;

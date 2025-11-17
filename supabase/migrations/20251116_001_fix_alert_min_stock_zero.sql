-- Migration: Fix alertes pour produits avec min_stock=0
-- Date: 2025-11-16
-- Bug: Trigger crée alertes pour produits avec min_stock=0
-- Impact: Faux positifs (4 alertes erronées sur 6)
-- Priority: P1 - HIGH
--
-- Correction: Ajouter condition AND NEW.min_stock > 0 à ligne 60
-- Règle métier: min_stock=0 signifie "pas de seuil configuré" → PAS d'alerte

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
  v_forecasted_stock INTEGER;
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

  -- Filtrage PAR product_status : Alertes UNIQUEMENT pour produits actifs
  IF v_product_status IS DISTINCT FROM 'active' THEN
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- ✅ CORRECTION PRINCIPALE: Calculer stock prévisionnel
  v_forecasted_stock := NEW.stock_real - NEW.stock_forecasted_out + NEW.stock_forecasted_in;

  -- Calculer type et priorité alerte selon règles métier Vérone
  IF v_forecasted_stock <= 0 AND NEW.stock_forecasted_out > 0 THEN
    -- Stock prévisionnel épuisé mais commandes clients en cours
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3; -- Critique
    v_shortage := NEW.stock_forecasted_out;
  ELSIF v_forecasted_stock <= 0 AND NEW.min_stock > 0 THEN  -- ✅ CORRECTION: Ajout condition min_stock > 0
    -- Rupture de stock prévisionnelle complète
    -- RÈGLE: Alerte SEULEMENT si un seuil est configuré (min_stock > 0)
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

-- Recréer trigger
CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE OF stock_real, stock_forecasted_out, stock_forecasted_in, min_stock, product_status
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Trigger 1: Maintient stock_alert_tracking synchronisé avec products.
CORRECTION 2025-11-16: Ajout condition min_stock > 0 pour éviter alertes erronées sur produits sans seuil configuré.
RÈGLE MÉTIER: min_stock=0 signifie "pas de seuil configuré" donc PAS d''alerte.';

-- Data fix: Supprimer alertes erronées existantes (min_stock=0)
DELETE FROM stock_alert_tracking
WHERE product_id IN (
  SELECT id FROM products WHERE min_stock = 0
);

-- Data fix: Recalculer toutes les alertes pour produits actifs
UPDATE products
SET stock_real = stock_real
WHERE product_status = 'active';

-- Vérification post-migration
DO $$
DECLARE
  v_total_alerts INTEGER;
  v_alerts_min_zero INTEGER;
  v_alerts_expected INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_alerts FROM stock_alert_tracking;
  SELECT COUNT(*) INTO v_alerts_min_zero
  FROM stock_alert_tracking sa
  JOIN products p ON sa.product_id = p.id
  WHERE p.min_stock = 0;

  SELECT COUNT(*) INTO v_alerts_expected
  FROM products
  WHERE product_status = 'active'
    AND min_stock > 0
    AND stock_real < min_stock;

  RAISE NOTICE '✅ Statistiques après correction:';
  RAISE NOTICE '   Total alertes: %', v_total_alerts;
  RAISE NOTICE '   Alertes attendues (min_stock>0 et stock<seuil): %', v_alerts_expected;
  RAISE NOTICE '   Alertes avec min_stock=0 (devrait être 0): %', v_alerts_min_zero;

  IF v_alerts_min_zero > 0 THEN
    RAISE WARNING '⚠️  ATTENTION: % alertes erronées avec min_stock=0 détectées!', v_alerts_min_zero;
  ELSE
    RAISE NOTICE '✅ SUCCÈS: Aucune alerte erronée détectée';
  END IF;
END $$;

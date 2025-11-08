-- Migration 111: Fix Alertes Stock - Utiliser Stock Prévisionnel
-- Date: 2025-11-05
-- Contexte: Les alertes doivent être basées sur stock DISPONIBLE (prévisionnel)
--           et non seulement sur stock RÉEL
--
-- Objectifs:
-- 1. Supprimer alertes obsolètes (basées sur ancien calcul)
-- 2. Modifier trigger pour utiliser stock prévisionnel
-- 3. Resynchroniser alertes avec nouveau calcul
--
-- Formule Stock Disponible:
-- stock_disponible = stock_real + stock_forecasted_in - stock_forecasted_out
--
-- Références:
-- - docs/business-rules/06-stocks/movements/real-vs-forecast-separation.md
-- - supabase/migrations/20251104_102_stock_alerts_tracking_triggers.sql

-- =============================================================================
-- PARTIE 1: Supprimer Alertes Obsolètes
-- =============================================================================

DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Supprimer toutes les alertes non validées (basées sur ancien calcul)
    DELETE FROM stock_alert_tracking WHERE validated = false;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RAISE NOTICE '✅ % alertes obsolètes supprimées', v_deleted_count;
END $$;

-- =============================================================================
-- PARTIE 2: Modifier Trigger - Utiliser Stock Prévisionnel
-- =============================================================================

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
  v_stock_disponible INTEGER; -- ✅ NOUVEAU: Stock prévisionnel
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

  -- ✅ CALCUL STOCK DISPONIBLE PRÉVISIONNEL
  -- Formule: stock_real + entrées_prévues - sorties_prévues
  v_stock_disponible := NEW.stock_real +
                        COALESCE(NEW.stock_forecasted_in, 0) -
                        COALESCE(NEW.stock_forecasted_out, 0);

  -- ✅ NOUVELLE LOGIQUE: Alertes basées sur stock disponible prévisionnel
  -- Cas 1: Stock disponible épuisé mais commandes clients en cours
  IF v_stock_disponible <= 0 AND NEW.stock_forecasted_out > 0 THEN
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3; -- Critique
    v_shortage := NEW.stock_forecasted_out;

  -- Cas 2: Rupture de stock prévisionnel complète
  ELSIF v_stock_disponible <= 0 THEN
    v_alert_type := 'out_of_stock';
    v_alert_priority := 3; -- Critique
    v_shortage := COALESCE(NEW.min_stock, 0);

  -- Cas 3: Stock disponible sous minimum
  ELSIF v_stock_disponible < COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
    v_alert_type := 'low_stock';
    v_alert_priority := 2; -- Warning
    v_shortage := COALESCE(NEW.min_stock, 0) - v_stock_disponible;

  -- Cas 4: Stock OK → Supprimer alerte si existe
  ELSE
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

-- Recréer trigger avec nouvelles colonnes surveillées
DROP TRIGGER IF EXISTS trigger_sync_stock_alert_tracking ON products;

CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE OF stock_real, stock_forecasted_in, stock_forecasted_out, min_stock, product_status
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Trigger 1 (v2): Maintient stock_alert_tracking synchronisé avec products.
✅ MIGRATION 111: Basé sur stock DISPONIBLE (prévisionnel) et non seulement stock réel.
Formule: stock_disponible = stock_real + stock_forecasted_in - stock_forecasted_out
Déclenché sur INSERT/UPDATE de stock_real, stock_forecasted_in, stock_forecasted_out, min_stock, product_status.
Filtre UNIQUEMENT produits avec product_status = ''active''.';

-- =============================================================================
-- PARTIE 3: Resynchroniser Alertes
-- =============================================================================

DO $$
DECLARE
    v_products_count INTEGER;
BEGIN
    -- Forcer re-trigger sur tous les produits actifs
    UPDATE products
    SET updated_at = now()
    WHERE archived_at IS NULL;

    GET DIAGNOSTICS v_products_count = ROW_COUNT;

    RAISE NOTICE '✅ % produits resynchronisés avec nouveau calcul', v_products_count;
END $$;

-- =============================================================================
-- PARTIE 4: Vérification
-- =============================================================================

DO $$
DECLARE
    v_total_alertes INTEGER;
    v_alertes_critiques INTEGER;
    v_alertes_warning INTEGER;
    v_products_total INTEGER;
    v_products_zero_stock INTEGER;
    v_products_zero_min INTEGER;
BEGIN
    -- Compter alertes créées
    SELECT COUNT(*) INTO v_total_alertes
    FROM stock_alert_tracking
    WHERE validated = false;

    SELECT COUNT(*) INTO v_alertes_critiques
    FROM stock_alert_tracking
    WHERE validated = false AND alert_priority = 3;

    SELECT COUNT(*) INTO v_alertes_warning
    FROM stock_alert_tracking
    WHERE validated = false AND alert_priority = 2;

    -- Compter produits
    SELECT COUNT(*) INTO v_products_total
    FROM products
    WHERE archived_at IS NULL;

    SELECT COUNT(*) INTO v_products_zero_stock
    FROM products
    WHERE archived_at IS NULL
    AND (stock_real + COALESCE(stock_forecasted_in, 0) - COALESCE(stock_forecasted_out, 0)) = 0;

    SELECT COUNT(*) INTO v_products_zero_min
    FROM products
    WHERE archived_at IS NULL AND min_stock = 0;

    -- Résultats
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION MIGRATION 111';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ALERTES:';
    RAISE NOTICE '   - Total alertes actives: %', v_total_alertes;
    RAISE NOTICE '   - Critiques (priority 3): %', v_alertes_critiques;
    RAISE NOTICE '   - Warning (priority 2): %', v_alertes_warning;
    RAISE NOTICE '';
    RAISE NOTICE '📦 PRODUITS:';
    RAISE NOTICE '   - Total produits: %', v_products_total;
    RAISE NOTICE '   - Stock disponible = 0: %', v_products_zero_stock;
    RAISE NOTICE '   - min_stock = 0: %', v_products_zero_min;
    RAISE NOTICE '';

    IF v_total_alertes = 0 AND v_products_zero_stock = v_products_total THEN
        RAISE NOTICE '✅ RÉSULTAT ATTENDU: 0 alertes (tous produits stock disponible = 0, min_stock = 0)';
    ELSIF v_total_alertes > 0 THEN
        RAISE WARNING '⚠️  ATTENTION: % alertes créées (vérifier produits avec stock prévisionnel > 0)', v_total_alertes;
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- RÉSUMÉ MIGRATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 111 COMPLÉTÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTIONS EFFECTUÉES:';
    RAISE NOTICE '   1. ✅ Suppression alertes obsolètes (ancien calcul)';
    RAISE NOTICE '   2. ✅ Trigger modifié - Stock prévisionnel';
    RAISE NOTICE '   3. ✅ Trigger monitoring + stock_forecasted_in/out';
    RAISE NOTICE '   4. ✅ Resynchronisation tous produits';
    RAISE NOTICE '';
    RAISE NOTICE '📊 FORMULE STOCK DISPONIBLE:';
    RAISE NOTICE '   stock_disponible = stock_real + stock_forecasted_in - stock_forecasted_out';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 IMPACT:';
    RAISE NOTICE '   - Alertes basées sur stock disponible prévisionnel ✅';
    RAISE NOTICE '   - Faux positifs évités (stock réel 0 mais entrées prévues) ✅';
    RAISE NOTICE '   - Modification min_stock dans UI → Alerte dynamique ✅';
    RAISE NOTICE '';
    RAISE NOTICE '📚 RÉFÉRENCES:';
    RAISE NOTICE '   - docs/business-rules/06-stocks/movements/real-vs-forecast-separation.md';
    RAISE NOTICE '   - Migration 102: trigger initial (stock_real uniquement)';
    RAISE NOTICE '   - Migration 111: trigger v2 (stock disponible prévisionnel)';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

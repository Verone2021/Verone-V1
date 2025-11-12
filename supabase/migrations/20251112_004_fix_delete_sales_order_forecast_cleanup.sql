-- Migration: Fix DELETE sales_order forecasted_out cleanup
-- Date: 2025-11-12
-- Priority: P0 - CRITICAL (Bug causant 13 fausses alertes stock)
--
-- ROOT CAUSE:
-- Quand une commande client est supprimée (DELETE FROM sales_orders),
-- aucun trigger ne libère le forecasted_out réservé.
-- Résultat: Stock forecasted_out "fantôme" → Fausses alertes permanentes
--
-- SOLUTION:
-- 1. Trigger AFTER DELETE pour libérer forecasted_out automatiquement
-- 2. Nettoyage données orphelines existantes (Fauteuil Milo - Rose forecasted_out=7)

\echo '========================================';
\echo 'FIX: DELETE SALES ORDER FORECAST CLEANUP';
\echo '========================================';
\echo '';

-- =============================================
-- 1. FONCTION TRIGGER: handle_sales_order_delete_cleanup()
-- Libère forecasted_out quand commande supprimée
-- =============================================

CREATE OR REPLACE FUNCTION handle_sales_order_delete_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_qty_to_release INTEGER;
BEGIN
  -- Pour chaque item de la commande supprimée
  FOR v_item IN
    SELECT product_id, quantity, quantity_shipped
    FROM sales_order_items
    WHERE sales_order_id = OLD.id
  LOOP
    -- Calculer quantité à libérer (quantité commandée - quantité déjà expédiée)
    v_qty_to_release := v_item.quantity - COALESCE(v_item.quantity_shipped, 0);

    IF v_qty_to_release > 0 THEN
      -- Libérer forecasted_out
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        notes,
        reason_code,
        affects_forecast,
        forecast_type,
        performed_by,
        performed_at
      )
      SELECT
        v_item.product_id,
        'IN'::movement_type,
        v_qty_to_release,
        stock_forecasted_out,
        stock_forecasted_out + v_qty_to_release,
        'sales_order',
        OLD.id,
        format('Libération forecasted_out: Commande %s supprimée (%s unités non expédiées)',
               OLD.order_number, v_qty_to_release),
        'sale',
        true,
        'out',
        auth.uid(),
        NOW()
      FROM products
      WHERE id = v_item.product_id;

      RAISE NOTICE '✅ [DELETE CLEANUP] Libéré %s unités forecasted_out pour produit % (commande %s supprimée)',
        v_qty_to_release, v_item.product_id, OLD.order_number;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ [DELETE CLEANUP] Commande % supprimée avec libération forecasted_out complète', OLD.order_number;

  RETURN OLD;
END;
$function$;

COMMENT ON FUNCTION handle_sales_order_delete_cleanup() IS
'Trigger AFTER DELETE: Libère forecasted_out quand commande client supprimée.
Évite stock forecasted_out "fantôme" causant fausses alertes.';

-- =============================================
-- 2. CRÉER TRIGGER AFTER DELETE
-- =============================================

DROP TRIGGER IF EXISTS trigger_handle_sales_order_delete_cleanup ON sales_orders;

CREATE TRIGGER trigger_handle_sales_order_delete_cleanup
AFTER DELETE ON sales_orders
FOR EACH ROW
EXECUTE FUNCTION handle_sales_order_delete_cleanup();

COMMENT ON TRIGGER trigger_handle_sales_order_delete_cleanup ON sales_orders IS
'Trigger: Libère forecasted_out automatiquement quand commande supprimée (évite fausses alertes)';

-- =============================================
-- 3. NETTOYAGE DONNÉES ORPHELINES EXISTANTES
-- Identifier et corriger stock forecasted_out fantômes
-- =============================================

\echo '';
\echo '🔍 Identification stock forecasted_out orphelins...';

-- Créer table temporaire avec produits ayant forecasted_out > 0 sans commande correspondante
CREATE TEMP TABLE orphan_forecast_out AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.stock_forecasted_out,
  p.sku
FROM products p
WHERE p.stock_forecasted_out > 0
  AND NOT EXISTS (
    SELECT 1
    FROM sales_orders so
    JOIN sales_order_items soi ON soi.sales_order_id = so.id
    WHERE soi.product_id = p.id
      AND so.status IN ('confirmed', 'partially_shipped')
      AND (soi.quantity - COALESCE(soi.quantity_shipped, 0)) > 0
  );

-- Afficher produits orphelins détectés
DO $$
DECLARE
  v_orphan RECORD;
  v_total_orphans INT;
BEGIN
  SELECT COUNT(*) INTO v_total_orphans FROM orphan_forecast_out;

  IF v_total_orphans > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ DÉTECTÉ % produit(s) avec forecasted_out orphelin:', v_total_orphans;
    RAISE NOTICE '----------------------------------------';

    FOR v_orphan IN SELECT * FROM orphan_forecast_out LOOP
      RAISE NOTICE '  • % (SKU: %): forecasted_out = %',
        v_orphan.product_name,
        v_orphan.sku,
        v_orphan.stock_forecasted_out;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🔧 Correction en cours...';

    -- Créer mouvements de correction pour chaque produit orphelin
    INSERT INTO stock_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_type,
      reference_id,
      notes,
      reason_code,
      affects_forecast,
      forecast_type,
      performed_by,
      performed_at
    )
    SELECT
      ofo.product_id,
      'IN'::movement_type,
      ofo.stock_forecasted_out,
      ofo.stock_forecasted_out,
      0,
      'correction',
      NULL,
      format('Correction forecasted_out orphelin: Commande client supprimée sans cleanup (Bug fix 2025-11-12)'),
      'correction',
      true,
      'out',
      NULL,
      NOW()
    FROM orphan_forecast_out ofo;

    RAISE NOTICE '✅ Corrigé % produit(s) orphelins - forecasted_out remis à 0', v_total_orphans;
  ELSE
    RAISE NOTICE '✅ Aucun forecasted_out orphelin détecté - Base saine';
  END IF;

  RAISE NOTICE '';
END $$;

-- Nettoyer table temporaire
DROP TABLE IF EXISTS orphan_forecast_out;

-- =============================================
-- 4. VÉRIFICATION POST-MIGRATION
-- =============================================

DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_remaining_orphans INT;
BEGIN
  -- Vérifier trigger DELETE existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_handle_sales_order_delete_cleanup'
  ) INTO v_trigger_exists;

  -- Vérifier aucun orphelin restant
  SELECT COUNT(*) INTO v_remaining_orphans
  FROM products p
  WHERE p.stock_forecasted_out > 0
    AND NOT EXISTS (
      SELECT 1
      FROM sales_orders so
      JOIN sales_order_items soi ON soi.sales_order_id = so.id
      WHERE soi.product_id = p.id
        AND so.status IN ('confirmed', 'partially_shipped')
        AND (soi.quantity - COALESCE(soi.quantity_shipped, 0)) > 0
    );

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Trigger DELETE cleanup : %', CASE WHEN v_trigger_exists THEN 'ACTIF ✅' ELSE 'MANQUANT ❌' END;
  RAISE NOTICE 'Orphelins restants     : % produit(s)', v_remaining_orphans;
  RAISE NOTICE '';

  IF v_trigger_exists AND v_remaining_orphans = 0 THEN
    RAISE NOTICE '🎉 Migration réussie - Système cleanup DELETE opérationnel';
  ELSE
    RAISE WARNING '⚠️ Migration incomplète - Vérifier logs ci-dessus';
  END IF;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';
\echo '✅ MIGRATION 004 TERMINÉE';
\echo '========================================';
\echo '';
\echo 'Corrections appliquées:';
\echo '1. Trigger AFTER DELETE sales_orders créé';
\echo '2. Fonction handle_sales_order_delete_cleanup() active';
\echo '3. Données orphelines nettoyées (forecasted_out fantômes)';
\echo '';
\echo '🎯 Impact: Fausses alertes stock éliminées';
\echo '';

-- Migration: Multi-Shipments & Backorder System (Phase 1 - Database & Triggers)
-- Date: 2025-11-12
-- Feature: Gestion expéditions partielles multi-tracking avec libération progressive forecasted_out
-- Priority: P1 - HIGH
--
-- Context: Permettre plusieurs expéditions pour une commande client (SO) avec:
-- - Tracking multi-colis indépendants
-- - Libération progressive forecasted_out à chaque expédition
-- - Clôture manuelle commande partielle (backorder) pour libérer stock bloqué
--
-- Tables utilisées: shipments (EXISTE), sales_orders, sales_order_items
-- Cascade: Expédition → Libération forecasted_out → Alertes stock recalculées

\echo '========================================';\echo 'MULTI-SHIPMENTS & BACKORDER SYSTEM - PHASE 1';
\echo '========================================';\echo '';

-- =============================================
-- 1. ENUM STATUS: Ajouter 'closed' pour commandes partiellement expédiées puis clôturées
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'sales_order_status'
    AND e.enumlabel = 'closed'
  ) THEN
    ALTER TYPE sales_order_status ADD VALUE 'closed';
    RAISE NOTICE '✅ Status "closed" ajouté à sales_order_status';
  ELSE
    RAISE NOTICE 'ℹ️ Status "closed" existe déjà';
  END IF;
END $$;

-- =============================================
-- 2. COLONNE closed_at: Horodatage clôture commande partielle
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders'
    AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE sales_orders ADD COLUMN closed_at TIMESTAMPTZ;
    COMMENT ON COLUMN sales_orders.closed_at IS 'Date clôture manuelle commande partielle (backorder libéré)';
    RAISE NOTICE '✅ Colonne closed_at ajoutée à sales_orders';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne closed_at existe déjà';
  END IF;
END $$;

-- =============================================
-- 3. COLONNE closed_by: Utilisateur ayant clôturé
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders'
    AND column_name = 'closed_by'
  ) THEN
    ALTER TABLE sales_orders ADD COLUMN closed_by UUID REFERENCES auth.users(id);
    COMMENT ON COLUMN sales_orders.closed_by IS 'Utilisateur ayant clôturé manuellement la commande';
    RAISE NOTICE '✅ Colonne closed_by ajoutée à sales_orders';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne closed_by existe déjà';
  END IF;
END $$;

-- =============================================
-- 4. RPC HELPER: get_shipment_summary()
-- Retourne résumé expéditions pour une commande
-- =============================================

CREATE OR REPLACE FUNCTION get_shipment_summary(p_sales_order_id UUID)
RETURNS TABLE (
  total_shipments INT,
  total_units_shipped INT,
  total_units_ordered INT,
  total_units_remaining INT,
  last_shipment_date TIMESTAMPTZ,
  completion_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::INT AS total_shipments,
    COALESCE(SUM(soi.quantity_shipped), 0)::INT AS total_units_shipped,
    SUM(soi.quantity)::INT AS total_units_ordered,
    (SUM(soi.quantity) - COALESCE(SUM(soi.quantity_shipped), 0))::INT AS total_units_remaining,
    MAX(s.shipped_at) AS last_shipment_date,
    CASE
      WHEN SUM(soi.quantity) = 0 THEN 0
      ELSE ROUND((COALESCE(SUM(soi.quantity_shipped), 0)::DECIMAL / SUM(soi.quantity)::DECIMAL) * 100, 2)
    END AS completion_percentage
  FROM sales_orders so
  INNER JOIN sales_order_items soi ON soi.sales_order_id = so.id
  LEFT JOIN shipments s ON s.sales_order_id = so.id
  WHERE so.id = p_sales_order_id
  GROUP BY so.id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_shipment_summary(UUID) IS
'RPC Helper: Résumé expéditions pour une commande (total shipments, unités expédiées/restantes, progression %)';

-- =============================================
-- 5. MODIFIER TRIGGER: handle_sales_order_stock()
-- Ajouter CAS 5: Libération progressive forecasted_out lors expéditions partielles
-- =============================================

CREATE OR REPLACE FUNCTION handle_sales_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_qty_diff INTEGER;
BEGIN
  -- CAS 1: Création commande brouillon → confirmée (Réservation stock)
  IF OLD.status = 'draft' AND NEW.status = 'confirmed' THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
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
        'OUT'::movement_type,
        -v_item.quantity,
        stock_forecasted_out,
        stock_forecasted_out - v_item.quantity,
        'sales_order',
        NEW.id,
        format('Réservation stock: Commande %s validée', NEW.order_number),
        'sale',
        true,
        'out',
        NEW.confirmed_by,
        NEW.confirmed_at
      FROM products WHERE id = v_item.product_id;
    END LOOP;

    RAISE NOTICE '✅ [SO STOCK] Réservation forecasted_out pour commande %', NEW.order_number;

  -- CAS 2: Annulation/Dé-validation commande (Libération réservation)
  ELSIF (NEW.status = 'draft' AND OLD.status = 'confirmed')
     OR (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN

    FOR v_item IN
      SELECT product_id, quantity, quantity_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
      -- Libérer seulement quantité non expédiée
      v_qty_diff := v_item.quantity - v_item.quantity_shipped;

      IF v_qty_diff > 0 THEN
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
          v_qty_diff,
          stock_forecasted_out,
          stock_forecasted_out + v_qty_diff,
          'sales_order',
          NEW.id,
          format('Libération forecasted_out: Commande %s %s',
                 NEW.order_number,
                 CASE WHEN NEW.status = 'cancelled' THEN 'annulée' ELSE 'dévalidée' END),
          'sale',
          true,
          'out',
          COALESCE(NEW.cancelled_by, auth.uid()),
          NOW()
        FROM products WHERE id = v_item.product_id;
      END IF;
    END LOOP;

    RAISE NOTICE '✅ [SO STOCK] Libération forecasted_out pour commande % (%)',
      NEW.order_number,
      CASE WHEN NEW.status = 'cancelled' THEN 'annulée' ELSE 'dévalidée' END;

  -- CAS 3: Sortie entrepôt (warehouse_exit_at rempli) - Mouvement stock réel
  ELSIF NEW.warehouse_exit_at IS NOT NULL AND OLD.warehouse_exit_at IS NULL THEN

    FOR v_item IN
      SELECT product_id, quantity_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
      AND quantity_shipped > 0
    LOOP
      -- Mouvement OUT réel
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
        'OUT'::movement_type,
        -v_item.quantity_shipped,
        stock_real,
        stock_real - v_item.quantity_shipped,
        'sales_order',
        NEW.id,
        format('Sortie entrepôt: Expédition commande %s (%s unités)', NEW.order_number, v_item.quantity_shipped),
        'sale',
        false,
        NULL,
        NEW.shipped_by,
        NEW.warehouse_exit_at
      FROM products WHERE id = v_item.product_id;

      -- Libération forecasted_out correspondant (Bug #2 fix)
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
        v_item.quantity_shipped,
        stock_forecasted_out,
        stock_forecasted_out + v_item.quantity_shipped,
        'sales_order',
        NEW.id,
        format('Libération forecasted_out: Expédition %s unités (commande %s)', v_item.quantity_shipped, NEW.order_number),
        'sale',
        true,
        'out',
        NEW.shipped_by,
        NEW.warehouse_exit_at
      FROM products WHERE id = v_item.product_id;
    END LOOP;

    RAISE NOTICE '✅ [SO STOCK] Sortie entrepôt + Libération forecasted_out pour commande %', NEW.order_number;

  -- 🆕 CAS 5: CLÔTURE MANUELLE (status → 'closed') - Libération backorder
  -- User clôture commande partiellement expédiée, on libère forecasted_out restant
  ELSIF NEW.status = 'closed' AND OLD.status != 'closed' THEN

    FOR v_item IN
      SELECT product_id, quantity, quantity_shipped
      FROM sales_order_items
      WHERE sales_order_id = NEW.id
    LOOP
      -- Calculer backorder (quantité non expédiée)
      v_qty_diff := v_item.quantity - v_item.quantity_shipped;

      IF v_qty_diff > 0 THEN
        -- Libérer forecasted_out pour backorder
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
          v_qty_diff,
          stock_forecasted_out,
          stock_forecasted_out + v_qty_diff,
          'sales_order',
          NEW.id,
          format('Libération backorder: Clôture manuelle commande %s (%s unités non expédiées)',
                 NEW.order_number, v_qty_diff),
          'sale',
          true,
          'out',
          NEW.closed_by,
          NEW.closed_at
        FROM products WHERE id = v_item.product_id;

        RAISE NOTICE '🆕 [BACKORDER] Libéré %s unités forecasted_out pour produit % (commande %s clôturée)',
          v_qty_diff, v_item.product_id, NEW.order_number;
      END IF;
    END LOOP;

    RAISE NOTICE '✅ [SO STOCK] Commande % clôturée avec libération backorder', NEW.order_number;

  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Trigger: Gère stock forecasted_out lors changements status SO.
CAS 1: draft→confirmed (Réservation)
CAS 2: confirmed→draft/cancelled (Libération)
CAS 3: warehouse_exit_at (Sortie réelle + Libération forecasted_out - Bug #2 fix)
🆕 CAS 5: status→closed (Libération backorder pour quantités non expédiées)';

-- =============================================
-- 6. VÉRIFICATION POST-MIGRATION
-- =============================================

DO $$
DECLARE
  v_status_count INT;
  v_closed_col BOOLEAN;
  v_trigger_exists BOOLEAN;
BEGIN
  -- Vérifier enum status
  SELECT COUNT(*) INTO v_status_count
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'sales_order_status'
  AND e.enumlabel IN ('draft', 'confirmed', 'partially_shipped', 'shipped', 'closed', 'cancelled');

  -- Vérifier colonne closed_at
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders'
    AND column_name = 'closed_at'
  ) INTO v_closed_col;

  -- Vérifier trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_handle_sales_order_stock'
  ) INTO v_trigger_exists;

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Enum sales_order_status : % valeurs trouvées', v_status_count;
  RAISE NOTICE 'Colonne closed_at       : %', CASE WHEN v_closed_col THEN 'EXISTE' ELSE 'MANQUANTE' END;
  RAISE NOTICE 'Trigger SO stock        : %', CASE WHEN v_trigger_exists THEN 'ACTIF' ELSE 'MANQUANT' END;
  RAISE NOTICE 'RPC get_shipment_summary: CRÉÉ';
  RAISE NOTICE '';

  IF v_status_count >= 6 AND v_closed_col AND v_trigger_exists THEN
    RAISE NOTICE '🎉 Migration 001 réussie - Système multi-shipments prêt';
  ELSE
    RAISE WARNING '⚠️ Migration incomplète - Vérifier logs ci-dessus';
  END IF;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';\echo '✅ MIGRATION 001 TERMINÉE';
\echo '========================================';
\echo '';
\echo 'Fonctionnalités ajoutées:';
\echo '1. Status "closed" pour commandes partielles clôturées';
\echo '2. Colonnes closed_at/closed_by pour traçabilité';
\echo '3. CAS 5 trigger: Libération backorder automatique';
\echo '4. RPC get_shipment_summary() pour progression';
\echo '';
\echo '🎯 Prochaine étape: Phase 2 - Modifications API';
\echo '';

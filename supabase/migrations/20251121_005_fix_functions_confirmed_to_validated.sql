--
-- Migration: Corriger functions PostgreSQL utilisant 'confirmed' → 'validated'
-- Date: 2025-11-21
-- Raison: Suite migration enums purchase_order_status + sales_order_status
--

-- ============================================================================
-- FUNCTION 1: check_orders_stock_consistency
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_orders_stock_consistency()
RETURNS TABLE(
    order_type TEXT,
    order_id UUID,
    order_number TEXT,
    product_id UUID,
    product_name TEXT,
    expected_movements INTEGER,
    actual_movements INTEGER,
    status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Vérifier cohérence commandes clients validées
    RETURN QUERY
    WITH sales_expected AS (
        SELECT
            so.id as order_id,
            so.order_number,
            soi.product_id,
            p.name as product_name,
            COUNT(soi.*) as expected_forecast_movements
        FROM sales_orders so
        JOIN sales_order_items soi ON so.id = soi.sales_order_id
        JOIN products p ON soi.product_id = p.id
        WHERE so.status IN ('validated', 'partially_shipped', 'shipped', 'delivered')
        GROUP BY so.id, so.order_number, soi.product_id, p.name
    ),
    sales_actual AS (
        SELECT
            sm.reference_id::uuid as order_id,
            sm.product_id,
            COUNT(*) as actual_movements
        FROM stock_movements sm
        WHERE sm.reference_type = 'sales_order_forecast'
        AND sm.affects_forecast = true
        GROUP BY sm.reference_id::uuid, sm.product_id
    )
    SELECT
        'sales_order'::TEXT,
        se.order_id,
        se.order_number,
        se.product_id,
        se.product_name,
        se.expected_forecast_movements::INTEGER,
        COALESCE(sa.actual_movements, 0)::INTEGER,
        CASE
            WHEN COALESCE(sa.actual_movements, 0) = se.expected_forecast_movements THEN 'OK'
            ELSE 'INCONSISTENT'
        END::TEXT
    FROM sales_expected se
    LEFT JOIN sales_actual sa ON se.order_id = sa.order_id AND se.product_id = sa.product_id;

    -- Ajouter vérifications pour commandes fournisseurs si nécessaire
    -- TODO: Ajouter logique similaire pour purchase_orders
END;
$$;

-- ============================================================================
-- FUNCTION 2: handle_po_item_quantity_change_confirmed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_po_item_quantity_change_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_po_status purchase_order_status;
  v_po_number TEXT;
  v_old_net_forecast INTEGER;
  v_new_net_forecast INTEGER;
  v_qty_diff INTEGER;
  v_performed_by UUID;
BEGIN
  -- Récupérer status commande et created_by
  SELECT status, po_number, created_by INTO v_po_status, v_po_number, v_performed_by
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  -- ✅ SEULEMENT pour commandes validées ou partiellement reçues
  IF v_po_status IN ('validated', 'partially_received') THEN

    -- ✅ CALCUL DIFFÉRENTIEL NET (prend en compte quantity_received)
    -- OLD net forecast : quantité encore attendue AVANT modification
    v_old_net_forecast := OLD.quantity - OLD.quantity_received;

    -- NEW net forecast : quantité encore attendue APRÈS modification
    v_new_net_forecast := NEW.quantity - NEW.quantity_received;

    -- Différence à appliquer au prévisionnel
    v_qty_diff := v_new_net_forecast - v_old_net_forecast;

    -- ✅ Créer mouvement SEULEMENT si différence non nulle
    IF v_qty_diff != 0 THEN

      -- ✅ Créer stock_movement pour ajuster forecasted_in
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
        NEW.product_id,
        (CASE
          WHEN v_qty_diff > 0 THEN 'IN'   -- Augmentation prévisionnel
          ELSE 'OUT'                       -- Diminution prévisionnel
        END)::movement_type,
        v_qty_diff,  -- Peut être positif ou négatif
        stock_forecasted_in,
        stock_forecasted_in + v_qty_diff,
        'purchase_order',
        NEW.purchase_order_id,
        format('Ajustement forecasted_in: Quantité modifiée %s → %s (net: %s → %s) - PO %s',
               OLD.quantity, NEW.quantity, v_old_net_forecast, v_new_net_forecast, v_po_number),
        'purchase_reception',
        true,  -- ✅ Affecte forecast
        'in',  -- ✅ Type forecast IN
        v_performed_by,
        NOW()
      FROM products WHERE id = NEW.product_id;

      RAISE NOTICE '✅ [BUG #5 FIX] Forecasted_in ajusté pour produit % (diff: %s = %s - %s) - PO %',
        NEW.product_id, v_qty_diff, v_new_net_forecast, v_old_net_forecast, v_po_number;
    ELSE
      RAISE NOTICE 'ℹ️ Quantité modifiée mais net forecast identique (produit: %, PO: %)',
        NEW.product_id, v_po_number;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCTION 3: handle_so_item_quantity_change_confirmed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_so_item_quantity_change_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_so_status sales_order_status;
  v_so_number TEXT;
  v_old_net_forecast INTEGER;
  v_new_net_forecast INTEGER;
  v_qty_diff INTEGER;
  v_performed_by UUID;
BEGIN
  -- Récupérer status commande et created_by
  SELECT status, order_number, created_by INTO v_so_status, v_so_number, v_performed_by
  FROM sales_orders
  WHERE id = NEW.sales_order_id;

  -- ✅ SEULEMENT pour commandes validées ou partiellement expédiées
  IF v_so_status IN ('validated', 'partially_shipped') THEN

    -- ✅ CALCUL DIFFÉRENTIEL NET (prend en compte quantity_shipped)
    -- OLD net forecast : quantité encore réservée AVANT modification
    v_old_net_forecast := OLD.quantity - OLD.quantity_shipped;

    -- NEW net forecast : quantité encore réservée APRÈS modification
    v_new_net_forecast := NEW.quantity - NEW.quantity_shipped;

    -- Différence à appliquer au prévisionnel
    v_qty_diff := v_new_net_forecast - v_old_net_forecast;

    -- ✅ Créer mouvement SEULEMENT si différence non nulle
    IF v_qty_diff != 0 THEN

      -- ✅ Créer stock_movement pour ajuster forecasted_out
      -- NOTE: Pour forecasted_out, logique inversée :
      --   - Réserver PLUS (v_qty_diff > 0) = OUT (diminue stock disponible)
      --   - Réserver MOINS (v_qty_diff < 0) = IN (libère stock)
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
        NEW.product_id,
        (CASE
          WHEN v_qty_diff > 0 THEN 'OUT'  -- Augmentation réservation
          ELSE 'IN'                        -- Diminution réservation (libération)
        END)::movement_type,
        -v_qty_diff,  -- ✅ INVERSÉ pour forecasted_out (OUT = négatif, IN = positif)
        stock_forecasted_out,
        stock_forecasted_out - v_qty_diff,
        'sales_order',
        NEW.sales_order_id,
        format('Ajustement forecasted_out: Quantité modifiée %s → %s (net: %s → %s) - SO %s',
               OLD.quantity, NEW.quantity, v_old_net_forecast, v_new_net_forecast, v_so_number),
        'sale',
        true,  -- ✅ Affecte forecast
        'out', -- ✅ Type forecast OUT
        v_performed_by,
        NOW()
      FROM products WHERE id = NEW.product_id;

      RAISE NOTICE '✅ [BUG #5 FIX] Forecasted_out ajusté pour produit % (diff: %s = %s - %s) - SO %',
        NEW.product_id, v_qty_diff, v_new_net_forecast, v_old_net_forecast, v_so_number;
    ELSE
      RAISE NOTICE 'ℹ️ Quantité modifiée mais net forecast identique (produit: %, SO: %)',
        NEW.product_id, v_so_number;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCTION 4: manage_sales_order_stock
-- ============================================================================

CREATE OR REPLACE FUNCTION public.manage_sales_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
  v_old_status sales_order_status;
  v_new_status sales_order_status;
  v_old_payment_status VARCHAR(50);
  v_new_payment_status VARCHAR(50);
  v_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    v_user_id := NEW.created_by;
  END IF;

  v_new_status := NEW.status;
  v_new_payment_status := COALESCE(NEW.payment_status, 'pending');

  IF TG_OP = 'UPDATE' THEN
    v_old_status := OLD.status;
    v_old_payment_status := COALESCE(OLD.payment_status, 'pending');
  END IF;

  -- CAS 1: NOUVELLE COMMANDE VALIDÉE (non payée) → Stock prévisionnel OUT
  IF TG_OP = 'INSERT' AND v_new_status = 'validated' AND v_new_payment_status != 'paid' THEN
    FOR v_item IN
      SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
    LOOP
      -- Créer mouvement prévisionnel OUT
      INSERT INTO stock_movements (
        product_id, movement_type, quantity_change,
        quantity_before, quantity_after,
        reference_type, reference_id,
        reason_code, notes,
        affects_forecast, forecast_type,
        performed_by
      ) VALUES (
        v_item.product_id,
        'OUT',
        -v_item.quantity, -- Négatif pour sortie
        0, 0, -- N'affecte pas le stock réel
        'sales_order',
        NEW.id::text,
        'sale',
        'Commande client ' || NEW.order_number || ' (non payée - prévisionnel)',
        true,  -- Affecte le prévisionnel
        'out', -- Type prévisionnel sortie
        v_user_id
      );
    END LOOP;

  -- CAS 2: COMMANDE PASSE DE "NON PAYÉE" À "PAYÉE" → Prévisionnel devient disponible pour sortie
  ELSIF TG_OP = 'UPDATE'
    AND v_old_payment_status != 'paid'
    AND v_new_payment_status = 'paid'
    AND v_new_status = 'validated' THEN

    FOR v_item IN
      SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
    LOOP
      -- Annuler le mouvement prévisionnel (le stock redevient disponible pour sortie)
      INSERT INTO stock_movements (
        product_id, movement_type, quantity_change,
        quantity_before, quantity_after,
        reference_type, reference_id,
        reason_code, notes,
        affects_forecast, forecast_type,
        performed_by
      ) VALUES (
        v_item.product_id,
        'IN',
        v_item.quantity, -- Positif pour annuler le prévisionnel OUT
        0, 0,
        'sales_order',
        NEW.id::text,
        'sale',
        'Paiement reçu pour commande ' || NEW.order_number || ' (annulation prévisionnel)',
        true,
        'out',
        v_user_id
      );
    END LOOP;

  -- CAS 3: SORTIE ENTREPÔT (commande payée) → Stock réel OUT
  ELSIF TG_OP = 'UPDATE'
    AND NEW.warehouse_exit_at IS NOT NULL
    AND OLD.warehouse_exit_at IS NULL
    AND v_new_payment_status = 'paid' THEN

    FOR v_item IN
      SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
    LOOP
      -- Mouvement réel de sortie stock
      INSERT INTO stock_movements (
        product_id, movement_type, quantity_change,
        quantity_before, quantity_after,
        reference_type, reference_id,
        reason_code, notes,
        affects_forecast, forecast_type,
        performed_by
      ) VALUES (
        v_item.product_id,
        'OUT',
        -v_item.quantity,
        (SELECT stock_real FROM products WHERE id = v_item.product_id),
        (SELECT stock_real FROM products WHERE id = v_item.product_id) - v_item.quantity,
        'sales_order',
        NEW.id::text,
        'sale',
        'Sortie entrepôt pour commande ' || NEW.order_number,
        false, -- Affecte stock réel
        NULL,
        v_user_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCTION 5: auto_cancel_unpaid_orders
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_cancel_unpaid_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Annuler les commandes clients non payées après 7 jours
    UPDATE sales_orders
    SET
        status = 'cancelled',
        cancellation_reason = 'Annulation automatique - Non payé après 7 jours',
        cancelled_at = NOW()
    WHERE
        status = 'validated'
        AND payment_status IN ('pending', 'partial')
        AND created_at < NOW() - INTERVAL '7 days';

    -- Annuler les commandes fournisseurs non validées après 30 jours
    UPDATE purchase_orders
    SET
        status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n[AUTO] Annulation après 30 jours sans confirmation'
    WHERE
        status = 'draft'
        AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================================================
-- Commentaires
-- ============================================================================

COMMENT ON FUNCTION public.check_orders_stock_consistency IS
'Vérifie cohérence entre commandes et mouvements stock prévisionnels';

COMMENT ON FUNCTION public.handle_po_item_quantity_change_confirmed IS
'Trigger: Ajuste forecasted_in quand quantité item commande fournisseur validée change';

COMMENT ON FUNCTION public.handle_so_item_quantity_change_confirmed IS
'Trigger: Ajuste forecasted_out quand quantité item commande client validée change';

COMMENT ON FUNCTION public.manage_sales_order_stock IS
'Trigger: Gère mouvements stock (prévisionnel + réel) lors création/modification commande client';

COMMENT ON FUNCTION public.auto_cancel_unpaid_orders IS
'Cron: Annule automatiquement commandes non payées après délai (7j clients, 30j fournisseurs)';

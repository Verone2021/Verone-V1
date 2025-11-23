-- =====================================================
-- MIGRATION CORRECTIVE : Fix Stock Movements Reference
-- Date: 2025-11-23
-- Priority: P1 - CORRECTIF CRITIQUE
-- =====================================================
-- RAISON : Corriger reference_type pour que page "Mouvements de stock" affiche les données
-- IMPACT : Mouvements visibles dans historique + Modal détails réception fonctionnel
-- =====================================================

-- =============================================================================
-- MODIFIER : update_stock_on_reception() - Corriger reference_type
-- =============================================================================

CREATE OR REPLACE FUNCTION update_stock_on_reception()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_po_number TEXT;
    v_total_quantity INTEGER;
    v_total_received INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    -- Récupérer stock AVANT modification
    SELECT stock_real INTO v_stock_before
    FROM products
    WHERE id = NEW.product_id;

    -- Étape 1: Mettre à jour stock produit
    UPDATE products
    SET
        stock_real = stock_real + NEW.quantity_received,
        stock_forecasted_in = stock_forecasted_in - NEW.quantity_received
    WHERE id = NEW.product_id
    RETURNING stock_real INTO v_stock_after;

    -- ✅ CORRIGÉ : reference_type = 'purchase_order' (au lieu de 'purchase_order_reception')
    -- ✅ CORRIGÉ : reference_id = NEW.purchase_order_id (au lieu de NEW.id)
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
        performed_by
    ) VALUES (
        NEW.product_id,
        'IN',
        NEW.quantity_received,
        v_stock_before,
        v_stock_after,
        'purchase_order',
        NEW.purchase_order_id,
        'Réception commande fournisseur PO #' || (SELECT po_number FROM purchase_orders WHERE id = NEW.purchase_order_id),
        'purchase_reception',
        NEW.received_by
    );

    -- Étape 2: Mettre à jour purchase_order_items
    UPDATE purchase_order_items
    SET quantity_received = quantity_received + NEW.quantity_received
    WHERE purchase_order_id = NEW.purchase_order_id AND product_id = NEW.product_id;

    -- Étape 3: Vérifier si PO complètement reçue
    SELECT po_number INTO v_po_number
    FROM purchase_orders WHERE id = NEW.purchase_order_id;

    SELECT SUM(quantity), SUM(quantity_received)
    INTO v_total_quantity, v_total_received
    FROM purchase_order_items WHERE purchase_order_id = NEW.purchase_order_id;

    IF v_total_received >= v_total_quantity THEN
        UPDATE purchase_orders
        SET status = 'received', received_at = NOW(), received_by = NEW.received_by
        WHERE id = NEW.purchase_order_id AND status != 'received';

        RAISE NOTICE 'PO % fully received', v_po_number;
    ELSIF v_total_received > 0 THEN
        UPDATE purchase_orders
        SET status = 'partially_received'
        WHERE id = NEW.purchase_order_id AND status NOT IN ('received', 'partially_received');

        RAISE NOTICE 'PO % partially received', v_po_number;
    END IF;

    RETURN NEW;
END;
$$;

-- =============================================================================
-- MODIFIER : update_stock_on_shipment() - Corriger reference_type
-- =============================================================================

CREATE OR REPLACE FUNCTION update_stock_on_shipment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_order_number TEXT;
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
    v_stock_before INTEGER;
    v_stock_after INTEGER;
BEGIN
    -- Récupérer stock AVANT modification
    SELECT stock_real INTO v_stock_before
    FROM products
    WHERE id = NEW.product_id;

    -- Étape 1: Mettre à jour stock produit
    UPDATE products
    SET
        stock_real = stock_real - NEW.quantity_shipped,
        stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
    WHERE id = NEW.product_id
    RETURNING stock_real INTO v_stock_after;

    -- ✅ CORRIGÉ : reference_type = 'sales_order' (au lieu de 'sales_order_shipment')
    -- ✅ CORRIGÉ : reference_id = NEW.sales_order_id (au lieu de NEW.id)
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
        performed_by
    ) VALUES (
        NEW.product_id,
        'OUT',
        NEW.quantity_shipped,
        v_stock_before,
        v_stock_after,
        'sales_order',
        NEW.sales_order_id,
        'Expédition commande client SO #' || (SELECT order_number FROM sales_orders WHERE id = NEW.sales_order_id),
        'sale',
        NEW.shipped_by
    );

    -- Étape 2: Mettre à jour sales_order_items
    UPDATE sales_order_items
    SET quantity_shipped = quantity_shipped + NEW.quantity_shipped
    WHERE sales_order_id = NEW.sales_order_id AND product_id = NEW.product_id;

    -- Étape 3: Vérifier si SO complètement expédiée
    SELECT order_number INTO v_order_number
    FROM sales_orders WHERE id = NEW.sales_order_id;

    SELECT SUM(quantity), SUM(quantity_shipped)
    INTO v_total_quantity, v_total_shipped
    FROM sales_order_items WHERE sales_order_id = NEW.sales_order_id;

    IF v_total_shipped >= v_total_quantity THEN
        UPDATE sales_orders
        SET status = 'shipped', shipped_at = NOW(), shipped_by = NEW.shipped_by
        WHERE id = NEW.sales_order_id AND status != 'shipped';

        RAISE NOTICE 'SO % fully shipped', v_order_number;
    ELSIF v_total_shipped > 0 THEN
        UPDATE sales_orders
        SET status = 'partially_shipped'
        WHERE id = NEW.sales_order_id AND status NOT IN ('shipped', 'partially_shipped', 'delivered');

        RAISE NOTICE 'SO % partially shipped', v_order_number;
    END IF;

    RETURN NEW;
END;
$$;

-- =============================================================================
-- VALIDATION FINALE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🔧 MIGRATION 20251123_002: CORRECTIF STOCK_MOVEMENTS';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Corrections appliquées :';
    RAISE NOTICE '   - update_stock_on_reception() → reference_type = purchase_order';
    RAISE NOTICE '   - update_stock_on_shipment() → reference_type = sales_order';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Impact :';
    RAISE NOTICE '   - Page "Mouvements de stock" affichera les données';
    RAISE NOTICE '   - Modal détails réception affichera historique';
    RAISE NOTICE '   - Cohérence avec hooks frontend (use-movements-history.ts)';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

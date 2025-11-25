-- =====================================================
-- MIGRATION CRITIQUE : Correction reference_type/reference_id
-- Date: 2025-11-24
-- Priority: P0 - ARCHITECTURAL FIX
-- =====================================================
-- RAISON : Les mouvements de stock utilisent le mauvais reference_type/id
-- PROBLÈME : Impossible de lier un mouvement à une réception/expédition spécifique
-- IMPACT : Triggers DELETE ne peuvent PAS fonctionner correctement
-- =====================================================

-- =============================================================================
-- CORRIGER : update_stock_on_reception() - Reference Type
-- =============================================================================
-- AVANT : reference_type='purchase_order', reference_id=purchase_order_id
-- APRÈS : reference_type='reception', reference_id=reception_id
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

    -- ✅ CORRIGÉ : Créer mouvement stock avec BONNE référence
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
        'reception',  -- ✅ CORRIGÉ : était 'purchase_order'
        NEW.id,       -- ✅ CORRIGÉ : était 'NEW.purchase_order_id'
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
-- CORRIGER : update_stock_on_shipment() - Reference Type
-- =============================================================================
-- AVANT : reference_type='sales_order', reference_id=sales_order_id
-- APRÈS : reference_type='shipment', reference_id=shipment_id
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

    -- ✅ CORRIGÉ : Créer mouvement stock avec BONNE référence
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
        'shipment',  -- ✅ CORRIGÉ : était 'sales_order'
        NEW.id,      -- ✅ CORRIGÉ : était 'NEW.sales_order_id'
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
-- COMMENTAIRES
-- =============================================================================

COMMENT ON FUNCTION update_stock_on_reception() IS
'Mise à jour du stock lors de réception. Crée un mouvement de stock avec reference_type=''reception'' et reference_id=reception_id pour traçabilité précise.';

COMMENT ON FUNCTION update_stock_on_shipment() IS
'Mise à jour du stock lors d''expédition. Crée un mouvement de stock avec reference_type=''shipment'' et reference_id=shipment_id pour traçabilité précise.';

-- =============================================================================
-- VALIDATION FINALE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🔧 MIGRATION 20251124_005: REFERENCE TYPE CORRIGÉ';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fonctions corrigées :';
    RAISE NOTICE '   - update_stock_on_reception()';
    RAISE NOTICE '     → reference_type: "purchase_order" → "reception"';
    RAISE NOTICE '     → reference_id: purchase_order_id → reception_id';
    RAISE NOTICE '';
    RAISE NOTICE '   - update_stock_on_shipment()';
    RAISE NOTICE '     → reference_type: "sales_order" → "shipment"';
    RAISE NOTICE '     → reference_id: sales_order_id → shipment_id';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Impact :';
    RAISE NOTICE '   - Mouvements de stock liés à la réception/expédition spécifique';
    RAISE NOTICE '   - Triggers DELETE peuvent maintenant fonctionner correctement';
    RAISE NOTICE '   - Traçabilité granulaire restaurée';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT : Les données EXISTANTES doivent être migrées';
    RAISE NOTICE '    Voir migration 20251124_006_cleanup_stock_movements.sql';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

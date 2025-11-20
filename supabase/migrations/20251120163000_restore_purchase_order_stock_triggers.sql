-- =====================================================
-- MIGRATION 007: RESTAURATION TRIGGERS STOCK COMPLETS
-- Date: 2025-11-20
-- Priority: P0 - RECONSTRUCTION COMPLÈTE
-- =====================================================
-- RAISON: Recréer les 10 triggers stock avec la VRAIE structure database
-- PRÉREQUIS: Migrations 001-002 (colonnes status restaurées)
-- WORKFLOW: Basé sur colonnes status (pas timestamps)
-- =====================================================

-- =============================================================================
-- ÉTAPE 1: Créer table sales_order_shipments (symétrique à purchase_order_receptions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales_order_shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_shipped INTEGER NOT NULL CHECK (quantity_shipped > 0),
  shipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shipped_by UUID NOT NULL REFERENCES auth.users(id),
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_shipments_order ON sales_order_shipments(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_shipments_product ON sales_order_shipments(product_id);

-- RLS Policies (copie de purchase_order_receptions)
ALTER TABLE sales_order_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner/Admin can read sales_order_shipments" ON sales_order_shipments
  FOR SELECT USING (
    get_user_role() = ANY(ARRAY['owner'::user_role_type, 'admin'::user_role_type])
    AND user_has_access_to_organisation(get_user_organisation_id())
  );

CREATE POLICY "Owner/Admin can create sales_order_shipments" ON sales_order_shipments
  FOR INSERT WITH CHECK (
    get_user_role() = ANY(ARRAY['owner'::user_role_type, 'admin'::user_role_type])
    AND user_has_access_to_organisation(get_user_organisation_id())
  );

CREATE POLICY "Owner/Admin can delete sales_order_shipments" ON sales_order_shipments
  FOR DELETE USING (
    get_user_role() = ANY(ARRAY['owner'::user_role_type, 'admin'::user_role_type])
    AND user_has_access_to_organisation(get_user_organisation_id())
  );

-- =============================================================================
-- TRIGGER 1: sync_stock_alert_tracking_v2() - CENTRAL (products)
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_previsionnel INTEGER;
BEGIN
    -- Calculer stock prévisionnel
    v_previsionnel := NEW.stock_real + NEW.stock_forecasted_in - NEW.stock_forecasted_out;

    -- ALERTE 1: low_stock (stock_real < min_stock)
    IF NEW.stock_real < NEW.min_stock THEN
        INSERT INTO stock_alert_tracking (
            product_id, alert_type, alert_priority, stock_real,
            stock_forecasted_in, stock_forecasted_out, min_stock, validated
        ) VALUES (
            NEW.id, 'low_stock', 'P2', NEW.stock_real,
            NEW.stock_forecasted_in, NEW.stock_forecasted_out, NEW.min_stock, false
        )
        ON CONFLICT (product_id, alert_type)
        DO UPDATE SET
            stock_real = EXCLUDED.stock_real,
            stock_forecasted_in = EXCLUDED.stock_forecasted_in,
            stock_forecasted_out = EXCLUDED.stock_forecasted_out,
            min_stock = EXCLUDED.min_stock;
    ELSE
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'low_stock';
    END IF;

    -- ALERTE 2: out_of_stock (prévisionnel < 0) - INDÉPENDANTE
    IF v_previsionnel < 0 THEN
        INSERT INTO stock_alert_tracking (
            product_id, alert_type, alert_priority, stock_real,
            stock_forecasted_in, stock_forecasted_out, shortage_quantity, validated
        ) VALUES (
            NEW.id, 'out_of_stock', 'P3', NEW.stock_real,
            NEW.stock_forecasted_in, NEW.stock_forecasted_out, ABS(v_previsionnel), false
        )
        ON CONFLICT (product_id, alert_type)
        DO UPDATE SET
            stock_real = EXCLUDED.stock_real,
            stock_forecasted_in = EXCLUDED.stock_forecasted_in,
            stock_forecasted_out = EXCLUDED.stock_forecasted_out,
            shortage_quantity = EXCLUDED.shortage_quantity;
    ELSE
        DELETE FROM stock_alert_tracking
        WHERE product_id = NEW.id AND alert_type = 'out_of_stock';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_stock_alert_tracking_v2
    AFTER UPDATE OF stock_real, stock_forecasted_in, stock_forecasted_out, min_stock
    ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_stock_alert_tracking_v2();

-- =============================================================================
-- TRIGGER 2: validate_stock_alerts_on_po() - Valider alertes (purchase_orders)
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_stock_alerts_on_po()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    IF NEW.status = 'validated' AND OLD.status = 'draft' THEN
        FOR v_item IN
            SELECT product_id FROM purchase_order_items WHERE purchase_order_id = NEW.id
        LOOP
            UPDATE stock_alert_tracking
            SET validated = true, validated_at = NOW(), validated_by = NEW.validated_by
            WHERE product_id = v_item.product_id AND validated = false;

            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        END LOOP;

        RAISE NOTICE 'PO % validée : % alertes marquées validated=true', NEW.po_number, v_updated_count;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_validate_stock_alerts_on_po
    AFTER UPDATE OF status
    ON purchase_orders
    FOR EACH ROW
    WHEN (NEW.status = 'validated' AND OLD.status = 'draft')
    EXECUTE FUNCTION validate_stock_alerts_on_po();

-- =============================================================================
-- TRIGGER 3: update_po_forecasted_in() - PO validation (purchase_orders)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_po_forecasted_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    IF NEW.status = 'validated' AND OLD.status = 'draft' THEN
        FOR v_item IN
            SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = NEW.id
        LOOP
            UPDATE products
            SET stock_forecasted_in = stock_forecasted_in + v_item.quantity
            WHERE id = v_item.product_id;
        END LOOP;

        RAISE NOTICE 'PO % validée : forecasted_in mis à jour', NEW.po_number;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_update_forecasted_in
    AFTER UPDATE OF status
    ON purchase_orders
    FOR EACH ROW
    WHEN (NEW.status = 'validated' AND OLD.status = 'draft')
    EXECUTE FUNCTION update_po_forecasted_in();

-- =============================================================================
-- TRIGGER 4: rollback_po_forecasted() - PO cancellation (purchase_orders)
-- =============================================================================

CREATE OR REPLACE FUNCTION rollback_po_forecasted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Sécurité: interdire annulation si déjà reçu
        IF OLD.status IN ('received', 'partially_received') THEN
            RAISE EXCEPTION 'Cannot cancel PO % (status: %). Already received.', NEW.po_number, OLD.status;
        END IF;

        FOR v_item IN
            SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = NEW.id
        LOOP
            UPDATE products
            SET stock_forecasted_in = stock_forecasted_in - v_item.quantity
            WHERE id = v_item.product_id;
        END LOOP;

        RAISE NOTICE 'PO % annulée : forecasted_in rollback', NEW.po_number;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_cancellation_rollback
    AFTER UPDATE OF status
    ON purchase_orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
    EXECUTE FUNCTION rollback_po_forecasted();

-- =============================================================================
-- TRIGGER 5: update_stock_on_reception() - Physical reception (purchase_order_receptions)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_stock_on_reception()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_po_number TEXT;
    v_total_quantity INTEGER;
    v_total_received INTEGER;
BEGIN
    -- Étape 1: Mettre à jour stock produit
    UPDATE products
    SET
        stock_real = stock_real + NEW.quantity_received,
        stock_forecasted_in = stock_forecasted_in - NEW.quantity_received
    WHERE id = NEW.product_id;

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

CREATE TRIGGER trigger_reception_update_stock
    AFTER INSERT
    ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_reception();

-- =============================================================================
-- TRIGGER 6: update_so_forecasted_out() - SO validation (sales_orders)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_so_forecasted_out()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    IF NEW.status = 'validated' AND OLD.status = 'draft' THEN
        FOR v_item IN
            SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            UPDATE products
            SET stock_forecasted_out = stock_forecasted_out + v_item.quantity
            WHERE id = v_item.product_id;
        END LOOP;

        RAISE NOTICE 'SO % validée : forecasted_out mis à jour', NEW.order_number;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_so_update_forecasted_out
    AFTER UPDATE OF status
    ON sales_orders
    FOR EACH ROW
    WHEN (NEW.status = 'validated' AND OLD.status = 'draft')
    EXECUTE FUNCTION update_so_forecasted_out();

-- =============================================================================
-- TRIGGER 7: rollback_so_forecasted() - SO cancellation (sales_orders)
-- =============================================================================

CREATE OR REPLACE FUNCTION rollback_so_forecasted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Sécurité: interdire annulation si déjà expédié
        IF OLD.status IN ('shipped', 'partially_shipped', 'delivered') THEN
            RAISE EXCEPTION 'Cannot cancel SO % (status: %). Already shipped.', NEW.order_number, OLD.status;
        END IF;

        FOR v_item IN
            SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            UPDATE products
            SET stock_forecasted_out = stock_forecasted_out - v_item.quantity
            WHERE id = v_item.product_id;
        END LOOP;

        RAISE NOTICE 'SO % annulée : forecasted_out rollback', NEW.order_number;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_so_cancellation_rollback
    AFTER UPDATE OF status
    ON sales_orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
    EXECUTE FUNCTION rollback_so_forecasted();

-- =============================================================================
-- TRIGGER 8: update_stock_on_shipment() - Physical shipment (sales_order_shipments)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_stock_on_shipment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_number TEXT;
    v_total_quantity INTEGER;
    v_total_shipped INTEGER;
BEGIN
    -- Étape 1: Mettre à jour stock produit
    UPDATE products
    SET
        stock_real = stock_real - NEW.quantity_shipped,
        stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
    WHERE id = NEW.product_id;

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

CREATE TRIGGER trigger_shipment_update_stock
    AFTER INSERT
    ON sales_order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_shipment();

-- =============================================================================
-- TRIGGERS 9-10: create_notification_on_stock_alert() - Notifications (stock_alert_tracking)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_notification_on_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_name TEXT;
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_notification_priority TEXT;
BEGIN
    SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;

    IF NEW.alert_type = 'low_stock' THEN
        v_notification_title := 'Stock faible';
        v_notification_message := 'Le produit ' || v_product_name ||
            ' a un stock faible (' || NEW.stock_real || ' unités, seuil min: ' || NEW.min_stock || ').';
        v_notification_priority := 'important';
    ELSIF NEW.alert_type = 'out_of_stock' THEN
        v_notification_title := 'Stock prévisionnel négatif';
        v_notification_message := 'Le produit ' || v_product_name ||
            ' a un stock prévisionnel négatif (' || NEW.shortage_quantity || ' unités manquantes).';
        v_notification_priority := 'urgent';
    ELSE
        RETURN NEW;
    END IF;

    IF NEW.validated = true THEN
        v_notification_message := v_notification_message || ' Commande fournisseur en cours de traitement.';
    ELSE
        v_notification_message := v_notification_message || ' Réapprovisionnement requis.';
    END IF;

    -- Créer notification pour tous les utilisateurs Owner
    PERFORM create_notification_for_owners(
        'business',
        v_notification_priority,
        v_notification_title,
        v_notification_message,
        '/stocks/inventaire',
        'Voir Stock'
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_notification_on_stock_alert_insert
    AFTER INSERT
    ON stock_alert_tracking
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_on_stock_alert();

CREATE TRIGGER trigger_create_notification_on_stock_alert_update
    AFTER UPDATE
    ON stock_alert_tracking
    FOR EACH ROW
    WHEN (OLD.validated != NEW.validated OR OLD.stock_real != NEW.stock_real)
    EXECUTE FUNCTION create_notification_on_stock_alert();

-- =============================================================================
-- VALIDATION FINALE
-- =============================================================================

DO $$
DECLARE
    v_trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname IN (
        'trigger_sync_stock_alert_tracking_v2',
        'trigger_validate_stock_alerts_on_po',
        'trigger_po_update_forecasted_in',
        'trigger_po_cancellation_rollback',
        'trigger_reception_update_stock',
        'trigger_so_update_forecasted_out',
        'trigger_so_cancellation_rollback',
        'trigger_shipment_update_stock',
        'trigger_create_notification_on_stock_alert_insert',
        'trigger_create_notification_on_stock_alert_update'
    );

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '🎉 MIGRATION 007: RECONSTRUCTION TRIGGERS STOCK COMPLÈTE';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table créée :';
    RAISE NOTICE '   - sales_order_shipments (symétrique à purchase_order_receptions)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Triggers créés : % / 10 attendus', v_trigger_count;
    RAISE NOTICE '';
    RAISE NOTICE '📋 RÉCAPITULATIF :';
    RAISE NOTICE '   1. trigger_sync_stock_alert_tracking_v2 (products) - CENTRAL';
    RAISE NOTICE '   2. trigger_validate_stock_alerts_on_po (purchase_orders)';
    RAISE NOTICE '   3. trigger_po_update_forecasted_in (purchase_orders)';
    RAISE NOTICE '   4. trigger_po_cancellation_rollback (purchase_orders)';
    RAISE NOTICE '   5. trigger_reception_update_stock (purchase_order_receptions)';
    RAISE NOTICE '   6. trigger_so_update_forecasted_out (sales_orders)';
    RAISE NOTICE '   7. trigger_so_cancellation_rollback (sales_orders)';
    RAISE NOTICE '   8. trigger_shipment_update_stock (sales_order_shipments)';
    RAISE NOTICE '   9-10. trigger_create_notification_on_stock_alert (stock_alert_tracking)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 PROCHAINE ÉTAPE : Tester workflow complet end-to-end';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';

    IF v_trigger_count != 10 THEN
        RAISE EXCEPTION 'ERREUR: % triggers créés (10 attendus)', v_trigger_count;
    END IF;
END $$;

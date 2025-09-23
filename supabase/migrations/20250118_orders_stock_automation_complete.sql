-- ================================================
-- MIGRATION COMPLÈTE: GESTION STOCK PRÉVISIONNEL
-- Commandes Clients et Fournisseurs
-- ================================================

-- ================================================
-- PARTIE 0: TABLES ET COLONNES MANQUANTES
-- ================================================

-- Ajouter les colonnes manquantes sur sales_orders si elles n'existent pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sales_orders' AND column_name='ready_for_shipment') THEN
        ALTER TABLE sales_orders ADD COLUMN ready_for_shipment BOOLEAN DEFAULT false;
        COMMENT ON COLUMN sales_orders.ready_for_shipment IS 'Indique si la commande est prête pour expédition après paiement';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sales_orders' AND column_name='cancellation_reason') THEN
        ALTER TABLE sales_orders ADD COLUMN cancellation_reason TEXT;
        COMMENT ON COLUMN sales_orders.cancellation_reason IS 'Raison de l''annulation de la commande';
    END IF;

    -- Ajouter les colonnes de stock prévisionnel sur products si manquantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='products' AND column_name='min_stock') THEN
        ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5 CHECK (min_stock >= 0);
        COMMENT ON COLUMN products.min_stock IS 'Stock minimum critique';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='products' AND column_name='reorder_point') THEN
        ALTER TABLE products ADD COLUMN reorder_point INTEGER DEFAULT 10 CHECK (reorder_point >= 0);
        COMMENT ON COLUMN products.reorder_point IS 'Point de réapprovisionnement';
    END IF;
END $$;

-- Créer la table purchase_order_receptions pour gérer les réceptions partielles
CREATE TABLE IF NOT EXISTS purchase_order_receptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    received_by UUID NOT NULL REFERENCES auth.users(id),
    batch_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les réceptions
CREATE INDEX IF NOT EXISTS idx_purchase_receptions_order
    ON purchase_order_receptions(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receptions_product
    ON purchase_order_receptions(product_id);

-- Permissions RLS
ALTER TABLE purchase_order_receptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all purchase receptions" ON purchase_order_receptions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create purchase receptions" ON purchase_order_receptions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update purchase receptions" ON purchase_order_receptions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ================================================
-- PARTIE 1: COMMANDES CLIENTS (SALES ORDERS)
-- ================================================

-- Fonction pour gérer le stock prévisionnel des commandes clients
CREATE OR REPLACE FUNCTION handle_sales_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_old_status TEXT;
    v_new_status TEXT;
    v_payment_status TEXT;
BEGIN
    -- Gestion des valeurs NULL pour OLD (INSERT)
    IF TG_OP = 'INSERT' THEN
        v_old_status := '';
    ELSE
        v_old_status := COALESCE(OLD.status, '');
    END IF;

    v_new_status := NEW.status;
    v_payment_status := NEW.payment_status;

    -- Cas 1: Commande confirmée mais non payée → Stock prévisionnel OUT
    IF v_new_status = 'confirmed' AND v_old_status != 'confirmed'
       AND (v_payment_status = 'pending' OR v_payment_status = 'partial') THEN

        -- Pour chaque item de la commande
        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Augmenter le stock prévisionnel OUT
            UPDATE products
            SET stock_forecasted_out = stock_forecasted_out + v_item.quantity
            WHERE id = v_item.product_id;

            -- Créer un mouvement de stock prévisionnel
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'OUT',
                v_item.quantity,
                stock_real,
                stock_real, -- Le stock réel ne change pas encore
                'sale',
                'sales_order',
                NEW.id,
                'Commande client confirmée - Stock prévisionnel OUT',
                true,
                'out',
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;

    -- Cas 2: Paiement reçu → Préparer pour expédition
    ELSIF v_payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status != 'paid') THEN

        -- Marquer la commande comme prête pour expédition
        NEW.ready_for_shipment := true;

    -- Cas 3: Sortie entrepôt → Déduction stock réel
    ELSIF NEW.warehouse_exit_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.warehouse_exit_at IS NULL) THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Réduire le stock prévisionnel OUT et le stock réel
            UPDATE products
            SET
                stock_forecasted_out = GREATEST(0, stock_forecasted_out - v_item.quantity),
                stock_real = GREATEST(0, stock_real - v_item.quantity)
            WHERE id = v_item.product_id;

            -- Créer un mouvement de stock réel
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'OUT',
                v_item.quantity,
                stock_real + v_item.quantity,
                stock_real,
                'sale',
                'sales_order',
                NEW.id,
                'Sortie entrepôt - Déduction stock réel',
                false,
                NULL,
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;

    -- Cas 4: Annulation de commande → Restauration stock
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        FOR v_item IN
            SELECT * FROM sales_order_items
            WHERE sales_order_id = NEW.id
        LOOP
            -- Si la commande n'était pas encore sortie, restaurer le prévisionnel
            IF TG_OP = 'UPDATE' AND OLD.warehouse_exit_at IS NULL THEN
                UPDATE products
                SET stock_forecasted_out = GREATEST(0, stock_forecasted_out - v_item.quantity)
                WHERE id = v_item.product_id;
            END IF;

            -- Créer un mouvement d'annulation
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'ADJUST',
                0,
                stock_real,
                stock_real,
                'manual_adjustment',
                'sales_order',
                NEW.id,
                'Annulation commande - Restauration stock prévisionnel',
                true,
                'out',
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les commandes clients
DROP TRIGGER IF EXISTS trigger_sales_order_stock ON sales_orders;
CREATE TRIGGER trigger_sales_order_stock
    AFTER INSERT OR UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_sales_order_stock();

-- ================================================
-- PARTIE 2: COMMANDES FOURNISSEURS (PURCHASE ORDERS)
-- ================================================

-- Fonction pour gérer le stock prévisionnel des commandes fournisseurs
CREATE OR REPLACE FUNCTION handle_purchase_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_old_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Gestion des valeurs NULL pour OLD (INSERT)
    IF TG_OP = 'INSERT' THEN
        v_old_status := '';
    ELSE
        v_old_status := COALESCE(OLD.status, '');
    END IF;

    v_new_status := NEW.status;

    -- Cas 1: Commande confirmée → Stock prévisionnel IN
    IF v_new_status = 'confirmed' AND v_old_status != 'confirmed' THEN

        FOR v_item IN
            SELECT * FROM purchase_order_items
            WHERE purchase_order_id = NEW.id
        LOOP
            -- Augmenter le stock prévisionnel IN
            UPDATE products
            SET stock_forecasted_in = stock_forecasted_in + v_item.quantity
            WHERE id = v_item.product_id;

            -- Créer un mouvement de stock prévisionnel
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'IN',
                v_item.quantity,
                stock_real,
                stock_real, -- Le stock réel ne change pas encore
                'purchase_reception',
                'purchase_order',
                NEW.id,
                'Commande fournisseur confirmée - Stock prévisionnel IN',
                true,
                'in',
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;

    -- Cas 2: Réception partielle
    ELSIF v_new_status = 'partially_received' AND v_old_status != 'partially_received' THEN

        -- Géré par la table purchase_order_receptions
        NULL;

    -- Cas 3: Réception complète → Stock réel
    ELSIF v_new_status = 'received' AND v_old_status != 'received' THEN

        FOR v_item IN
            SELECT * FROM purchase_order_items
            WHERE purchase_order_id = NEW.id
        LOOP
            -- Réduire le stock prévisionnel IN et augmenter le stock réel
            UPDATE products
            SET
                stock_forecasted_in = GREATEST(0, stock_forecasted_in - v_item.quantity),
                stock_real = stock_real + v_item.quantity
            WHERE id = v_item.product_id;

            -- Créer un mouvement de stock réel
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'IN',
                v_item.quantity,
                stock_real - v_item.quantity,
                stock_real,
                'purchase_reception',
                'purchase_order',
                NEW.id,
                'Réception commande fournisseur - Ajout stock réel',
                false,
                NULL,
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;

    -- Cas 4: Annulation de commande → Restauration stock
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN

        FOR v_item IN
            SELECT * FROM purchase_order_items
            WHERE purchase_order_id = NEW.id
        LOOP
            -- Si la commande n'était pas encore reçue, restaurer le prévisionnel
            IF v_old_status NOT IN ('received', 'partially_received') THEN
                UPDATE products
                SET stock_forecasted_in = GREATEST(0, stock_forecasted_in - v_item.quantity)
                WHERE id = v_item.product_id;
            END IF;

            -- Créer un mouvement d'annulation
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                quantity_before,
                quantity_after,
                reason_code,
                reference_type,
                reference_id,
                notes,
                affects_forecast,
                forecast_type,
                performed_by,
                performed_at
            )
            SELECT
                v_item.product_id,
                'ADJUST',
                0,
                stock_real,
                stock_real,
                'manual_adjustment',
                'purchase_order',
                NEW.id,
                'Annulation commande fournisseur - Restauration stock prévisionnel',
                true,
                'in',
                NEW.created_by,
                NOW()
            FROM products WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les commandes fournisseurs
DROP TRIGGER IF EXISTS trigger_purchase_order_stock ON purchase_orders;
CREATE TRIGGER trigger_purchase_order_stock
    AFTER INSERT OR UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_order_stock();

-- ================================================
-- PARTIE 3: AUTO-ANNULATION APRÈS DÉLAI
-- ================================================

-- Fonction pour annuler automatiquement les commandes non payées après 7 jours
CREATE OR REPLACE FUNCTION auto_cancel_unpaid_orders()
RETURNS void AS $$
BEGIN
    -- Annuler les commandes clients non payées après 7 jours
    UPDATE sales_orders
    SET
        status = 'cancelled',
        cancellation_reason = 'Annulation automatique - Non payé après 7 jours',
        cancelled_at = NOW()
    WHERE
        status = 'confirmed'
        AND payment_status IN ('pending', 'partial')
        AND created_at < NOW() - INTERVAL '7 days';

    -- Annuler les commandes fournisseurs non confirmées après 30 jours
    UPDATE purchase_orders
    SET
        status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n[AUTO] Annulation après 30 jours sans confirmation'
    WHERE
        status = 'draft'
        AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- PARTIE 4: RÉCEPTION PARTIELLE (PURCHASE ORDERS)
-- ================================================

-- Fonction pour gérer les réceptions partielles
CREATE OR REPLACE FUNCTION handle_purchase_reception()
RETURNS TRIGGER AS $$
DECLARE
    v_total_received INTEGER;
    v_total_ordered INTEGER;
BEGIN
    -- Augmenter le stock réel pour la quantité reçue
    UPDATE products
    SET
        stock_real = stock_real + NEW.quantity_received,
        stock_forecasted_in = GREATEST(0, stock_forecasted_in - NEW.quantity_received)
    WHERE id = NEW.product_id;

    -- Créer un mouvement de stock
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reason_code,
        reference_type,
        reference_id,
        notes,
        affects_forecast,
        performed_by,
        performed_at
    )
    SELECT
        NEW.product_id,
        'IN',
        NEW.quantity_received,
        stock_real - NEW.quantity_received,
        stock_real,
        'purchase_reception',
        'purchase_reception',
        NEW.id,
        'Réception partielle fournisseur',
        false,
        NEW.received_by,
        NEW.received_at
    FROM products WHERE id = NEW.product_id;

    -- Vérifier si toute la commande est reçue
    SELECT
        COALESCE(SUM(pr.quantity_received), 0),
        poi.quantity
    INTO v_total_received, v_total_ordered
    FROM purchase_order_items poi
    LEFT JOIN purchase_order_receptions pr ON pr.purchase_order_id = poi.purchase_order_id
        AND pr.product_id = poi.product_id
    WHERE poi.purchase_order_id = NEW.purchase_order_id
        AND poi.product_id = NEW.product_id
    GROUP BY poi.quantity;

    -- Mettre à jour le statut de la commande si nécessaire
    IF v_total_received >= v_total_ordered THEN
        -- Vérifier si TOUS les items sont reçus
        IF NOT EXISTS (
            SELECT 1 FROM purchase_order_items poi
            WHERE poi.purchase_order_id = NEW.purchase_order_id
            AND NOT EXISTS (
                SELECT 1 FROM purchase_order_receptions pr
                WHERE pr.purchase_order_id = poi.purchase_order_id
                AND pr.product_id = poi.product_id
                GROUP BY pr.product_id
                HAVING COALESCE(SUM(pr.quantity_received), 0) >= poi.quantity
            )
        ) THEN
            UPDATE purchase_orders
            SET status = 'received'
            WHERE id = NEW.purchase_order_id;
        END IF;
    ELSE
        UPDATE purchase_orders
        SET status = 'partially_received'
        WHERE id = NEW.purchase_order_id
        AND status != 'partially_received';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les réceptions
DROP TRIGGER IF EXISTS trigger_purchase_reception ON purchase_order_receptions;
CREATE TRIGGER trigger_purchase_reception
    AFTER INSERT ON purchase_order_receptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_reception();

-- ================================================
-- PARTIE 5: INDEXES ET OPTIMISATIONS
-- ================================================

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sales_orders_status_payment
    ON sales_orders(status, payment_status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
    ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_stock_movements_forecast
    ON stock_movements(affects_forecast, forecast_type);

-- ================================================
-- PARTIE 6: VUES UTILES
-- ================================================

-- Vue pour visualiser le stock complet (réel + prévisionnel)
CREATE OR REPLACE VIEW stock_overview AS
SELECT
    p.id,
    p.name,
    p.sku,
    p.stock_real,
    p.stock_forecasted_in,
    p.stock_forecasted_out,
    p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out AS stock_available,
    p.stock_real + p.stock_forecasted_in AS stock_future,
    CASE
        WHEN p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out < COALESCE(p.min_stock, 5)
        THEN 'critical'
        WHEN p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out < COALESCE(p.reorder_point, 10)
        THEN 'low'
        ELSE 'ok'
    END AS stock_status
FROM products p;

-- Vue pour les commandes en attente de traitement
CREATE OR REPLACE VIEW pending_orders AS
SELECT
    'sales' AS order_type,
    id,
    order_number,
    customer_id AS partner_id,
    status::TEXT AS status,
    payment_status,
    created_at,
    'En attente de paiement' AS pending_reason
FROM sales_orders
WHERE status = 'confirmed'
    AND payment_status IN ('pending', 'partial')
    AND warehouse_exit_at IS NULL

UNION ALL

SELECT
    'purchase' AS order_type,
    id,
    po_number AS order_number,
    supplier_id AS partner_id,
    status::TEXT AS status,
    NULL AS payment_status,
    created_at,
    'En attente de réception' AS pending_reason
FROM purchase_orders
WHERE status IN ('confirmed', 'partially_received');

-- Permissions pour les vues
GRANT SELECT ON stock_overview TO authenticated;
GRANT SELECT ON pending_orders TO authenticated;

-- ================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ================================================

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Gère automatiquement les mouvements de stock prévisionnels et réels pour les commandes clients.
- Confirmation → Stock prévisionnel OUT
- Paiement → Préparation expédition
- Sortie entrepôt → Déduction stock réel
- Annulation → Restauration stock';

COMMENT ON FUNCTION handle_purchase_order_stock() IS
'Gère automatiquement les mouvements de stock prévisionnels et réels pour les commandes fournisseurs.
- Confirmation → Stock prévisionnel IN
- Réception → Ajout stock réel
- Annulation → Restauration stock';

COMMENT ON FUNCTION auto_cancel_unpaid_orders() IS
'Annule automatiquement les commandes non payées après un délai défini.
- Commandes clients: 7 jours
- Commandes fournisseurs: 30 jours';

COMMENT ON TABLE purchase_order_receptions IS
'Table pour gérer les réceptions partielles des commandes fournisseurs.';
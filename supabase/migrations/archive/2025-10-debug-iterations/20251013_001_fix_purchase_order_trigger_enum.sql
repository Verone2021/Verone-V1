-- =============================================
-- MIGRATION: Correction Bug Trigger Enum Purchase Orders
-- Date: 2025-10-13
-- =============================================
-- Problème identifié: Le trigger handle_purchase_order_stock() utilise TEXT au lieu de purchase_order_status enum
-- et COALESCE(OLD.status, '') génère une erreur car on ne peut pas coercer un enum vers string vide
-- Erreur: "invalid input value for enum purchase_order_status: """
-- Solution: Utiliser le type enum correct et une valeur par défaut valide

-- =============================================
-- CORRECTION: Fonction handle_purchase_order_stock()
-- =============================================

CREATE OR REPLACE FUNCTION handle_purchase_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_old_status purchase_order_status;  -- FIX: Utiliser enum au lieu de TEXT
    v_new_status purchase_order_status;  -- FIX: Utiliser enum au lieu de TEXT
BEGIN
    -- Gestion des valeurs NULL pour OLD (INSERT)
    IF TG_OP = 'INSERT' THEN
        v_old_status := 'draft'::purchase_order_status;  -- FIX: Valeur par défaut enum valide
    ELSE
        v_old_status := COALESCE(OLD.status, 'draft'::purchase_order_status);  -- FIX: COALESCE avec enum
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

-- =============================================
-- VÉRIFICATION: Commentaire sur la fonction
-- =============================================

COMMENT ON FUNCTION handle_purchase_order_stock() IS
'Trigger gérant automatiquement les stocks prévisionnels et réels lors des changements de statut de commandes fournisseurs.
CORRECTION 2025-10-13: Utilise désormais purchase_order_status enum au lieu de TEXT pour éviter erreurs de coercion.
Workflow: draft → confirmed (stock_forecasted_in++) → received (stock_real++, stock_forecasted_in--)';

-- =============================================
-- LOG MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20251013_001 appliquée avec succès';
    RAISE NOTICE '✅ Fonction handle_purchase_order_stock() corrigée (enum au lieu de TEXT)';
    RAISE NOTICE '✅ Bug COALESCE(OLD.status, '''') résolu avec valeur enum par défaut';
    RAISE NOTICE '📊 Tests SQL maintenant possibles: UPDATE purchase_orders SET status = ''confirmed'' ...';
END $$;

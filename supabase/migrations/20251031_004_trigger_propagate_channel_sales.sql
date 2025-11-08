-- Migration: Propagation channel_id depuis sales_orders vers stock_movements
-- Date: 2025-10-31
-- Objectif: Tracer canal vente sur tous mouvements stock OUT liés ventes clients
-- Modification: Trigger handle_sales_order_stock() - CAS 1, 4, 5

-- ============================================================================
-- FONCTION TRIGGER MODIFIÉE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_sales_order_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_item RECORD;
    v_old_status sales_order_status;
    v_new_status sales_order_status;
    v_qty_diff INTEGER;
    v_stock_before INTEGER;
    v_already_shipped INTEGER;  -- NOUVEAU: Quantité déjà traitée en stock_movements
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_old_status := 'draft'::sales_order_status;
    ELSE
        v_old_status := COALESCE(OLD.status, 'draft'::sales_order_status);
    END IF;

    v_new_status := NEW.status;

    -- ========================================================================
    -- CAS 1: Validation (draft → confirmed)
    -- 🆕 MODIFICATION: Ajout channel_id dans INSERT stock_movements
    -- ========================================================================
    IF v_new_status = 'confirmed' AND v_old_status != 'confirmed' THEN
        FOR v_item IN
            SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
            ) THEN
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity_change,
                    quantity_before, quantity_after, reason_code,
                    reference_type, reference_id, notes,
                    affects_forecast, forecast_type,
                    performed_by, performed_at,
                    channel_id  -- 🆕 AJOUT
                )
                SELECT
                    v_item.product_id, 'OUT', -v_item.quantity,
                    stock_real, stock_real, 'sale',
                    'sales_order', NEW.id,
                    'Commande confirmée - Réservation stock prévisionnel',
                    true, 'out',
                    NEW.confirmed_by, NEW.confirmed_at,
                    NEW.channel_id  -- 🆕 PROPAGATION depuis sales_orders
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- ========================================================================
    -- CAS 2: Dévalidation (confirmed → draft)
    -- ⚠️ PAS DE MODIFICATION: Mouvement IN, pas de channel_id
    -- ========================================================================
    ELSIF v_new_status = 'draft' AND v_old_status = 'confirmed' THEN
        FOR v_item IN
            SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            IF EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
                AND forecast_type = 'out'
            ) THEN
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity_change,
                    quantity_before, quantity_after, reason_code,
                    reference_type, reference_id, notes,
                    affects_forecast, forecast_type,
                    performed_by, performed_at
                    -- ⚠️ PAS de channel_id: mouvement IN libération
                )
                SELECT
                    v_item.product_id, 'IN', v_item.quantity,
                    stock_forecasted_out,
                    stock_forecasted_out + v_item.quantity,
                    'manual_adjustment', 'sales_order', NEW.id,
                    'Dévalidation commande - Libération réservation stock prévisionnel',
                    true, 'out',
                    NEW.confirmed_by, NOW()
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- ========================================================================
    -- CAS 3: Annulation (→ cancelled)
    -- ⚠️ PAS DE MODIFICATION: Mouvement IN, pas de channel_id
    -- ========================================================================
    ELSIF v_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN
        FOR v_item IN
            SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            IF EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = true
                AND forecast_type = 'out'
            ) THEN
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity_change,
                    quantity_before, quantity_after, reason_code,
                    reference_type, reference_id, notes,
                    affects_forecast, forecast_type,
                    performed_by, performed_at
                    -- ⚠️ PAS de channel_id: mouvement IN libération
                )
                SELECT
                    v_item.product_id, 'IN', v_item.quantity,
                    stock_forecasted_out,
                    stock_forecasted_out + v_item.quantity,
                    'cancelled', 'sales_order', NEW.id,
                    'Commande annulée - Libération automatique stock prévisionnel',
                    true, 'out',
                    NEW.cancelled_by, NEW.cancelled_at
                FROM products WHERE id = v_item.product_id;

                RAISE NOTICE 'Stock prévisionnel libéré pour produit % (quantité: %)', v_item.product_id, v_item.quantity;
            ELSE
                RAISE NOTICE 'Commande annulée sans réservation stock (status était: %)', v_old_status;
            END IF;
        END LOOP;

    -- ========================================================================
    -- CAS 4: Sortie entrepôt complète (warehouse_exit_at rempli)
    -- 🆕 MODIFICATION: Ajout channel_id dans INSERT stock_movements
    -- ========================================================================
    ELSIF NEW.warehouse_exit_at IS NOT NULL AND (OLD.warehouse_exit_at IS NULL OR TG_OP = 'INSERT') THEN
        FOR v_item IN
            SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM stock_movements
                WHERE reference_type = 'sales_order'
                AND reference_id = NEW.id
                AND product_id = v_item.product_id
                AND affects_forecast = false
            ) THEN
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity_change,
                    quantity_before, quantity_after, reason_code,
                    reference_type, reference_id, notes,
                    affects_forecast, forecast_type,
                    performed_by, performed_at,
                    channel_id  -- 🆕 AJOUT
                )
                SELECT
                    v_item.product_id, 'OUT', -v_item.quantity,
                    stock_real, stock_real - v_item.quantity,
                    'sale', 'sales_order', NEW.id,
                    'Sortie entrepôt - Décrémentation stock réel',
                    false, NULL,
                    NEW.confirmed_by, NEW.warehouse_exit_at,
                    NEW.channel_id  -- 🆕 PROPAGATION depuis sales_orders
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- ========================================================================
    -- CAS 5: EXPÉDITION PARTIELLE (partially_shipped)
    -- 🆕 MODIFICATION: Ajout channel_id dans INSERT stock_movements (VALUES)
    -- 🔧 FIX: Comparer avec SUM mouvements existants (source vérité)
    -- ========================================================================
    ELSIF v_new_status = 'partially_shipped' OR
          (v_new_status = 'shipped' AND v_old_status = 'partially_shipped') THEN

        -- Parcourir tous les items de la commande
        FOR v_item IN
            SELECT
                soi.id,
                soi.product_id,
                soi.quantity,
                COALESCE(soi.quantity_shipped, 0) as quantity_shipped
            FROM sales_order_items soi
            WHERE soi.sales_order_id = NEW.id
        LOOP
            -- 🔑 CALCUL DIFFÉRENTIEL ROBUSTE:
            -- Comparer quantity_shipped avec SUM des mouvements stock réels déjà créés
            SELECT COALESCE(SUM(ABS(quantity_change)), 0)
            INTO v_already_shipped
            FROM stock_movements
            WHERE reference_type = 'sales_order'
              AND reference_id = NEW.id
              AND product_id = v_item.product_id
              AND affects_forecast = false  -- Mouvement RÉEL (pas prévisionnel)
              AND movement_type = 'OUT';

            -- Différence = ce qui doit être retiré maintenant
            v_qty_diff := v_item.quantity_shipped - v_already_shipped;

            -- Si augmentation de quantité expédiée
            IF v_qty_diff > 0 THEN
                -- Récupérer stock réel avant
                SELECT COALESCE(stock_real, stock_quantity, 0)
                INTO v_stock_before
                FROM products
                WHERE id = v_item.product_id;

                -- Créer mouvement stock réel OUT (sortie physique)
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
                    performed_at,
                    channel_id  -- 🆕 AJOUT
                )
                VALUES (
                    v_item.product_id,
                    'OUT',
                    -v_qty_diff,  -- Quantité différentielle uniquement
                    v_stock_before,
                    v_stock_before - v_qty_diff,
                    'sale',
                    'sales_order',
                    NEW.id,
                    format('Expédition partielle - %s/%s unités expédiées (déjà expédié: %s)',
                           v_item.quantity_shipped, v_item.quantity, v_already_shipped),
                    false,  -- Affecte stock RÉEL (pas prévisionnel)
                    NULL,
                    COALESCE(NEW.shipped_by, NEW.confirmed_by),
                    COALESCE(NEW.shipped_at, NOW()),
                    NEW.channel_id  -- 🆕 PROPAGATION depuis sales_orders
                );

                RAISE NOTICE 'Mouvement stock partiel créé: produit=%, qty_diff=%, stock_avant=%, stock_après=%',
                    v_item.product_id, v_qty_diff, v_stock_before, v_stock_before - v_qty_diff;
            ELSIF v_qty_diff < 0 THEN
                -- Cas anormal: quantity_shipped a diminué (retour partiel?)
                RAISE WARNING 'Diminution quantity_shipped détectée: produit=%, diff=%', v_item.product_id, v_qty_diff;
            END IF;
        END LOOP;

    END IF;

    RETURN NEW;
END;
$function$;

-- ============================================================================
-- VALIDATION POST-MIGRATION
-- ============================================================================

-- Vérifier fonction recréée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'handle_sales_order_stock'
    ) THEN
        RAISE EXCEPTION 'Migration FAILED: Function handle_sales_order_stock not found';
    END IF;

    RAISE NOTICE '✅ Migration 20251031_004 SUCCESS: Trigger handle_sales_order_stock() updated with channel_id propagation';
END $$;

-- ============================================================================
-- COMMENTAIRE FONCTION
-- ============================================================================

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Gère automatiquement les mouvements de stock pour les commandes clients.

**Workflow complet:**

CAS 1: Validation commande (draft → confirmed)
- Crée mouvement OUT prévisionnel (affects_forecast=true)
- 🆕 Propage channel_id depuis sales_orders.channel_id

CAS 2: Dévalidation (confirmed → draft)
- Crée mouvement IN prévisionnel pour libérer réservation
- ⚠️ Pas de channel_id (mouvement IN)

CAS 3: Annulation (→ cancelled)
- Crée mouvement IN prévisionnel pour libérer réservation
- ⚠️ Pas de channel_id (mouvement IN)

CAS 4: Sortie entrepôt complète (warehouse_exit_at)
- Crée mouvement OUT réel (affects_forecast=false)
- Décrémente stock_real
- 🆕 Propage channel_id depuis sales_orders.channel_id

CAS 5: Expédition partielle (partially_shipped)
- Algorithme idempotent: Compare quantity_shipped avec SUM mouvements existants
- Crée mouvement OUT réel différentiel uniquement
- 🆕 Propage channel_id depuis sales_orders.channel_id

**Dernière mise à jour:** 2025-10-31 (Ajout traçabilité canal multi-canal)';

-- ============================================================================
-- TEST RAPIDE (optionnel - commenter en production)
-- ============================================================================

-- Afficher 3 derniers mouvements avec channel_id
SELECT
    sm.id,
    sm.product_id,
    sm.movement_type,
    sm.quantity_change,
    sm.channel_id,
    sc.name as channel_name,
    sm.reference_type,
    sm.notes,
    sm.performed_at
FROM stock_movements sm
LEFT JOIN sales_channels sc ON sm.channel_id = sc.id
WHERE sm.reference_type = 'sales_order'
ORDER BY sm.performed_at DESC
LIMIT 3;

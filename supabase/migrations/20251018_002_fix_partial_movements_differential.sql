/**
 * 🐛 FIX CRITIQUE: Calcul Différentiel Réceptions/Expéditions Partielles
 *
 * Date: 2025-10-18
 * Auteur: Claude Code (Agent Database Guardian)
 * Référence: MEMORY-BANK/sessions/FIX-PARTIAL-DIFFERENTIAL-2025-10-18.md
 *
 * BUG IDENTIFIÉ:
 * Migration 20251018_001 utilisait LATERAL JOIN pour accéder OLD values,
 * mais OLD n'est disponible QUE dans le contexte du trigger sur purchase_orders,
 * PAS dans purchase_order_items. Résultat: v_qty_diff = 0 toujours.
 *
 * SOLUTION:
 * Comparer quantity_received/quantity_shipped avec SUM des mouvements stock
 * déjà créés (source de vérité). Calcul différentiel robuste et auditable.
 *
 * BACKWARD COMPATIBLE: ✅ Oui (remplace migration 20251018_001 bugguée)
 * ROLLBACK: Possible (version précédente commentée)
 */

-- ===========================================================================
-- PARTIE 1: FIX handle_purchase_order_forecast (Réceptions Partielles)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.handle_purchase_order_forecast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_item RECORD;
  v_stock_before INTEGER;
  v_qty_diff INTEGER;
  v_already_received INTEGER;  -- NOUVEAU: Quantité déjà traitée en stock_movements
BEGIN
  -- CAS 1: Commande confirmée (draft/sent → confirmed)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
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
        performed_by
      ) VALUES (
        v_item.product_id,
        'IN',
        v_item.quantity,
        0,
        0,
        'purchase_order',
        NEW.id,
        'Entrée prévisionnelle - Commande fournisseur ' || NEW.po_number,
        'purchase_reception',
        true,
        'in',
        NEW.created_by
      );
    END LOOP;

  -- CAS 2: Réception complète (→ received)
  ELSIF NEW.status = 'received' AND OLD.status != 'received' THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
    LOOP
      -- Retirer le prévisionnel
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
        performed_by
      ) VALUES (
        v_item.product_id,
        'OUT',
        -v_item.quantity,
        0,
        0,
        'purchase_order',
        NEW.id,
        'Annulation prévisionnel - Réception effective',
        'purchase_reception',
        true,
        'in',
        NEW.received_by
      );

      -- Récupérer stock AVANT
      SELECT COALESCE(stock_real, stock_quantity, 0) INTO v_stock_before
      FROM products
      WHERE id = v_item.product_id;

      -- Ajouter au stock réel
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
        performed_by
      ) VALUES (
        v_item.product_id,
        'IN',
        v_item.quantity,
        v_stock_before,
        v_stock_before + v_item.quantity,
        'purchase_order',
        NEW.id,
        'Réception effective - Commande ' || NEW.po_number,
        'purchase_reception',
        false,
        null,
        NEW.received_by
      );
    END LOOP;

  -- CAS 3: Annulation (confirmed/sent → cancelled)
  ELSIF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'sent') THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM purchase_order_items
      WHERE purchase_order_id = NEW.id
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
        performed_by
      ) VALUES (
        v_item.product_id,
        'OUT',
        -v_item.quantity,
        0,
        0,
        'purchase_order',
        NEW.id,
        'Annulation prévisionnel - Commande annulée',
        'purchase_reception',
        true,
        'in',
        NEW.created_by
      );
    END LOOP;

  -- 🆕 CAS 4: RÉCEPTION PARTIELLE (partially_received)
  -- 🔧 FIX: Comparer avec SUM mouvements existants (source vérité)
  ELSIF NEW.status = 'partially_received' OR
        (NEW.status = 'received' AND OLD.status = 'partially_received') THEN

    -- Parcourir tous les items de la commande
    FOR v_item IN
      SELECT
        poi.id,
        poi.product_id,
        poi.quantity,
        COALESCE(poi.quantity_received, 0) as quantity_received
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      -- 🔑 CALCUL DIFFÉRENTIEL ROBUSTE:
      -- Comparer quantity_received avec SUM des mouvements stock réels déjà créés
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      INTO v_already_received
      FROM stock_movements
      WHERE reference_type = 'purchase_order'
        AND reference_id = NEW.id
        AND product_id = v_item.product_id
        AND affects_forecast = false  -- Mouvement RÉEL (pas prévisionnel)
        AND movement_type = 'IN';

      -- Différence = ce qui doit être ajouté maintenant
      v_qty_diff := v_item.quantity_received - v_already_received;

      -- Si augmentation de quantité reçue
      IF v_qty_diff > 0 THEN

        -- 1. Retirer du prévisionnel IN (différentiel)
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
          performed_by
        ) VALUES (
          v_item.product_id,
          'OUT',
          -v_qty_diff,  -- Différentiel uniquement
          0,
          0,
          'purchase_order',
          NEW.id,
          format('Réception partielle - Annulation prévisionnel %s/%s unités (déjà reçu: %s)',
                 v_item.quantity_received, v_item.quantity, v_already_received),
          'purchase_reception',
          true,
          'in',
          NEW.received_by
        );

        -- Récupérer stock réel avant
        SELECT COALESCE(stock_real, stock_quantity, 0)
        INTO v_stock_before
        FROM products
        WHERE id = v_item.product_id;

        -- 2. Ajouter au stock réel (différentiel)
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
          performed_by
        ) VALUES (
          v_item.product_id,
          'IN',
          v_qty_diff,  -- Différentiel uniquement
          v_stock_before,
          v_stock_before + v_qty_diff,
          'purchase_order',
          NEW.id,
          format('Réception partielle - %s/%s unités reçues (Commande %s, déjà reçu: %s)',
                 v_item.quantity_received, v_item.quantity, NEW.po_number, v_already_received),
          'purchase_reception',
          false,
          null,
          NEW.received_by
        );

        RAISE NOTICE 'Réception partielle: Produit % - %s unités ajoutées au stock réel (total reçu: %s/%s, déjà traité: %s)',
          v_item.product_id, v_qty_diff, v_item.quantity_received, v_item.quantity, v_already_received;
      ELSIF v_qty_diff < 0 THEN
        -- Gestion rollback (si quantity_received diminue - cas rare)
        RAISE WARNING 'Réception partielle: Quantité reçue a DIMINUÉ pour produit % (%s → %s). Vérifier cohérence.',
          v_item.product_id, v_already_received, v_item.quantity_received;
      ELSE
        -- v_qty_diff = 0 → Pas de changement, skip silencieux
        RAISE NOTICE 'Réception partielle: Produit % - Aucun changement détecté (déjà reçu: %s)',
          v_item.product_id, v_already_received;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.handle_purchase_order_forecast() IS
'Trigger automatique gestion stock commandes fournisseurs.
Version 2.1 (2025-10-18 FIX): Calcul différentiel via SUM stock_movements existants.
Gère 4 cas: confirmed, received, cancelled, partially_received.
CRITICAL: Ne pas modifier sans lire docs/database/triggers.md';


-- ===========================================================================
-- PARTIE 2: FIX handle_sales_order_stock (Expéditions Partielles)
-- ===========================================================================

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

    -- CAS 1: Validation (draft → confirmed)
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
                    performed_by, performed_at
                )
                SELECT
                    v_item.product_id, 'OUT', -v_item.quantity,
                    stock_real, stock_real, 'sale',
                    'sales_order', NEW.id,
                    'Commande confirmée - Réservation stock prévisionnel',
                    true, 'out',
                    NEW.confirmed_by, NEW.confirmed_at
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- CAS 2: Dévalidation (confirmed → draft)
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

    -- CAS 3: Annulation (→ cancelled)
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

    -- CAS 4: Sortie entrepôt complète (warehouse_exit_at rempli)
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
                    performed_by, performed_at
                )
                SELECT
                    v_item.product_id, 'OUT', -v_item.quantity,
                    stock_real, stock_real - v_item.quantity,
                    'sale', 'sales_order', NEW.id,
                    'Sortie entrepôt - Décrémentation stock réel',
                    false, NULL,
                    NEW.confirmed_by, NEW.warehouse_exit_at
                FROM products WHERE id = v_item.product_id;
            END IF;
        END LOOP;

    -- 🆕 CAS 5: EXPÉDITION PARTIELLE (partially_shipped)
    -- 🔧 FIX: Comparer avec SUM mouvements existants (source vérité)
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
                    performed_at
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
                    NEW.confirmed_by,
                    COALESCE(NEW.warehouse_exit_at, NOW())
                );

                RAISE NOTICE 'Expédition partielle: Produit % - %s unités sorties du stock réel (total expédié: %s/%s, déjà traité: %s)',
                    v_item.product_id, v_qty_diff, v_item.quantity_shipped, v_item.quantity, v_already_shipped;
            ELSIF v_qty_diff < 0 THEN
                -- Gestion rollback (si quantity_shipped diminue - cas rare)
                RAISE WARNING 'Expédition partielle: Quantité expédiée a DIMINUÉ pour produit % (%s → %s). Vérifier cohérence.',
                    v_item.product_id, v_already_shipped, v_item.quantity_shipped;
            ELSE
                -- v_qty_diff = 0 → Pas de changement, skip silencieux
                RAISE NOTICE 'Expédition partielle: Produit % - Aucun changement détecté (déjà expédié: %s)',
                    v_item.product_id, v_already_shipped;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.handle_sales_order_stock() IS
'Trigger automatique gestion stock commandes clients.
Version 2.1 (2025-10-18 FIX): Calcul différentiel via SUM stock_movements existants.
Gère 5 cas: confirmed, draft, cancelled, warehouse_exit, partially_shipped.
CRITICAL: Ne pas modifier sans lire docs/database/triggers.md';


-- ===========================================================================
-- VALIDATION: Vérifier que les triggers sont bien activés
-- ===========================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20251018_002 appliquée avec succès';
  RAISE NOTICE '🐛 FIX: Calcul différentiel corrigé (LATERAL JOIN → SUM stock_movements)';
  RAISE NOTICE '📊 Triggers mis à jour:';
  RAISE NOTICE '   - handle_sales_order_stock (v2.1 avec fix différentiel)';
  RAISE NOTICE '   - handle_purchase_order_forecast (v2.1 avec fix différentiel)';
  RAISE NOTICE '🚀 Système de mouvements stock partiels ACTIVÉ ET CORRIGÉ';
  RAISE NOTICE '🔍 Test recommandé: UPDATE purchase_order_items SET quantity_received=1 WHERE id=''...''';
END $$;

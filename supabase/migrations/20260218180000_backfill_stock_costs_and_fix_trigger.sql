-- =====================================================
-- MIGRATION : Backfill stock costs + fix trigger
-- Date: 2026-02-18
-- Ticket: BO-LM-001
-- =====================================================
-- PROBLÈME : La chaîne prix d'achat a 3 maillons cassés :
--   1. stock_movements.unit_cost toujours NULL (218/218)
--   2. product_purchase_history manquant (49/157 lignes seulement)
--   3. products.cost_price_avg/min/max incomplet (45/127 produits)
--
-- CORRECTIONS :
--   3. Backfill stock_movements (unit_cost + purchase_order_item_id)
--   4a. Backfill product_purchase_history
--   4b. Recalcul PMP products
--   5. Fix trigger update_stock_on_reception() pour futures réceptions
-- =====================================================

BEGIN;

-- =============================================================================
-- CORRECTION 3 : Backfill stock_movements.unit_cost + purchase_order_item_id
-- =============================================================================
-- Jointure : stock_movements.reference_id → purchase_order_receptions.id
--            → purchase_order_items (via purchase_order_id + product_id)

UPDATE stock_movements sm
SET
  unit_cost = poi.unit_price_ht,
  purchase_order_item_id = poi.id
FROM purchase_order_receptions por
JOIN purchase_order_items poi
  ON poi.purchase_order_id = por.purchase_order_id
  AND poi.product_id = por.product_id
WHERE sm.reference_id = por.id
  AND sm.reference_type = 'reception'
  AND sm.movement_type = 'IN'
  AND sm.unit_cost IS NULL;

-- =============================================================================
-- CORRECTION 4a : Backfill product_purchase_history
-- =============================================================================
-- Upsert tous les PO items reçus dans l'historique d'achats

INSERT INTO product_purchase_history
  (product_id, purchase_order_id, purchase_order_item_id, unit_price_ht, quantity, purchased_at)
SELECT
  poi.product_id,
  poi.purchase_order_id,
  poi.id,
  poi.unit_price_ht,
  poi.quantity,
  COALESCE(po.received_at, po.updated_at, NOW())
FROM purchase_order_items poi
JOIN purchase_orders po ON po.id = poi.purchase_order_id
WHERE po.status = 'received'
  AND poi.product_id IS NOT NULL
ON CONFLICT (product_id, purchase_order_item_id) DO UPDATE
SET
  unit_price_ht = EXCLUDED.unit_price_ht,
  quantity = EXCLUDED.quantity,
  purchased_at = EXCLUDED.purchased_at;

-- =============================================================================
-- CORRECTION 4b : Recalcul PMP (Prix Moyen Pondéré) pour tous les produits
-- =============================================================================

UPDATE products p SET
  cost_price_avg = sub.avg_price,
  cost_price_min = sub.min_price,
  cost_price_max = sub.max_price,
  cost_price_last = sub.last_price,
  cost_price_count = sub.cnt,
  cost_price = COALESCE(sub.avg_price, p.cost_price),
  updated_at = NOW()
FROM (
  SELECT
    product_id,
    SUM(unit_price_ht * quantity) / NULLIF(SUM(quantity), 0) AS avg_price,
    MIN(unit_price_ht) AS min_price,
    MAX(unit_price_ht) AS max_price,
    COUNT(*) AS cnt,
    (SELECT unit_price_ht FROM product_purchase_history sub2
     WHERE sub2.product_id = pph.product_id
     ORDER BY purchased_at DESC, created_at DESC LIMIT 1) AS last_price
  FROM product_purchase_history pph
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

-- =============================================================================
-- CORRECTION 5 : Fix trigger update_stock_on_reception()
-- =============================================================================
-- Ajoute unit_cost et purchase_order_item_id dans l'INSERT stock_movements

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
    v_poi_id UUID;
    v_unit_cost NUMERIC;
BEGIN
    -- Récupérer stock AVANT modification
    SELECT stock_real INTO v_stock_before
    FROM products
    WHERE id = NEW.product_id;

    -- Récupérer le prix d'achat depuis purchase_order_items
    SELECT id, unit_price_ht INTO v_poi_id, v_unit_cost
    FROM purchase_order_items
    WHERE purchase_order_id = NEW.purchase_order_id
      AND product_id = NEW.product_id
    LIMIT 1;

    -- Etape 1: Mettre a jour stock produit
    UPDATE products
    SET
        stock_real = stock_real + NEW.quantity_received,
        stock_forecasted_in = stock_forecasted_in - NEW.quantity_received
    WHERE id = NEW.product_id
    RETURNING stock_real INTO v_stock_after;

    -- Creer mouvement stock avec unit_cost et purchase_order_item_id
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
        performed_by,
        unit_cost,
        purchase_order_item_id
    ) VALUES (
        NEW.product_id,
        'IN',
        NEW.quantity_received,
        v_stock_before,
        v_stock_after,
        'reception',
        NEW.id,
        'Reception commande fournisseur PO #' || (SELECT po_number FROM purchase_orders WHERE id = NEW.purchase_order_id),
        'purchase_reception',
        NEW.received_by,
        v_unit_cost,
        v_poi_id
    );

    -- Etape 2: Mettre a jour purchase_order_items
    UPDATE purchase_order_items
    SET quantity_received = quantity_received + NEW.quantity_received
    WHERE purchase_order_id = NEW.purchase_order_id AND product_id = NEW.product_id;

    -- Etape 3: Verifier si PO completement recue
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

COMMENT ON FUNCTION update_stock_on_reception() IS
'Mise a jour du stock lors de reception. Inclut unit_cost et purchase_order_item_id dans les mouvements de stock pour tracabilite complete des prix d''achat.';

COMMIT;

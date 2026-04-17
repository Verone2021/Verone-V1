-- Migration: Backfill quantity_shipped for legacy orders
-- Date: 2026-04-17
-- Task: BO-STOCK-001
--
-- CONTEXTE
-- =========
-- La migration 20260223170045_backfill_shipments_legacy_orders.sql avait
-- desactive volontairement trigger_shipment_update_stock pour inserer des
-- sales_order_shipments sans effet de bord sur stock (commandes deja livrees
-- au client dans le passe, leur stock avait deja ete decremente).
--
-- Consequence : sales_order_items.quantity_shipped est reste a 0 (ou a une
-- valeur partielle) pour ces 22 commandes historiques, bien que
-- sales_orders.status = 'shipped'.
--
-- IMPACT : l'UI affiche "0/N expedies" pour ces commandes legacy.
--
-- FIX : sync quantity_shipped = sum(sales_order_shipments.quantity_shipped)
-- pour ces 22 commandes. Aucun stock touche, aucun movement cree.
--
-- SAFETE :
-- - UPDATE filtre explicitement par order_number (liste fermee)
-- - Idempotent (ri-executer sur donnees deja cohrentes = no-op)
-- - Pas d'impact trigger (seul `recalculate_sales_order_totals_trigger` se
--   declenche sur UPDATE de sales_order_items mais ne touche PAS le stock)

UPDATE sales_order_items soi
SET quantity_shipped = COALESCE(
    (SELECT SUM(quantity_shipped)
     FROM sales_order_shipments
     WHERE sales_order_id = soi.sales_order_id
       AND product_id = soi.product_id),
    0
)
WHERE soi.sales_order_id IN (
    SELECT id FROM sales_orders WHERE order_number IN (
        'F-25-044','F-25-043','F-25-042','F-25-040','F-25-039','F-25-031','F-25-027',
        'F-25-025','F-25-018','F-25-021','F-25-023','F-25-024','F-25-013','F-25-011',
        'F-25-010','F-25-005','F-25-006',
        'LINK-240032','LINK-230027','LINK-230024','LINK-230002','LINK-230004'
    )
);

-- VERIFICATION
DO $$
DECLARE
    v_incoherent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_incoherent_count
    FROM sales_orders so
    WHERE so.order_number IN (
        'F-25-044','F-25-043','F-25-042','F-25-040','F-25-039','F-25-031','F-25-027',
        'F-25-025','F-25-018','F-25-021','F-25-023','F-25-024','F-25-013','F-25-011',
        'F-25-010','F-25-005','F-25-006',
        'LINK-240032','LINK-230027','LINK-230024','LINK-230002','LINK-230004'
    )
    AND COALESCE((SELECT SUM(quantity_shipped) FROM sales_order_items WHERE sales_order_id=so.id), 0) !=
        COALESCE((SELECT SUM(quantity_shipped) FROM sales_order_shipments WHERE sales_order_id=so.id), 0);

    IF v_incoherent_count > 0 THEN
        RAISE EXCEPTION '[BO-STOCK-001] backfill failed : % SO still incoherent', v_incoherent_count;
    END IF;

    RAISE NOTICE '[BO-STOCK-001] legacy backfill OK : 22 SO synchronisees';
END $$;

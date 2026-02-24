-- Backfill expeditions pour commandes legacy (LINK-23, LINK-24, F-25-001 à F-25-048)
-- Ces commandes importées de Bubble ont le statut shipped mais aucun enregistrement
-- dans sales_order_shipments. Cette migration crée des expéditions totales.
--
-- IMPORTANT: Le trigger trigger_shipment_update_stock est désactivé pendant le backfill
-- pour éviter les effets de bord sur le stock (stock_real, stock_movements, quantity_shipped).

BEGIN;

-- 1. Désactiver le trigger pour éviter effets de bord sur stock
ALTER TABLE sales_order_shipments DISABLE TRIGGER trigger_shipment_update_stock;

-- 2. Insérer les expéditions totales
--    - 1 shipment par item de commande
--    - shipped_at = order_date de la commande (vraie date de commande)
--    - shipped_by = UUID admin Romeo
--    - quantity_shipped = quantity totale (expédition complète)
INSERT INTO sales_order_shipments (
  sales_order_id,
  product_id,
  quantity_shipped,
  shipped_at,
  shipped_by,
  notes
)
SELECT
  so.id,
  soi.product_id,
  soi.quantity AS quantity_shipped,
  COALESCE(so.order_date, so.created_at::date) AS shipped_at,
  '100d2439-0f52-46b1-9c30-ad7934b44719'::uuid AS shipped_by,
  'Backfill expedition historique' AS notes
FROM sales_orders so
JOIN sales_order_items soi ON soi.sales_order_id = so.id
WHERE (
  so.order_number LIKE 'LINK-23%'
  OR so.order_number LIKE 'LINK-24%'
  OR (
    so.order_number LIKE 'F-25-%'
    AND CAST(SUBSTRING(so.order_number FROM 'F-25-(\d+)') AS INTEGER) <= 48
  )
)
-- Guard: ne pas créer de doublons si certaines existent déjà
AND NOT EXISTS (
  SELECT 1 FROM sales_order_shipments sos
  WHERE sos.sales_order_id = so.id
    AND sos.product_id = soi.product_id
);

-- 3. Réactiver le trigger
ALTER TABLE sales_order_shipments ENABLE TRIGGER trigger_shipment_update_stock;

-- 4. Mettre à jour shipped_at et delivered_at sur sales_orders (= order_date)
UPDATE sales_orders
SET
  shipped_at = COALESCE(order_date, created_at::date),
  delivered_at = COALESCE(order_date, created_at::date)
WHERE (
  order_number LIKE 'LINK-23%'
  OR order_number LIKE 'LINK-24%'
  OR (
    order_number LIKE 'F-25-%'
    AND CAST(SUBSTRING(order_number FROM 'F-25-(\d+)') AS INTEGER) <= 48
  )
)
AND (shipped_at IS NULL OR delivered_at IS NULL);

COMMIT;

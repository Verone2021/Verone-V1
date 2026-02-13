-- Migration: Fix LINK-230009 commissions
-- Date: 2026-02-13
-- Issue: sales_orders.linkme_selection_id NULL + item orphelin SUS-0006 + commissions non recalculées
-- Expected commission: 160.29€ (was 108.82€, recovered +51.47€)

BEGIN;

-- 0. Corriger sales_orders.linkme_selection_id (récupérer depuis items existants)
-- Problème: linkme_selection_id était NULL alors que les items pointent vers b97bbc0e-1a5e-4bce-b628-b3461bfadbd7
UPDATE sales_orders so
SET linkme_selection_id = (
  SELECT DISTINCT lsi.selection_id
  FROM sales_order_items soi
  JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  WHERE soi.sales_order_id = so.id
  LIMIT 1
)
WHERE so.order_number = 'LINK-230009'
  AND so.linkme_selection_id IS NULL;

-- 1. Créer item orphelin SUS-0006 (Suspension raphia 6, LINK15)
-- Prix Bubble: 192.78€, Margin rate: 15%
-- Base price: 192.78 × 0.85 = 163.86€
INSERT INTO linkme_selection_items (
  selection_id,
  product_id,
  base_price_ht,
  margin_rate
)
SELECT
  so.linkme_selection_id,
  p.id,
  163.86,  -- Prix achat calculé (192.78 × 0.85)
  15.00
FROM sales_orders so
CROSS JOIN products p
WHERE so.order_number = 'LINK-230009'
  AND p.sku = 'SUS-0006'
  AND NOT EXISTS (
    SELECT 1 FROM linkme_selection_items lsi
    WHERE lsi.selection_id = so.linkme_selection_id
      AND lsi.product_id = p.id
  );

-- 2. Lier item orphelin SUS-0006 à sales_order_items
UPDATE sales_order_items soi
SET linkme_selection_item_id = lsi.id
FROM linkme_selection_items lsi, products p, sales_orders so
WHERE p.id = soi.product_id
  AND p.sku = 'SUS-0006'
  AND lsi.product_id = p.id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230009'
  AND lsi.selection_id = so.linkme_selection_id
  AND soi.linkme_selection_item_id IS NULL;

-- 3. Recalculer TOUTES les commissions LINK-230009
-- Formule: (selling_price_ht - base_price_ht) × quantity
UPDATE sales_order_items soi
SET retrocession_amount = ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230009';

COMMIT;

-- Vérification post-migration
-- Total commission doit = 160.29€
SELECT
  so.order_number,
  SUM(soi.retrocession_amount) as commission_totale,
  160.29 as commission_attendue,
  160.29 - SUM(soi.retrocession_amount) as ecart
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.order_number = 'LINK-230009'
GROUP BY so.order_number;
-- Résultat attendu: ecart = 0.00

-- Migration: Fix LINK-230013 commissions
-- Date: 2026-02-13
-- Issue: sales_orders.linkme_selection_id NULL + commissions non recalculées
-- Expected commission: 273.83€ (was 253.47€, recovered +20.36€)

BEGIN;

-- 0. Corriger sales_orders.linkme_selection_id (récupérer depuis items existants)
UPDATE sales_orders so
SET linkme_selection_id = (
  SELECT DISTINCT lsi.selection_id
  FROM sales_order_items soi
  JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  WHERE soi.sales_order_id = so.id
  LIMIT 1
)
WHERE so.order_number = 'LINK-230013'
  AND so.linkme_selection_id IS NULL;

-- 1. Recalculer TOUTES les commissions LINK-230013
-- Formule: (selling_price_ht - base_price_ht) × quantity
UPDATE sales_order_items soi
SET retrocession_amount = ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230013';

COMMIT;

-- Vérification post-migration
-- Total commission doit = 273.83€
SELECT
  so.order_number,
  SUM(soi.retrocession_amount) as commission_totale,
  273.83 as commission_attendue,
  273.83 - SUM(soi.retrocession_amount) as ecart
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.order_number = 'LINK-230013'
GROUP BY so.order_number;
-- Résultat attendu: ecart = 0.00

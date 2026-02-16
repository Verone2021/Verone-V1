-- Migration: Fix LINK-230019 commissions
-- Date: 2026-02-13
-- Issue: sales_orders.linkme_selection_id NULL + prix divergents (DCO-0003, DCO-0004, PRD-0124) + commissions non recalculées
-- Expected commission: 836.97€ (was 782.70€, recovered +54.27€)

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
WHERE so.order_number = 'LINK-230019'
  AND so.linkme_selection_id IS NULL;

-- 1. Corriger DCO-0003 margin_rate (35% → 15% pour cette sélection historique)
-- Prix Bubble: 47.72€, avec margin_rate 15% → base_price = 47.72 × 0.85 = 40.56€
UPDATE linkme_selection_items lsi
SET
  margin_rate = 15.00,
  base_price_ht = 40.56
FROM products p, sales_orders so
WHERE p.id = lsi.product_id
  AND p.sku = 'DCO-0003'
  AND lsi.selection_id = so.linkme_selection_id
  AND so.order_number = 'LINK-230019';

-- 2. Corriger channel_pricing pour DCO-0004 (Rond paille M)
-- Prix Bubble: 52.76€, margin_rate 15% → base_price = 52.76 × 0.85 = 44.85€
UPDATE channel_pricing
SET public_price_ht = 44.85
WHERE product_id = (SELECT id FROM products WHERE sku = 'DCO-0004')
  AND channel_id = (SELECT id FROM sales_channels WHERE name = 'LinkMe');

-- 3. Corriger channel_pricing pour PRD-0124 (Banc artisanal bois)
-- Prix Bubble: 143.13€ (pas 145.13€), margin_rate 15% → base_price = 143.13 × 0.85 = 121.66€
UPDATE channel_pricing
SET public_price_ht = 121.66
WHERE product_id = (SELECT id FROM products WHERE sku = 'PRD-0124')
  AND channel_id = (SELECT id FROM sales_channels WHERE name = 'LinkMe');

-- 4. Recalculer TOUTES les commissions LINK-230019
-- Formule: (selling_price_ht - base_price_ht) × quantity
UPDATE sales_order_items soi
SET retrocession_amount = ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230019';

COMMIT;

-- Vérification post-migration
-- Total commission doit = 836.97€
SELECT
  so.order_number,
  SUM(soi.retrocession_amount) as commission_totale,
  836.97 as commission_attendue,
  836.97 - SUM(soi.retrocession_amount) as ecart
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.order_number = 'LINK-230019'
GROUP BY so.order_number;
-- Résultat attendu: ecart = 0.00

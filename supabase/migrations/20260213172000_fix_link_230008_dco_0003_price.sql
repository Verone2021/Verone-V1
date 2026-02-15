-- Migration: Fix LINK-230008 DCO-0003 margin_rate + commission
-- Date: 2026-02-13
-- Issue: DCO-0003 (Rond paille L) a un margin_rate incorrect pour cette sélection historique
-- Prix Bubble: 69.00€, Marge Bubble: 24.15€ → margin_rate = 35% (pas 15%)
-- Commission attendue: 754.25€ (était 740.45€, +13.80€)

BEGIN;

-- 1. Corriger margin_rate ET base_price_ht pour DCO-0003 dans la sélection LINK-230008 (historique)
-- Note: On ne modifie PAS channel_pricing car c'est une commande historique shipped
-- Margin rate réel: 24.15 / 69.00 = 35% (pas 15%)
-- Base price réel: 69.00 × (1 - 0.35) = 44.85€
-- Cela recalculera automatiquement selling_price_ht = 44.85 / 0.65 = 69.00€ (GENERATED COLUMN)
UPDATE linkme_selection_items lsi
SET
  margin_rate = 35.00,
  base_price_ht = 44.85
FROM products p, sales_orders so
WHERE p.id = lsi.product_id
  AND p.sku = 'DCO-0003'
  AND lsi.selection_id = so.linkme_selection_id
  AND so.order_number = 'LINK-230008';

-- 2. Recalculer commission pour LINK-230008
-- Formule: (selling_price_ht - base_price_ht) × quantity
UPDATE sales_order_items soi
SET retrocession_amount = ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230008';

-- 3. Locker les prix pour protéger la commande shipped
UPDATE sales_order_items soi
SET
  base_price_ht_locked = lsi.base_price_ht,
  selling_price_ht_locked = lsi.selling_price_ht
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230008'
  AND so.status = 'shipped';

COMMIT;

-- Vérification post-migration
-- Commission totale doit = 754.25€
SELECT
  so.order_number,
  SUM(soi.retrocession_amount) as commission_totale,
  754.25 as commission_attendue,
  754.25 - SUM(soi.retrocession_amount) as ecart
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.order_number = 'LINK-230008'
GROUP BY so.order_number;
-- Résultat attendu: ecart = 0.00

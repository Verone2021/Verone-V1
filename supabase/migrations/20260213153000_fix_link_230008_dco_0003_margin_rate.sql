-- Migration: Fix LINK-230008 Commission (DCO-0003 margin_rate correction)
-- Date: 2026-02-13
-- Context: DCO-0003 (Rond paille L) avait margin_rate 15% au lieu de 35%
-- Impact: Commission LINK-230008 était 740.45€ au lieu de 754.25€ (gap -13.80€)

-- CORRECTION 1: Prix d'achat dans channel_pricing
-- De 58.65€ à 44.85€ pour avoir marge 24.15€ avec selling_price 69.00€
UPDATE channel_pricing
SET public_price_ht = 44.85
WHERE product_id = (SELECT id FROM products WHERE sku = 'DCO-0003')
  AND channel_id = (SELECT id FROM sales_channels WHERE name = 'LinkMe');

-- CORRECTION 2: Margin rate dans linkme_selection_items
-- De 15% à 35% pour refléter le vrai taux de marge Bubble
-- Note: selling_price_ht sera recalculé automatiquement (GENERATED COLUMN)
UPDATE linkme_selection_items
SET margin_rate = 35.00
WHERE product_id = (SELECT id FROM products WHERE sku = 'DCO-0003')
  AND selection_id = (SELECT linkme_selection_id FROM sales_orders WHERE order_number = 'LINK-230008');

-- CORRECTION 3: Recalcul retrocession_amount pour LINK-230008
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END
FROM linkme_selection_items lsi
WHERE lsi.id = soi.linkme_selection_item_id
  AND soi.sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'LINK-230008');

-- Vérification: Commission doit = 754.25€
-- SELECT SUM(retrocession_amount) FROM sales_order_items soi
-- JOIN sales_orders so ON so.id = soi.sales_order_id
-- WHERE so.order_number = 'LINK-230008';
-- Résultat attendu: 754.25

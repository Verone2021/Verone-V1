-- Migration: Fix LINK-230024, 230025, 230027, 230028 commissions
-- Date: 2026-02-13
-- Issue: commissions non recalculées (linkme_selection_id NULL corrigé)
-- Recovered: +144.39€ (230024: +18.55€, 230025: +59.97€, 230027: +45.80€, 230028: +20.07€)

BEGIN;

-- Recalculer commissions pour LINK-230024 (7 produits)
-- Commission actuelle: 179.12€ → attendue: 197.67€ (+18.55€)
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  -- Produit affilié (margin_rate = 0) → Taxe 15% sur vente
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  -- Produit Verone (margin_rate > 0) → Marge commerciale
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230024';

-- Recalculer commissions pour LINK-230025 (13 produits)
-- Commission actuelle: 602.34€ → attendue: 662.31€ (+59.97€)
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230025';

-- Recalculer commissions pour LINK-230027 (10 produits)
-- Commission actuelle: 459.36€ → attendue: 505.16€ (+45.80€)
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230027';

-- Recalculer commissions pour LINK-230028 (2 produits)
-- Commission actuelle: 113.30€ → attendue: 133.37€ (+20.07€)
UPDATE sales_order_items soi
SET retrocession_amount = CASE
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND so.order_number = 'LINK-230028';

COMMIT;

-- Vérification post-migration
-- Total commission doit correspondre aux valeurs attendues
SELECT
  so.order_number,
  SUM(soi.retrocession_amount) as commission_totale,
  CASE so.order_number
    WHEN 'LINK-230024' THEN 197.67
    WHEN 'LINK-230025' THEN 662.31
    WHEN 'LINK-230027' THEN 505.16
    WHEN 'LINK-230028' THEN 133.37
  END as commission_attendue,
  CASE so.order_number
    WHEN 'LINK-230024' THEN 197.67
    WHEN 'LINK-230025' THEN 662.31
    WHEN 'LINK-230027' THEN 505.16
    WHEN 'LINK-230028' THEN 133.37
  END - SUM(soi.retrocession_amount) as ecart
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.order_number IN ('LINK-230024', 'LINK-230025', 'LINK-230027', 'LINK-230028')
GROUP BY so.order_number
ORDER BY so.order_number;
-- Résultat attendu : ecart = 0.00 pour toutes les factures

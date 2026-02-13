-- Migration corrective: Revertir selling_locked LINK-240006 PRD-0132
--
-- Erreur migration precedente (20260213210000): selling_locked change de 1681.05 a 500.00
-- Verifie sur facture Bubble: PUHT = 1,681.05€ (prix vente HT reel)
-- Impact: Taxe Verone passee de 252.16€ (correct) a 75.00€ (faux)
--
-- Terminologie:
--   - Taxe Verone = 15% preleve sur produits AFFILIES (Verone encaisse)
--   - Commission affilie = marge retrocedee sur produits CATALOGUE (Verone paie)

BEGIN;

-- STEP 1: Revertir selling_locked a la valeur facture
UPDATE sales_order_items soi
SET selling_price_ht_locked = 1681.05
FROM sales_orders so, products p
WHERE so.id = soi.sales_order_id
  AND p.id = soi.product_id
  AND so.order_number = 'LINK-240006'
  AND p.sku = 'PRD-0132';

-- STEP 2: Recalculer taxe Verone (retrocession) = 15% de 1681.05 = 252.16
UPDATE sales_order_items soi
SET retrocession_amount = ROUND(1681.05 * 0.15, 2) * soi.quantity
FROM sales_orders so, products p
WHERE so.id = soi.sales_order_id
  AND p.id = soi.product_id
  AND so.order_number = 'LINK-240006'
  AND p.sku = 'PRD-0132';

-- STEP 3: Sync linkme_commissions
UPDATE linkme_commissions lc
SET
  affiliate_commission = sub.sum_retro,
  affiliate_commission_ttc = ROUND(sub.sum_retro * 1.2, 2),
  updated_at = NOW()
FROM (
  SELECT so.order_number,
    COALESCE(SUM(soi.retrocession_amount), 0) as sum_retro
  FROM sales_orders so
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  WHERE so.order_number = 'LINK-240006'
  GROUP BY so.order_number
) sub
WHERE lc.order_number = sub.order_number;

COMMIT;

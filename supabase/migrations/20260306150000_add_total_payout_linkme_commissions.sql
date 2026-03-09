-- Migration: Add total_payout_ht / total_payout_ttc to linkme_commissions
-- Purpose: Store the real total an affiliate receives (catalogue commission + affiliate product payout)
-- Context: affiliate_commission only stores catalogue retrocession. Affiliate products payout (CA - 15% LinkMe fee) was missing.

-- 1. Add columns
ALTER TABLE linkme_commissions
  ADD COLUMN total_payout_ht NUMERIC DEFAULT 0,
  ADD COLUMN total_payout_ttc NUMERIC DEFAULT 0;

-- 2. Backfill: For orders WITHOUT affiliate products, total_payout = affiliate_commission
UPDATE linkme_commissions SET
  total_payout_ht = COALESCE(affiliate_commission, 0),
  total_payout_ttc = COALESCE(affiliate_commission_ttc, 0);

-- 3. Backfill: For 5 mixed orders (catalogue + affiliate products), use calculated values
-- These were computed via CTE joining sales_order_items + products to get:
--   catalogue retrocession + (affiliate CA - LinkMe 15% fee)
UPDATE linkme_commissions SET total_payout_ht = 1301.66, total_payout_ttc = 1561.99
WHERE order_number = 'F-25-025';

UPDATE linkme_commissions SET total_payout_ht = 582.87, total_payout_ttc = 699.44
WHERE order_number = 'F-25-048';

UPDATE linkme_commissions SET total_payout_ht = 1055.37, total_payout_ttc = 1266.44
WHERE order_number = 'LINK-240022';

UPDATE linkme_commissions SET total_payout_ht = 2922.20, total_payout_ttc = 3506.64
WHERE order_number = 'LINK-240038';

UPDATE linkme_commissions SET total_payout_ht = 1826.17, total_payout_ttc = 2191.40
WHERE order_number = 'LINK-240046';

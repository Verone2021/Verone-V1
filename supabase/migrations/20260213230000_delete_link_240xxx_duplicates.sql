-- Migration: Delete 5 LINK-240xxx duplicates
-- These LINK orders are exact duplicates of F-25 orders (same TTC to the cent)
-- Verified: 0 bank reconciliations (bank_transactions, financial_payments)
--
-- Duplicates:
-- LINK-240060 = F-25-025 (DRAVIL/Pokawa Odysseum, TTC 6582.04)
-- LINK-240061 = F-25-026 (LERE FOOD/Pokawa La vache noire, TTC 415.92)
-- LINK-240064 = F-25-038 (DRAVIL/Pokawa Odysseum, TTC 630.48)
-- LINK-240070 = F-25-041 (POKAWA CHATEAUDUN, TTC 821.04)
-- LINK-240071 = F-25-040 (MALA/Pokawa Grenoble, TTC 462.30)

BEGIN;

-- STEP 1: Delete commissions for the 5 LINK duplicates
DELETE FROM linkme_commissions
WHERE order_number IN (
  'LINK-240060', 'LINK-240061', 'LINK-240064',
  'LINK-240070', 'LINK-240071'
);

-- STEP 2: Delete order items
DELETE FROM sales_order_items
WHERE sales_order_id IN (
  SELECT id FROM sales_orders
  WHERE order_number IN (
    'LINK-240060', 'LINK-240061', 'LINK-240064',
    'LINK-240070', 'LINK-240071'
  )
);

-- STEP 3: Delete orders
DELETE FROM sales_orders
WHERE order_number IN (
  'LINK-240060', 'LINK-240061', 'LINK-240064',
  'LINK-240070', 'LINK-240071'
);

COMMIT;

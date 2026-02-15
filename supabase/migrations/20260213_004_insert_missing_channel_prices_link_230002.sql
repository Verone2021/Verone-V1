-- ============================================================
-- Migration: Insert missing channel_pricing entries for LINK-230002
-- Date: 2026-02-13
-- Ticket: LM-USERS-001
--
-- Context: 4 products from LINK-230002 have NO entry in channel_pricing
-- for the LinkMe channel. The UPDATE in migration 20260213_003 failed
-- silently (0 rows affected). We need to INSERT the missing entries.
--
-- Products affected:
-- - COU-0007 (Coussin Blanc): base_price 55.00
-- - DCO-0005 (Lots 4 miroirs): base_price 320.10
-- - SUS-0003 (Suspension paille): base_price 83.89
-- - SUS-0007 (Suspension raphia 3): base_price 148.70
-- ============================================================

-- LinkMe channel ID
DO $$
DECLARE
  linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN

  -- COU-0007 (Coussin Blanc): 64.71 × 0.85 = 55.00
  INSERT INTO channel_pricing (channel_id, product_id, public_price_ht)
  VALUES (linkme_channel_id, '48ccd5af-1c09-42ea-8328-2ab9660b45f7', 55.00)
  ON CONFLICT (channel_id, product_id) DO UPDATE
    SET public_price_ht = 55.00;

  -- DCO-0005 (Lots 4 miroirs): 376.59 × 0.85 = 320.10
  INSERT INTO channel_pricing (channel_id, product_id, public_price_ht)
  VALUES (linkme_channel_id, 'c81b12b8-e638-4b45-9482-24d96752d136', 320.10)
  ON CONFLICT (channel_id, product_id) DO UPDATE
    SET public_price_ht = 320.10;

  -- SUS-0003 (Suspension paille): 98.69 × 0.85 = 83.89
  INSERT INTO channel_pricing (channel_id, product_id, public_price_ht)
  VALUES (linkme_channel_id, 'ec12e634-dac1-41b5-b03e-6e1906965d02', 83.89)
  ON CONFLICT (channel_id, product_id) DO UPDATE
    SET public_price_ht = 83.89;

  -- SUS-0007 (Suspension raphia 3): 174.94 × 0.85 = 148.70
  INSERT INTO channel_pricing (channel_id, product_id, public_price_ht)
  VALUES (linkme_channel_id, 'd2e8b1d8-18b8-4438-ad00-d7c78f840a15', 148.70)
  ON CONFLICT (channel_id, product_id) DO UPDATE
    SET public_price_ht = 148.70;

END $$;

-- Recalculate commissions after trigger propagation
UPDATE sales_order_items soi
SET retrocession_amount = ROUND(
  (lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity,
  2
)
FROM linkme_selection_items lsi
WHERE lsi.id = soi.linkme_selection_item_id
  AND soi.sales_order_id IN (
    SELECT id FROM sales_orders WHERE order_number = 'LINK-230002'
  );

-- Fix: 3 catalogue products incorrectly have channel_commission_rate = 10%
-- They should be 0% (catalogue products never carry LinkMe commission).
-- Only user-created products (MEU-0001, POU-0001) keep their 15% rate.

UPDATE channel_pricing
SET channel_commission_rate = 0,
    updated_at = now()
WHERE channel_id = (SELECT id FROM sales_channels WHERE code = 'linkme')
  AND product_id IN (
    SELECT id FROM products WHERE sku IN ('SET-0003', 'SET-0004', 'BAN-0005')
  )
  AND channel_commission_rate = 10;

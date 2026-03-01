-- Fix: channel_pricing.channel_commission_rate must NEVER be NULL.
-- Default = 0 (catalogue products). Only affiliate products have a commission (e.g. 15%).
--
-- Problem:
--   37 rows had channel_commission_rate = NULL
--   4 LinkMe selection products had no channel_pricing row at all
--   This caused the quote dialog to fall back to linkme_affiliates.linkme_commission_rate (5%)

-- Step 1: Set NULL values to 0 on existing rows
UPDATE channel_pricing
SET channel_commission_rate = 0
WHERE channel_commission_rate IS NULL;

-- Step 2: Create missing channel_pricing rows for 4 products in LinkMe selections
INSERT INTO channel_pricing (product_id, channel_id, channel_commission_rate)
SELECT DISTINCT lsi.product_id, '93c68db1-5a30-4168-89ec-6383152be405'::uuid, 0
FROM linkme_selection_items lsi
LEFT JOIN channel_pricing cp
  ON cp.product_id = lsi.product_id
  AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
WHERE cp.id IS NULL
ON CONFLICT DO NOTHING;

-- Step 3: Make column NOT NULL with DEFAULT 0 — never NULL again
ALTER TABLE channel_pricing
  ALTER COLUMN channel_commission_rate SET DEFAULT 0,
  ALTER COLUMN channel_commission_rate SET NOT NULL;

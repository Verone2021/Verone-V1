-- Fix BW Burger orders: correct channel_id and fill missing linkme_selection_id
-- Context: 6 commandes BW Burger (enseigne e93689ea) with data integrity issues
-- - F-25-034, F-25-035: channel_id incorrectly set to 'manuel' instead of 'linkme'
-- - SO-2026-00112..00115: linkme_selection_id is NULL (should reference BW Burger selection)
-- Stock impact: ZERO (no stock_movements created or modified)

BEGIN;

-- 1a. Fix channel: Manuel → LinkMe for 2 historical BW Burger orders
UPDATE sales_orders
SET channel_id = '93c68db1-5a30-4168-89ec-6383152be405'  -- LinkMe channel
WHERE order_number IN ('F-25-034', 'F-25-035')
  AND channel_id = '1c5a0b39-b8b7-4c8b-bffd-fc0482d329c6';  -- Manuel channel

-- 1b. Fix linkme_selection_id NULL → BW Burger selection for 4 recent orders
UPDATE sales_orders
SET linkme_selection_id = '2b073d8c-d0d4-4f7b-a141-83358aecf9c2'  -- Selection BW Burger
WHERE order_number IN ('SO-2026-00112', 'SO-2026-00113', 'SO-2026-00114', 'SO-2026-00115')
  AND linkme_selection_id IS NULL;

COMMIT;

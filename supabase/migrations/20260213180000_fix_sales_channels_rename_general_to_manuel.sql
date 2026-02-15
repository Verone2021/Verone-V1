-- Migration: Rename "Général" sales channel to "Manuel" and assign it to orders with NULL channel_id
-- Context: The "Général" channel should be "Manuel" (manual orders created by back-office staff).
--          18 orders (F-25-xxx, AV-25-xxx) have NULL channel_id and should be assigned to "Manuel".
-- Date: 2026-02-13

BEGIN;

-- 1. Rename the "Général" channel to "Manuel" and update its code
UPDATE sales_channels
SET name = 'Manuel',
    code = 'manuel',
    updated_at = NOW()
WHERE id = '1c5a0b39-b8b7-4c8b-bffd-fc0482d329c6';

-- 2. Assign "Manuel" channel to all orders that currently have no channel
UPDATE sales_orders
SET channel_id = '1c5a0b39-b8b7-4c8b-bffd-fc0482d329c6',
    updated_at = NOW()
WHERE channel_id IS NULL;

COMMIT;

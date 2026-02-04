-- Migration: Add 'closed' status to sales_order_status enum
-- Reason: Allow orders to be marked as closed (all items shipped/delivered)
-- Related: apps/back-office/src/app/api/sales-orders/[id]/close/route.ts

ALTER TYPE sales_order_status ADD VALUE IF NOT EXISTS 'closed' AFTER 'delivered';

COMMENT ON TYPE sales_order_status IS 'Sales order workflow statuses: draft → validated → partially_shipped → shipped → delivered → closed | cancelled';

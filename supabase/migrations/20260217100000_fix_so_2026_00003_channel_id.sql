-- Fix SO-2026-00003: created via back-office CreateLinkMeOrderModal
-- Missing channel_id (should be LINKME channel) and incorrect pending_admin_validation default
-- This order was never approved, so pending_admin_validation should be true

UPDATE sales_orders
SET
  channel_id = '93c68db1-5a30-4168-89ec-6383152be405',
  pending_admin_validation = true,
  updated_at = now()
WHERE order_number = 'SO-2026-00003'
  AND channel_id IS NULL
  AND pending_admin_validation = false;

-- [NO-TASK] Drop legacy mark_payment_received (3 args)
--
-- Bug fix: Two overloaded versions of mark_payment_received coexist:
--   - OLD (3 args): mark_payment_received(uuid, numeric, uuid) → VOID
--     Writes paid_amount directly on sales_orders, NO order_payments row created
--   - NEW (7 args): mark_payment_received(uuid, numeric, uuid, text, text, text, timestamptz) → UUID
--     Inserts into order_payments + calls recalculate_order_paid_amount()
--
-- When called with 2 named args (p_order_id, p_amount), PostgreSQL resolves to the
-- OLD 3-arg function (closer match). This means the "Mark as paid" button creates
-- NO history in order_payments — a silent bug.
--
-- Dropping the old function makes 2-arg calls resolve to the new 7-arg function
-- (all extra params have defaults), fixing the bug.

DROP FUNCTION IF EXISTS mark_payment_received(uuid, numeric, uuid);

-- [DB-PERF-001] Phase 2.3: Add WHEN clauses to notification triggers
-- Problem: 6 triggers fire on EVERY UPDATE, each calling its function unnecessarily
-- Fix: Add WHEN conditions so PostgreSQL skips the function call entirely when irrelevant
-- The functions keep their internal checks as defense-in-depth

-- Drop existing triggers (no WHEN clause)
DROP TRIGGER IF EXISTS trigger_order_cancelled_notification ON sales_orders;
DROP TRIGGER IF EXISTS trigger_order_confirmed_notification ON sales_orders;
DROP TRIGGER IF EXISTS trigger_order_shipped_notification ON sales_orders;
DROP TRIGGER IF EXISTS trigger_payment_received_notification ON sales_orders;
DROP TRIGGER IF EXISTS trigger_so_delayed_notification ON sales_orders;
DROP TRIGGER IF EXISTS trigger_so_partial_shipped_notification ON sales_orders;

-- Recreate with WHEN clauses (function only called when condition matches)

-- Cancelled: only when status changes TO cancelled
CREATE TRIGGER trigger_order_cancelled_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_cancelled();

-- Confirmed: only when status changes from draft to validated
CREATE TRIGGER trigger_order_confirmed_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (NEW.status = 'validated' AND OLD.status = 'draft')
  EXECUTE FUNCTION notify_order_confirmed();

-- Shipped: only when status changes TO shipped
CREATE TRIGGER trigger_order_shipped_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (NEW.status = 'shipped' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_shipped();

-- Payment received: only when payment_status_v2 changes TO paid
CREATE TRIGGER trigger_payment_received_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (NEW.payment_status_v2 = 'paid' AND (OLD.payment_status_v2 IS NULL OR OLD.payment_status_v2 IS DISTINCT FROM NEW.payment_status_v2))
  EXECUTE FUNCTION notify_payment_received();

-- Delayed: only when expected_delivery_date changes and is not null, for active orders
CREATE TRIGGER trigger_so_delayed_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (
    NEW.expected_delivery_date IS NOT NULL
    AND NEW.status NOT IN ('shipped', 'delivered', 'cancelled')
    AND (OLD.expected_delivery_date IS DISTINCT FROM NEW.expected_delivery_date
         OR OLD.status IS DISTINCT FROM NEW.status)
  )
  EXECUTE FUNCTION notify_so_delayed();

-- Partial shipped: only when status changes TO partially_shipped
CREATE TRIGGER trigger_so_partial_shipped_notification
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (NEW.status = 'partially_shipped' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_so_partial_shipped();

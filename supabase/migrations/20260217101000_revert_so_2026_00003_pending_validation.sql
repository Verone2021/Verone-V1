-- Revert: SO-2026-00003 was created from back-office, not LinkMe affiliate flow
-- Back-office orders do NOT go through admin validation workflow
UPDATE sales_orders
SET
  pending_admin_validation = false,
  updated_at = now()
WHERE order_number = 'SO-2026-00003'
  AND pending_admin_validation = true;

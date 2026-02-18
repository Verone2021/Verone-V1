-- Migration: Fix payment_status_v2 historical inconsistencies
-- Context: 44 sales_orders marked "paid" without proof (no bank reconciliation, no manual payment)
-- Root cause: Data migrated/imported before the trigger that manages payment_status_v2 was created
--
-- Step 1: Reset 36 invoices (F-25-xxx) and LinkMe orders (LINK-2x-xxx) to "pending"
-- Step 2: Regularize 8 credit notes (AV-25-xxx) as manual compensation (no bank reconciliation expected)

-- Step 1: Reset invoices and LinkMe orders without payment proof to "pending"
UPDATE sales_orders
SET payment_status_v2 = 'pending'
WHERE payment_status_v2 = 'paid'
  AND id NOT IN (
    SELECT DISTINCT sales_order_id
    FROM transaction_document_links
    WHERE sales_order_id IS NOT NULL
  )
  AND manual_payment_type IS NULL
  AND order_number NOT LIKE 'AV-%';

-- Step 2: Regularize credit notes (avoirs) as manual compensation
UPDATE sales_orders
SET
  manual_payment_type = 'compensation',
  manual_payment_date = NOW(),
  manual_payment_note = 'Avoir - pas de rapprochement bancaire attendu'
WHERE order_number LIKE 'AV-%'
  AND payment_status_v2 = 'paid'
  AND manual_payment_type IS NULL;

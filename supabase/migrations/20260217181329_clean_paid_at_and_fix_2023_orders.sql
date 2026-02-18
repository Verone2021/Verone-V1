-- Migration: Clean paid_at on pending invoices + fix 2023 orders as paid
-- Context: Follow-up to 20260217175556 migration
--
-- Problem 1: 11 invoices (F-25-xxx) have paid_at set but are pending with no proof
-- Problem 2: 10 orders from 2023 (LINK-23xxxx) were reset to pending, but all 2023 orders
--            are considered historically paid (no reconciliation expected)

-- ============================================================
-- Step 1: Clear paid_at on pending invoices without payment proof
-- ============================================================
-- These invoices have no transaction_document_links and no manual_payment_type,
-- so paid_at is a residual artifact from Bubble migration.
UPDATE sales_orders
SET paid_at = NULL
WHERE payment_status_v2 = 'pending'
  AND paid_at IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT sales_order_id
    FROM transaction_document_links
    WHERE sales_order_id IS NOT NULL
  )
  AND manual_payment_type IS NULL;

-- ============================================================
-- Step 2: Mark 2023 orders as paid (historical manual payment)
-- ============================================================
-- All LINK-23xxxx orders are from 2023 and considered paid historically.
-- The trigger on manual_payment_type will auto-set payment_status_v2 = 'paid'.
UPDATE sales_orders
SET
  manual_payment_type = 'verified_bubble',
  manual_payment_date = created_at,
  manual_payment_note = 'Commande 2023 - paiement historique validé'
WHERE order_number LIKE 'LINK-23%'
  AND payment_status_v2 = 'pending'
  AND manual_payment_type IS NULL;

-- LINK-240021 was created in Oct 2023 but numbered in 2024 series
UPDATE sales_orders
SET
  manual_payment_type = 'verified_bubble',
  manual_payment_date = created_at,
  manual_payment_note = 'Commande 2023 - paiement historique validé'
WHERE order_number = 'LINK-240021'
  AND payment_status_v2 = 'pending'
  AND manual_payment_type IS NULL;

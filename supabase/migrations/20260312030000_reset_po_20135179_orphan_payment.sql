-- =====================================================================
-- Reset PO 20135179 (Opjet) — orphan payment data
-- =====================================================================
-- paid_amount = 2613.34 and payment_status_v2 = 'paid' but NO source:
--   - 0 rows in transaction_document_links
--   - 0 rows in order_payments
-- Residue from old mark_payment_received that wrote paid_amount directly.
-- =====================================================================

UPDATE purchase_orders
SET paid_amount = 0,
    payment_status_v2 = 'pending',
    paid_at = NULL,
    updated_at = NOW()
WHERE po_number = '20135179';

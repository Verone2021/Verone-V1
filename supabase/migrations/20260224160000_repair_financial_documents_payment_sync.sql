-- Migration: Repair financial_documents payment sync
-- Context: Some transaction_document_links were created via INSERT (old code) with document_id = NULL.
-- The document_id was resolved later but amount_paid on financial_documents was never recalculated.
-- This migration recalculates amount_paid from actual allocated amounts in transaction_document_links.

-- Step 1: Resolve any remaining NULL document_id where a matching invoice exists
-- (Safety net - currently 0 rows match, but protects against future edge cases)
UPDATE transaction_document_links tdl
SET document_id = fd.id, updated_at = NOW()
FROM financial_documents fd
WHERE tdl.sales_order_id IS NOT NULL
  AND tdl.document_id IS NULL
  AND fd.sales_order_id = tdl.sales_order_id
  AND fd.document_type = 'customer_invoice'
  AND fd.deleted_at IS NULL;

-- Step 2: Recalculate amount_paid and status on all customer invoices
-- based on actual allocated amounts in transaction_document_links
UPDATE financial_documents fd
SET
  amount_paid = COALESCE(link_totals.total_allocated, 0),
  status = CASE
    WHEN COALESCE(link_totals.total_allocated, 0) >= fd.total_ttc THEN 'paid'::document_status
    WHEN COALESCE(link_totals.total_allocated, 0) > 0 THEN 'partially_paid'::document_status
    ELSE fd.status
  END,
  updated_at = NOW()
FROM (
  SELECT tdl.document_id, COALESCE(SUM(tdl.allocated_amount), 0) AS total_allocated
  FROM transaction_document_links tdl
  WHERE tdl.document_id IS NOT NULL
  GROUP BY tdl.document_id
) link_totals
WHERE fd.id = link_totals.document_id
  AND fd.document_type = 'customer_invoice'
  AND fd.deleted_at IS NULL;

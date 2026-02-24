-- Migration: Fix financial_documents customer invoice constraint
--
-- Context: The constraint check_abby_only_customer_invoices required
-- abby_invoice_id IS NOT NULL for customer_invoice type.
-- Abby was the old invoicing system, now replaced by Qonto.
-- This constraint blocked ALL customer_invoice inserts since no Abby ID exists.
--
-- Fix: Replace with a constraint requiring qonto_invoice_id IS NOT NULL
-- for customer_invoice documents.

-- Drop the old Abby-specific constraint
ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS check_abby_only_customer_invoices;

-- Add new constraint: customer_invoice requires qonto_invoice_id
ALTER TABLE financial_documents
  ADD CONSTRAINT check_qonto_required_for_customer_invoices
  CHECK (
    (document_type = 'customer_invoice' AND qonto_invoice_id IS NOT NULL)
    OR document_type <> 'customer_invoice'
  );

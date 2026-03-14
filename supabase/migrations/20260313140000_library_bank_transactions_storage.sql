-- Migration: Add local PDF storage columns to bank_transactions
-- and recreate v_library_documents with 3 sources including bank_transactions
-- Also fix existing routes to use 'justificatifs' bucket (the actual bucket name)

-- Step 1: Add storage columns to bank_transactions
ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS local_pdf_path text,
  ADD COLUMN IF NOT EXISTS pdf_stored_at timestamptz;

COMMENT ON COLUMN bank_transactions.local_pdf_path IS 'Path in Supabase Storage (justificatifs bucket) for permanently stored PDF';
COMMENT ON COLUMN bank_transactions.pdf_stored_at IS 'Timestamp when PDF was stored locally';

-- Step 2: Recreate v_library_documents with 3 sources (no PDF filter)
DROP VIEW IF EXISTS public.v_library_documents;

CREATE OR REPLACE VIEW public.v_library_documents AS

-- Source 1: financial_documents (supplier invoices from Qonto)
SELECT
  fd.id,
  'financial_documents'::text AS source_table,
  fd.document_type::text AS document_type,
  fd.document_direction::text AS document_direction,
  fd.document_number,
  fd.document_date::date AS document_date,
  COALESCE(o.trade_name, o.legal_name) AS partner_name,
  fd.total_ht::numeric,
  fd.total_ttc::numeric,
  fd.status::text,
  COALESCE(fd.local_pdf_path, fd.qonto_pdf_url, fd.uploaded_file_url) AS pdf_url,
  fd.pcg_code::text,
  fd.created_at
FROM public.financial_documents fd
LEFT JOIN public.organisations o ON o.id = fd.partner_id
WHERE fd.deleted_at IS NULL

UNION ALL

-- Source 2: invoices (sales invoices from Abby)
SELECT
  i.id,
  'invoices'::text AS source_table,
  'customer_invoice'::text AS document_type,
  'outbound'::text AS document_direction,
  i.abby_invoice_number AS document_number,
  i.invoice_date AS document_date,
  COALESCE(o.trade_name, o.legal_name) AS partner_name,
  i.total_ht,
  i.total_ttc,
  i.status::text,
  i.abby_pdf_url AS pdf_url,
  NULL::text AS pcg_code,
  i.created_at
FROM public.invoices i
LEFT JOIN public.sales_orders so ON so.id = i.sales_order_id
LEFT JOIN public.organisations o ON o.id = so.customer_id

UNION ALL

-- Source 3: bank_transactions with attachments (Qonto receipts)
SELECT
  bt.id,
  'bank_transactions'::text AS source_table,
  CASE WHEN bt.side = 'debit' THEN 'supplier_invoice' ELSE 'customer_invoice' END::text AS document_type,
  CASE WHEN bt.side = 'debit' THEN 'inbound' ELSE 'outbound' END::text AS document_direction,
  bt.reference AS document_number,
  (bt.settled_at AT TIME ZONE 'Europe/Paris')::date AS document_date,
  bt.counterparty_name AS partner_name,
  bt.amount_ht AS total_ht,
  bt.amount AS total_ttc,
  CASE
    WHEN bt.local_pdf_path IS NOT NULL THEN 'stored'
    WHEN bt.has_attachment THEN 'available'
    ELSE 'pending'
  END::text AS status,
  COALESCE(bt.local_pdf_path, bt.attachment_ids[1]::text) AS pdf_url,
  bt.category_pcg::text AS pcg_code,
  bt.created_at
FROM public.bank_transactions bt
WHERE bt.has_attachment = true
  AND bt.attachment_ids IS NOT NULL
  AND array_length(bt.attachment_ids, 1) > 0;

-- Grant access
GRANT SELECT ON public.v_library_documents TO authenticated;

COMMENT ON VIEW public.v_library_documents IS 'Unified view for Bibliotheque Comptable — financial_documents + invoices + bank_transactions with attachments. No PDF filter (shows all documents).';

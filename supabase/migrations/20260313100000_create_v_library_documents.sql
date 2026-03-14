-- Migration: Create unified view v_library_documents
-- Combines financial_documents, invoices, and bank_transactions
-- for the Bibliotheque Comptable page
-- ONLY includes documents that have a consultable PDF

DROP VIEW IF EXISTS public.v_library_documents;

CREATE OR REPLACE VIEW public.v_library_documents AS

-- Source 1: financial_documents — only those with a PDF
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
  NULL::text[] AS attachment_ids,
  fd.created_at
FROM public.financial_documents fd
LEFT JOIN public.organisations o ON o.id = fd.partner_id
WHERE fd.deleted_at IS NULL
  AND (fd.local_pdf_path IS NOT NULL OR fd.qonto_pdf_url IS NOT NULL OR fd.uploaded_file_url IS NOT NULL)

UNION ALL

-- Source 2: invoices — only those with an Abby PDF
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
  NULL::text[] AS attachment_ids,
  i.created_at
FROM public.invoices i
LEFT JOIN public.sales_orders so ON so.id = i.sales_order_id
LEFT JOIN public.organisations o ON o.id = so.customer_id
WHERE i.abby_pdf_url IS NOT NULL

UNION ALL

-- Source 3: bank_transactions — only those with attachments (Qonto PDFs)
SELECT
  bt.id,
  'bank_transactions'::text AS source_table,
  'bank_transaction'::text AS document_type,
  CASE bt.side
    WHEN 'credit' THEN 'inbound'
    WHEN 'debit' THEN 'outbound'
    ELSE 'unknown'
  END AS document_direction,
  bt.reference AS document_number,
  (bt.settled_at AT TIME ZONE 'Europe/Paris')::date AS document_date,
  bt.counterparty_name AS partner_name,
  bt.amount_ht AS total_ht,
  bt.amount AS total_ttc,
  bt.matching_status::text AS status,
  NULL::text AS pdf_url,
  bt.category_pcg::text AS pcg_code,
  bt.attachment_ids,
  bt.created_at
FROM public.bank_transactions bt
WHERE bt.has_attachment = true;

-- Grant access (view inherits RLS from underlying tables)
GRANT SELECT ON public.v_library_documents TO authenticated;

COMMENT ON VIEW public.v_library_documents IS 'Unified view for Bibliotheque Comptable — only documents with consultable PDF (attachments, Qonto PDF, Abby PDF)';

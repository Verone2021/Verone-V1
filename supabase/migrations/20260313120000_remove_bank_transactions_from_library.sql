-- Migration: Remove bank_transactions from v_library_documents
-- Reason: Library should only show real accounting documents (invoices, credit notes)
-- NOT bank transaction lines (refunds, fees, etc.)

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
  i.created_at
FROM public.invoices i
LEFT JOIN public.sales_orders so ON so.id = i.sales_order_id
LEFT JOIN public.organisations o ON o.id = so.customer_id
WHERE i.abby_pdf_url IS NOT NULL;

-- Grant access (view inherits RLS from underlying tables)
GRANT SELECT ON public.v_library_documents TO authenticated;

COMMENT ON VIEW public.v_library_documents IS 'Unified view for Bibliotheque Comptable — only accounting documents with PDF (financial_documents + invoices). No bank transactions.';

-- Fix v_library_documents: derive document_direction from document_type
-- (DB column document_direction is wrong — all 'inbound' even for customer_invoice)
-- Also fix bank_transactions partner_name via JOIN organisations

DROP VIEW IF EXISTS public.v_library_documents;

CREATE OR REPLACE VIEW public.v_library_documents AS

-- Source 1: financial_documents (Qonto)
SELECT
  fd.id,
  'financial_documents'::text AS source_table,
  fd.document_type::text AS document_type,
  -- Derive direction from document_type (DB column is unreliable)
  CASE
    WHEN fd.document_type IN ('supplier_invoice', 'supplier_credit_note') THEN 'inbound'
    WHEN fd.document_type IN ('customer_invoice', 'customer_credit_note') THEN 'outbound'
    ELSE fd.document_direction::text
  END AS document_direction,
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
  AND fd.document_type != 'customer_quote'
  AND fd.status != 'draft'

UNION ALL

-- Source 2: invoices (Abby sales invoices)
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
  'supplier_invoice'::text AS document_type,
  'inbound'::text AS document_direction,
  bt.reference AS document_number,
  (bt.settled_at AT TIME ZONE 'Europe/Paris')::date AS document_date,
  COALESCE(org.trade_name, org.legal_name, bt.counterparty_name, bt.label, 'Sans partenaire') AS partner_name,
  COALESCE(bt.amount_ht, bt.amount) AS total_ht,
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
LEFT JOIN public.organisations org ON org.id = bt.counterparty_organisation_id
WHERE bt.has_attachment = true
  AND bt.attachment_ids IS NOT NULL
  AND array_length(bt.attachment_ids, 1) > 0
  -- Only debits (money out = purchases/fees, not client payments received)
  AND bt.side = 'debit'
  -- Exclude internal transfers (reimbursements to Romeo) but keep supplier payments
  AND NOT (bt.operation_type = 'transfer' AND bt.counterparty_organisation_id IS NULL);

-- Grant access
GRANT SELECT ON public.v_library_documents TO authenticated;

COMMENT ON VIEW public.v_library_documents IS 'Unified view for Bibliotheque Comptable — financial_documents (excluding quotes and drafts/proformas) + invoices + bank_transactions. Direction derived from document_type, partner names from organisations JOIN.';

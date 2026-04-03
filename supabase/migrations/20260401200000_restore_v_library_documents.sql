-- Restore v_library_documents view + create v_library_missing_documents
-- v_library_documents was dropped by CASCADE when 20260321190000 removed the 'invoices' table.
-- Now includes: financial_documents + bank_transactions debit (purchases) + bank_transactions credit (sales).

DROP VIEW IF EXISTS public.v_library_documents;

CREATE OR REPLACE VIEW public.v_library_documents AS

-- Source 1: financial_documents (Qonto invoices from 2026+)
SELECT
  fd.id,
  'financial_documents'::text AS source_table,
  fd.document_type::text AS document_type,
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

-- Source 2: bank_transactions DEBIT with attachments (purchase receipts)
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
  AND bt.side = 'debit'
  AND NOT (bt.operation_type = 'transfer' AND bt.counterparty_organisation_id IS NULL)

UNION ALL

-- Source 3: bank_transactions CREDIT (sales receipts — Abby invoices 2024/2025 + all credit transactions)
SELECT
  bt.id,
  'bank_transactions'::text AS source_table,
  'customer_invoice'::text AS document_type,
  'outbound'::text AS document_direction,
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
WHERE bt.side = 'credit'
  AND NOT (bt.operation_type = 'transfer' AND bt.counterparty_organisation_id IS NULL);

GRANT SELECT ON public.v_library_documents TO authenticated;

COMMENT ON VIEW public.v_library_documents IS 'Unified view for Bibliotheque Comptable — financial_documents + bank_transactions debit (purchases) + bank_transactions credit (sales). Direction derived from document_type/side.';

-- ============================================================
-- Missing documents view (transactions without attachments)
-- ============================================================

DROP VIEW IF EXISTS public.v_library_missing_documents;

CREATE OR REPLACE VIEW public.v_library_missing_documents AS
SELECT
  bt.id,
  'bank_transactions'::text AS source_table,
  CASE WHEN bt.side = 'debit' THEN 'supplier_invoice' ELSE 'customer_invoice' END::text AS document_type,
  CASE WHEN bt.side = 'debit' THEN 'inbound' ELSE 'outbound' END::text AS document_direction,
  bt.reference AS document_number,
  (bt.settled_at AT TIME ZONE 'Europe/Paris')::date AS document_date,
  COALESCE(org.trade_name, org.legal_name, bt.counterparty_name, bt.label, 'Sans partenaire') AS partner_name,
  COALESCE(bt.amount_ht, bt.amount) AS total_ht,
  bt.amount AS total_ttc,
  'missing'::text AS status,
  bt.category_pcg::text AS pcg_code,
  bt.created_at
FROM public.bank_transactions bt
LEFT JOIN public.organisations org ON org.id = bt.counterparty_organisation_id
WHERE (bt.has_attachment = false OR bt.has_attachment IS NULL)
  AND NOT (bt.operation_type = 'transfer' AND bt.counterparty_organisation_id IS NULL);

GRANT SELECT ON public.v_library_missing_documents TO authenticated;

COMMENT ON VIEW public.v_library_missing_documents IS 'Bank transactions without attachments — used to show missing receipts in Bibliotheque Comptable.';

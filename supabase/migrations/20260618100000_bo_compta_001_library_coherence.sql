-- [BO-COMPTA-001] Cohérence Bibliothèque comptable
--
-- Corrige deux incohérences de v_library_documents / v_library_missing_documents :
--   1. Source 3 (bank_transactions CREDIT = ventes) n'imposait PAS le filtre
--      has_attachment, contrairement à la Source 2 (DEBIT = achats). Résultat :
--      une vente SANS pièce apparaissait en carte "sans aperçu" alors qu'un achat
--      sans pièce était masqué. On homogénéise : les deux côtés ne listent que les
--      mouvements AVEC pièce ; les mouvements sans pièce vivent dans la vue
--      "missing" (achats ET ventes, traités à l'identique).
--   2. v_library_missing_documents ne tenait pas compte de ignored_at ni de
--      justification_optional : un mouvement ignoré (frais bancaire, virement) ou
--      dont le justificatif est explicitement optionnel ne doit pas compter comme
--      "pièce manquante".
--
-- Note: l'exclusion NOT (operation_type='transfer' AND counterparty_organisation_id IS NULL)
-- retire les virements internes (Roméo -> Roméo) qui n'ont pas de justificatif métier.

DROP VIEW IF EXISTS public.v_library_documents;

CREATE OR REPLACE VIEW public.v_library_documents AS

-- Source 1: financial_documents (factures/avoirs Qonto 2026+)
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

-- Source 2: bank_transactions DEBIT avec pièce (justificatifs d'achat)
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
  -- exclut les virements internes sans contrepartie (pas de justificatif métier)
  AND NOT (bt.operation_type = 'transfer' AND bt.counterparty_organisation_id IS NULL)

UNION ALL

-- Source 3: bank_transactions CREDIT avec pièce (justificatifs de vente)
-- FIX cohérence: on impose désormais has_attachment (comme la Source 2 achats)
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
WHERE bt.has_attachment = true
  AND bt.attachment_ids IS NOT NULL
  AND array_length(bt.attachment_ids, 1) > 0
  AND bt.side = 'credit'
  AND NOT (bt.operation_type = 'transfer' AND bt.counterparty_organisation_id IS NULL);

GRANT SELECT ON public.v_library_documents TO authenticated;

COMMENT ON VIEW public.v_library_documents IS 'Bibliotheque comptable — financial_documents + bank_transactions debit/credit AVEC piece (achats et ventes traites a l identique). Les mouvements sans piece sont dans v_library_missing_documents.';

-- ============================================================
-- Missing documents view (transactions sans piece)
-- FIX: exclut les mouvements ignores et a justificatif optionnel
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
  AND bt.ignored_at IS NULL
  AND COALESCE(bt.justification_optional, false) = false
  -- exclut les virements internes sans contrepartie
  AND NOT (bt.operation_type = 'transfer' AND bt.counterparty_organisation_id IS NULL);

GRANT SELECT ON public.v_library_missing_documents TO authenticated;

COMMENT ON VIEW public.v_library_missing_documents IS 'Mouvements bancaires sans piece (achats et ventes), hors ignores et hors justificatif optionnel — pieces manquantes de la Bibliotheque comptable.';

-- Add bank_provider to v_transactions_unified view
-- Allows the rapprochement UI to show the source of each transaction (Qonto vs manual)
CREATE OR REPLACE VIEW v_transactions_unified AS
SELECT
    bt.id,
    bt.transaction_id,
    bt.emitted_at,
    bt.settled_at,
    bt.label,
    bt.amount,
    bt.side,
    bt.operation_type,
    bt.counterparty_name,
    bt.counterparty_iban,
    bt.reference,
    bt.category_pcg,
    bt.counterparty_organisation_id,
    o.legal_name AS organisation_name,
    bt.has_attachment,
    COALESCE(array_length(bt.attachment_ids, 1), 0) AS attachment_count,
    bt.attachment_ids,
    bt.justification_optional,
    bt.matching_status,
    bt.matched_document_id,
    fd.document_number AS matched_document_number,
    fd.document_type AS matched_document_type,
    bt.confidence_score,
    bt.match_reason,
    bt.applied_rule_id,
    mr.match_value AS rule_match_value,
    mr.display_label AS rule_display_label,
    mr.allow_multiple_categories AS rule_allow_multiple_categories,
    CASE
        WHEN bt.category_pcg::text = '455'::text THEN 'cca'::text
        WHEN bt.matching_status = 'ignored'::matching_status THEN 'ignored'::text
        WHEN bt.matched_document_id IS NOT NULL THEN 'matched'::text
        WHEN bt.matching_status = 'partial_matched'::matching_status THEN 'partial'::text
        WHEN (bt.category_pcg IS NOT NULL OR bt.counterparty_organisation_id IS NOT NULL)
             AND (bt.has_attachment = true OR bt.justification_optional = true)
        THEN 'classified'::text
        ELSE 'to_process'::text
    END AS unified_status,
    bt.vat_rate,
    bt.amount_ht,
    bt.amount_vat,
    bt.vat_breakdown,
    bt.vat_source,
    bt.payment_method,
    bt.nature,
    bt.note,
    EXTRACT(year FROM COALESCE(bt.settled_at, bt.emitted_at))::integer AS year,
    EXTRACT(month FROM COALESCE(bt.settled_at, bt.emitted_at))::integer AS month,
    bt.raw_data,
    bt.created_at,
    bt.updated_at,
    bt.bank_provider
FROM bank_transactions bt
LEFT JOIN organisations o ON bt.counterparty_organisation_id = o.id
LEFT JOIN financial_documents fd ON bt.matched_document_id = fd.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id
ORDER BY COALESCE(bt.settled_at, bt.emitted_at) DESC;

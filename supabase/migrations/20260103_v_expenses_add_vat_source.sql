-- =====================================================
-- MIGRATION: Ajouter vat_source à v_expenses_with_details
-- Date: 2026-01-03
-- Description: Permet d'afficher si la TVA vient de Qonto OCR ou est manuelle
-- =====================================================

DROP VIEW IF EXISTS v_expenses_with_details CASCADE;

CREATE VIEW v_expenses_with_details AS
SELECT
  bt.id,
  bt.id AS transaction_id,
  NULL::UUID AS counterparty_id,
  bt.counterparty_organisation_id AS organisation_id,
  bt.category_pcg AS category,
  CASE
    WHEN bt.category_pcg IS NOT NULL AND bt.category_pcg <> '' THEN 'classified'
    WHEN bt.matching_status = 'ignored'::matching_status THEN 'ignored'
    ELSE 'unclassified'
  END AS status,
  NULL::TEXT AS role_type,
  NULL::TEXT AS notes,
  CASE
    WHEN bt.category_pcg IS NOT NULL AND bt.category_pcg <> '' THEN bt.updated_at
    ELSE NULL
  END AS classified_at,
  NULL::UUID AS classified_by,
  bt.created_at,
  bt.updated_at,
  bt.amount,
  bt.currency,
  bt.label,
  bt.counterparty_name AS transaction_counterparty_name,
  bt.counterparty_iban AS transaction_iban,
  bt.side,
  bt.emitted_at,
  bt.settled_at,
  bt.category_pcg,
  bt.applied_rule_id,
  bt.raw_data,
  -- TVA fields
  bt.vat_rate,
  bt.vat_breakdown,
  bt.amount_ht,
  bt.amount_vat,
  bt.vat_source,  -- NEW: Source de la TVA (qonto_ocr, manual, null)
  -- Autres
  NULL::TEXT AS counterparty_display_name,
  NULL::TEXT AS counterparty_name_normalized,
  org.legal_name AS organisation_name,
  org.type AS organisation_type,
  (bt.raw_data->'attachments') IS NOT NULL
    AND jsonb_array_length(COALESCE(bt.raw_data->'attachments', '[]'::jsonb)) > 0 AS has_attachment,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label,
  mr.allow_multiple_categories AS rule_allow_multiple_categories
FROM bank_transactions bt
LEFT JOIN organisations org ON bt.counterparty_organisation_id = org.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id;

GRANT SELECT ON v_expenses_with_details TO authenticated;

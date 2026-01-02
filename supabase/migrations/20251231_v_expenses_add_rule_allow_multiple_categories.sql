-- =====================================================
-- MIGRATION: Ajouter rule_allow_multiple_categories à v_expenses_with_details
-- Date: 2025-12-31
-- Description: Expose le flag allow_multiple_categories de la règle
--              pour permettre l'UI de savoir si on peut modifier individuellement
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
  NULL::TEXT AS counterparty_display_name,
  NULL::TEXT AS counterparty_name_normalized,
  org.legal_name AS organisation_name,
  org.type AS organisation_type,
  jsonb_array_length(COALESCE(bt.raw_data->'attachment_ids', '[]'::jsonb)) > 0 AS has_attachment,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label,
  mr.allow_multiple_categories AS rule_allow_multiple_categories  -- ← NOUVEAU
FROM bank_transactions bt
LEFT JOIN organisations org ON bt.counterparty_organisation_id = org.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id
WHERE bt.side = 'debit';

-- Grant
GRANT SELECT ON v_expenses_with_details TO authenticated;

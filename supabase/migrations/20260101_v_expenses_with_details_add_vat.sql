-- =====================================================
-- MIGRATION: Ajouter colonnes TVA à v_expenses_with_details
-- Date: 2026-01-01
-- Description: Expose vat_rate, amount_ht, amount_vat, vat_breakdown
--              pour l'affichage de la ventilation TVA multi-taux
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
  bt.matching_status,
  bt.raw_data,
  NULL::TEXT AS counterparty_display_name,
  NULL::TEXT AS counterparty_name_normalized,
  org.legal_name AS organisation_name,
  org.type AS organisation_type,
  jsonb_array_length(COALESCE(bt.raw_data->'attachment_ids', '[]'::jsonb)) > 0 AS has_attachment,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label,
  mr.allow_multiple_categories AS rule_allow_multiple_categories,
  -- Colonnes TVA ajoutées
  bt.vat_rate,
  bt.amount_ht,
  bt.amount_vat,
  bt.vat_breakdown
FROM bank_transactions bt
LEFT JOIN organisations org ON bt.counterparty_organisation_id = org.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id
WHERE bt.side = 'debit';

-- Grant
GRANT SELECT ON v_expenses_with_details TO authenticated;

-- Commentaire
COMMENT ON VIEW v_expenses_with_details IS
'Vue enrichie des dépenses (bank_transactions WHERE side=debit) avec:
- Organisation liée (fournisseur)
- Règle de matching appliquée
- Colonnes TVA: vat_rate, amount_ht, amount_vat, vat_breakdown
Pour la TVA multi-taux, vat_breakdown contient un array JSONB des lignes.';

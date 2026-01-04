-- =====================================================
-- MIGRATION: v_expenses_with_details inclut TOUTES les transactions
-- Date: 2026-01-03
-- Description: La page "Catégorisation" doit afficher dépenses ET revenus.
--              On retire le filtre WHERE side = 'debit'.
--
-- AVANT: v_expenses_with_details = bank_transactions WHERE side='debit'
-- APRÈS: v_expenses_with_details = bank_transactions (toutes)
-- =====================================================

-- Drop et recréer la vue pour inclure debit ET credit
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
  bt.vat_rate,
  bt.vat_breakdown,
  bt.amount_ht,
  bt.amount_vat,
  NULL::TEXT AS counterparty_display_name,
  NULL::TEXT AS counterparty_name_normalized,
  org.legal_name AS organisation_name,
  org.type AS organisation_type,
  (bt.raw_data->'attachments') IS NOT NULL
    AND jsonb_array_length(COALESCE(bt.raw_data->'attachments', '[]'::jsonb)) > 0 AS has_attachment,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label
FROM bank_transactions bt
LEFT JOIN organisations org ON bt.counterparty_organisation_id = org.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id;
-- NOTE: Pas de WHERE side = 'debit' - on inclut TOUTES les transactions

-- Grants
GRANT SELECT ON v_expenses_with_details TO authenticated;

-- =====================================================
-- VALIDATION
-- =====================================================

DO $$
DECLARE
  v_bank_tx_count INTEGER;
  v_view_count INTEGER;
  v_credit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bank_tx_count FROM bank_transactions;
  SELECT COUNT(*) INTO v_view_count FROM v_expenses_with_details;
  SELECT COUNT(*) INTO v_credit_count FROM bank_transactions WHERE side = 'credit';

  IF v_bank_tx_count != v_view_count THEN
    RAISE EXCEPTION 'INCOHÉRENCE: bank_transactions (%) != v_expenses_with_details (%)',
      v_bank_tx_count, v_view_count;
  END IF;

  RAISE NOTICE 'Migration OK: % transactions totales (dont % entrées credit)',
    v_view_count, v_credit_count;
END $$;

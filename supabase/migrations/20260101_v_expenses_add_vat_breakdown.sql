-- Migration: Ajouter vat_breakdown à la vue expenses
-- Date: 2026-01-01
-- Description: Inclure la ventilation TVA multi-taux dans la vue expenses

CREATE OR REPLACE VIEW expenses AS
SELECT
  id,
  id AS transaction_id,
  NULL::uuid AS counterparty_id,
  counterparty_organisation_id AS organisation_id,
  category_pcg AS category,
  CASE
    WHEN category_pcg IS NOT NULL AND category_pcg::text <> ''::text THEN 'classified'::text
    WHEN matching_status = 'ignored'::matching_status THEN 'ignored'::text
    ELSE 'unclassified'::text
  END AS status,
  NULL::text AS role_type,
  NULL::text AS notes,
  CASE
    WHEN category_pcg IS NOT NULL AND category_pcg::text <> ''::text THEN updated_at
    ELSE NULL::timestamp with time zone
  END AS classified_at,
  NULL::uuid AS classified_by,
  created_at,
  updated_at,
  amount,
  currency,
  label,
  counterparty_name,
  counterparty_iban,
  side,
  emitted_at,
  settled_at,
  category_pcg,
  applied_rule_id,
  matching_status,
  raw_data,
  -- Colonnes TVA ajoutées
  vat_rate,
  amount_ht,
  amount_vat,
  vat_breakdown
FROM bank_transactions bt
WHERE side = 'debit'::transaction_side;

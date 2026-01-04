-- =====================================================
-- MIGRATION: expenses TABLE → VIEW (Source de vérité unique)
-- Date: 2025-12-31
-- Description: Refactoring comptabilité - bank_transactions devient
--              la source de vérité UNIQUE. expenses devient une VIEW.
--
-- AVANT: expenses = TABLE avec sync bidirectionnel
-- APRÈS: expenses = VIEW (SELECT FROM bank_transactions WHERE side='debit')
-- =====================================================

-- =====================================================
-- PHASE 1: DROP TRIGGERS de sync bidirectionnel
-- Ces triggers maintenaient la synchronisation entre expenses
-- et bank_transactions. Plus nécessaires car expenses devient VIEW.
-- =====================================================

DROP TRIGGER IF EXISTS trg_sync_bank_transaction_to_expense ON bank_transactions;
DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS trg_sync_expense_organisation ON expenses;
DROP TRIGGER IF EXISTS trg_sync_expense_organisation_insert ON expenses;
DROP TRIGGER IF EXISTS trg_auto_classify_expense ON expenses;

-- =====================================================
-- PHASE 2: DROP FUNCTIONS devenues inutiles
-- =====================================================

DROP FUNCTION IF EXISTS sync_bank_transaction_to_expense() CASCADE;
DROP FUNCTION IF EXISTS sync_expense_organisation_to_transaction() CASCADE;
DROP FUNCTION IF EXISTS create_expenses_from_debits() CASCADE;
DROP FUNCTION IF EXISTS match_expenses_by_iban() CASCADE;
DROP FUNCTION IF EXISTS update_expenses_updated_at() CASCADE;

-- =====================================================
-- PHASE 3: DROP VIEWS dépendantes
-- =====================================================

DROP VIEW IF EXISTS v_expenses_with_details CASCADE;

-- =====================================================
-- PHASE 4: RENOMMER table expenses → expenses_backup
-- =====================================================

ALTER TABLE expenses RENAME TO expenses_backup;
ALTER TABLE expenses_backup DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 5: CRÉER VIEW expenses
-- Source de vérité = bank_transactions WHERE side='debit'
-- =====================================================

CREATE VIEW expenses AS
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
  bt.counterparty_name,
  bt.counterparty_iban,
  bt.side,
  bt.emitted_at,
  bt.settled_at,
  bt.category_pcg,
  bt.applied_rule_id,
  bt.matching_status,
  bt.raw_data
FROM bank_transactions bt
WHERE bt.side = 'debit';

-- =====================================================
-- PHASE 6: RECRÉER VIEW v_expenses_with_details
-- =====================================================

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
  (bt.raw_data->'attachments') IS NOT NULL
    AND jsonb_array_length(COALESCE(bt.raw_data->'attachments', '[]'::jsonb)) > 0 AS has_attachment,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label
FROM bank_transactions bt
LEFT JOIN organisations org ON bt.counterparty_organisation_id = org.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id
WHERE bt.side = 'debit';

-- =====================================================
-- PHASE 7: GRANTS
-- =====================================================

GRANT SELECT ON expenses TO authenticated;
GRANT SELECT ON v_expenses_with_details TO authenticated;
DROP POLICY IF EXISTS "Admin full access expenses" ON expenses_backup;

-- =====================================================
-- VALIDATION
-- =====================================================

DO $$
DECLARE
  v_bank_tx_count INTEGER;
  v_expenses_view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bank_tx_count FROM bank_transactions WHERE side = 'debit';
  SELECT COUNT(*) INTO v_expenses_view_count FROM expenses;

  IF v_bank_tx_count != v_expenses_view_count THEN
    RAISE EXCEPTION 'INCOHÉRENCE: bank_transactions debit (%) != expenses view (%)',
      v_bank_tx_count, v_expenses_view_count;
  END IF;

  RAISE NOTICE '✅ Migration réussie: % dépenses', v_bank_tx_count;
END;
$$;

-- =====================================================
-- ROLLBACK PLAN (en cas de problème)
-- =====================================================
-- DROP VIEW IF EXISTS expenses CASCADE;
-- DROP VIEW IF EXISTS v_expenses_with_details CASCADE;
-- ALTER TABLE expenses_backup RENAME TO expenses;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- (puis recréer les triggers si nécessaire)
-- =====================================================

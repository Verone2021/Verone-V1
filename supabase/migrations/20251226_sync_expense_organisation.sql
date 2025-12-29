-- =====================================================================
-- Migration: Sync Expense Organisation to Bank Transactions
-- Date: 2025-12-26
-- Description: Ajoute un trigger pour propager expenses.organisation_id
--              vers bank_transactions.counterparty_organisation_id
-- =====================================================================

-- =====================================================================
-- FUNCTION: Synchronise l'organisation de l'expense vers la transaction
-- =====================================================================

CREATE OR REPLACE FUNCTION sync_expense_organisation_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Propager l'organisation_id vers bank_transactions
  IF NEW.organisation_id IS DISTINCT FROM OLD.organisation_id THEN
    UPDATE bank_transactions
    SET counterparty_organisation_id = NEW.organisation_id
    WHERE id = NEW.transaction_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGER: Déclenché après UPDATE de organisation_id sur expenses
-- =====================================================================

DROP TRIGGER IF EXISTS trg_sync_expense_organisation ON expenses;

CREATE TRIGGER trg_sync_expense_organisation
AFTER UPDATE OF organisation_id ON expenses
FOR EACH ROW
WHEN (NEW.organisation_id IS DISTINCT FROM OLD.organisation_id)
EXECUTE FUNCTION sync_expense_organisation_to_transaction();

-- =====================================================================
-- TRIGGER: Déclenché après INSERT avec organisation_id non null
-- =====================================================================

DROP TRIGGER IF EXISTS trg_sync_expense_organisation_insert ON expenses;

CREATE TRIGGER trg_sync_expense_organisation_insert
AFTER INSERT ON expenses
FOR EACH ROW
WHEN (NEW.organisation_id IS NOT NULL AND NEW.transaction_id IS NOT NULL)
EXECUTE FUNCTION sync_expense_organisation_to_transaction();

-- =====================================================================
-- MIGRATION: Synchroniser les données existantes
-- =====================================================================

-- Propager les organisation_id existants vers bank_transactions
UPDATE bank_transactions bt
SET counterparty_organisation_id = e.organisation_id
FROM expenses e
WHERE e.transaction_id = bt.id
  AND e.organisation_id IS NOT NULL
  AND bt.counterparty_organisation_id IS DISTINCT FROM e.organisation_id;

-- =====================================================================
-- COMMENT
-- =====================================================================

COMMENT ON FUNCTION sync_expense_organisation_to_transaction() IS
  'Synchronise expenses.organisation_id vers bank_transactions.counterparty_organisation_id '
  'pour afficher le badge organisation dans la liste des transactions.';

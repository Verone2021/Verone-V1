-- Migration: Trigger de synchronisation bank_transactions → expenses
-- Date: 2025-12-30
-- Description: Synchronise category_pcg et counterparty_organisation_id vers expenses
--              quand bank_transactions est modifié

-- =====================================================
-- Fonction de synchronisation
-- =====================================================

CREATE OR REPLACE FUNCTION sync_bank_transaction_to_expense()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne rien faire si aucun changement pertinent
  IF NEW.category_pcg IS NOT DISTINCT FROM OLD.category_pcg AND
     NEW.counterparty_organisation_id IS NOT DISTINCT FROM OLD.counterparty_organisation_id THEN
    RETURN NEW;
  END IF;

  -- Synchroniser vers expenses
  UPDATE expenses
  SET
    category = NEW.category_pcg,
    organisation_id = NEW.counterparty_organisation_id,
    status = CASE
      WHEN NEW.category_pcg IS NOT NULL AND status = 'unclassified'
      THEN 'classified'
      ELSE status
    END,
    classified_at = CASE
      WHEN NEW.category_pcg IS NOT NULL AND classified_at IS NULL
      THEN NOW()
      ELSE classified_at
    END,
    updated_at = NOW()
  WHERE transaction_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger
-- =====================================================

DROP TRIGGER IF EXISTS trg_sync_bank_transaction_to_expense ON bank_transactions;

CREATE TRIGGER trg_sync_bank_transaction_to_expense
AFTER UPDATE OF category_pcg, counterparty_organisation_id ON bank_transactions
FOR EACH ROW
EXECUTE FUNCTION sync_bank_transaction_to_expense();

-- =====================================================
-- Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION sync_bank_transaction_to_expense() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_bank_transaction_to_expense() TO service_role;

-- =====================================================================
-- COMBINED MIGRATION: Finance Reset & Fiscal Year Lock
-- Date: 2025-12-28
-- Description: All migrations combined for easy application
-- Apply via: Dashboard SQL Editor or psql
-- =====================================================================

-- ===========================================
-- MIGRATION 001: Organisation Source Tracking
-- ===========================================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organisations_source_check'
  ) THEN
    ALTER TABLE organisations
    ADD CONSTRAINT organisations_source_check
    CHECK (source IN ('manual', 'transaction_linking', 'import'));
  END IF;
END $$;

UPDATE organisations SET source = 'transaction_linking'
WHERE id IN (
  SELECT DISTINCT organisation_id
  FROM matching_rules
  WHERE organisation_id IS NOT NULL
)
AND created_at >= '2025-12-20'
AND source = 'manual';

-- ===========================================
-- MIGRATION 002: Bank Transactions Ignore Fields
-- ===========================================

ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS ignored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ignored_by UUID,
ADD COLUMN IF NOT EXISTS ignore_reason TEXT;

UPDATE bank_transactions
SET ignored_at = updated_at
WHERE matching_status = 'ignored'
AND ignored_at IS NULL;

-- ===========================================
-- MIGRATION 003: Matching Rules Disable Tracking
-- ===========================================

ALTER TABLE matching_rules
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

UPDATE matching_rules
SET is_active = COALESCE(enabled, true)
WHERE is_active IS NULL OR is_active = true;

UPDATE matching_rules
SET is_active = enabled
WHERE enabled IS NOT NULL;

-- ===========================================
-- MIGRATION 004: Finance Settings Table
-- ===========================================

CREATE TABLE IF NOT EXISTS finance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closed_fiscal_year INT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

INSERT INTO finance_settings (closed_fiscal_year)
SELECT NULL
WHERE NOT EXISTS (SELECT 1 FROM finance_settings);

ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_settings_read" ON finance_settings;
CREATE POLICY "finance_settings_read" ON finance_settings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "finance_settings_update" ON finance_settings;
CREATE POLICY "finance_settings_update" ON finance_settings
FOR UPDATE USING (true);

-- ===========================================
-- MIGRATION 005: Organisation FK ON DELETE SET NULL
-- ===========================================

ALTER TABLE bank_transactions
DROP CONSTRAINT IF EXISTS bank_transactions_counterparty_organisation_id_fkey;

ALTER TABLE bank_transactions
ADD CONSTRAINT bank_transactions_counterparty_organisation_id_fkey
FOREIGN KEY (counterparty_organisation_id)
REFERENCES organisations(id)
ON DELETE SET NULL;

-- ===========================================
-- RPC 010: delete_organisation_safe
-- ===========================================

CREATE OR REPLACE FUNCTION delete_organisation_safe(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_source TEXT;
  v_legal_name TEXT;
  v_unlinked_count INT := 0;
  v_disabled_rules_count INT := 0;
  v_action TEXT;
BEGIN
  SELECT source, legal_name INTO v_source, v_legal_name
  FROM organisations
  WHERE id = p_org_id;

  IF v_source IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organisation not found'
    );
  END IF;

  UPDATE bank_transactions
  SET counterparty_organisation_id = NULL, updated_at = now()
  WHERE counterparty_organisation_id = p_org_id;
  GET DIAGNOSTICS v_unlinked_count = ROW_COUNT;

  UPDATE matching_rules
  SET is_active = false, disabled_at = now()
  WHERE organisation_id = p_org_id AND is_active = true;
  GET DIAGNOSTICS v_disabled_rules_count = ROW_COUNT;

  IF v_source = 'transaction_linking' THEN
    DELETE FROM organisations WHERE id = p_org_id;
    v_action := 'deleted';
  ELSE
    UPDATE organisations
    SET archived_at = now(), updated_at = now()
    WHERE id = p_org_id;
    v_action := 'archived';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action,
    'organisation_name', v_legal_name,
    'source', v_source,
    'unlinked_transactions_count', v_unlinked_count,
    'disabled_rules_count', v_disabled_rules_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_organisation_safe(UUID) TO authenticated;

-- ===========================================
-- RPC 011: reset_finance_auto_data
-- ===========================================

CREATE OR REPLACE FUNCTION reset_finance_auto_data(p_dry_run BOOLEAN DEFAULT true)
RETURNS JSONB AS $$
DECLARE
  v_auto_orgs UUID[];
  v_auto_org_names TEXT[];
  v_unlinked_count INT := 0;
  v_deleted_orgs_count INT := 0;
  v_disabled_rules_count INT := 0;
  v_transactions_to_unlink INT := 0;
  v_rules_to_disable INT := 0;
BEGIN
  SELECT
    array_agg(id),
    array_agg(legal_name)
  INTO v_auto_orgs, v_auto_org_names
  FROM organisations
  WHERE source = 'transaction_linking';

  SELECT COUNT(*) INTO v_transactions_to_unlink
  FROM bank_transactions
  WHERE counterparty_organisation_id = ANY(COALESCE(v_auto_orgs, ARRAY[]::UUID[]));

  SELECT COUNT(*) INTO v_rules_to_disable
  FROM matching_rules
  WHERE is_active = true;

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'dry_run', true,
      'preview', jsonb_build_object(
        'organisations_to_delete', COALESCE(array_length(v_auto_orgs, 1), 0),
        'organisation_names', COALESCE(v_auto_org_names, ARRAY[]::TEXT[]),
        'rules_to_disable', v_rules_to_disable,
        'transactions_to_unlink', v_transactions_to_unlink
      ),
      'message', 'This is a preview. Call with p_dry_run=false to apply changes.'
    );
  ELSE
    IF v_auto_orgs IS NOT NULL AND array_length(v_auto_orgs, 1) > 0 THEN
      UPDATE bank_transactions
      SET counterparty_organisation_id = NULL, updated_at = now()
      WHERE counterparty_organisation_id = ANY(v_auto_orgs);
      GET DIAGNOSTICS v_unlinked_count = ROW_COUNT;

      DELETE FROM organisations WHERE id = ANY(v_auto_orgs);
      GET DIAGNOSTICS v_deleted_orgs_count = ROW_COUNT;
    END IF;

    UPDATE matching_rules
    SET is_active = false, disabled_at = now()
    WHERE is_active = true;
    GET DIAGNOSTICS v_disabled_rules_count = ROW_COUNT;

    RETURN jsonb_build_object(
      'dry_run', false,
      'success', true,
      'result', jsonb_build_object(
        'deleted_organisations', v_deleted_orgs_count,
        'disabled_rules', v_disabled_rules_count,
        'unlinked_transactions', v_unlinked_count
      ),
      'message', 'Finance auto-data has been reset successfully.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_finance_auto_data(BOOLEAN) TO authenticated;

-- ===========================================
-- RPC 012: Fiscal Year Lock Functions
-- ===========================================

CREATE OR REPLACE FUNCTION is_transaction_locked(p_tx_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_closed_year INT;
BEGIN
  SELECT closed_fiscal_year INTO v_closed_year
  FROM finance_settings
  LIMIT 1;

  IF v_closed_year IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXTRACT(YEAR FROM p_tx_date)::INT <= v_closed_year;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_transaction_locked_by_id(p_transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tx_date DATE;
BEGIN
  SELECT COALESCE(settled_at, emitted_at)::DATE INTO v_tx_date
  FROM bank_transactions
  WHERE id = p_transaction_id;

  IF v_tx_date IS NULL THEN
    RETURN false;
  END IF;

  RETURN is_transaction_locked(v_tx_date);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_transaction_not_locked(p_transaction_id UUID)
RETURNS VOID AS $$
DECLARE
  v_tx_date DATE;
  v_tx_year INT;
  v_closed_year INT;
BEGIN
  SELECT COALESCE(settled_at, emitted_at)::DATE INTO v_tx_date
  FROM bank_transactions
  WHERE id = p_transaction_id;

  IF v_tx_date IS NULL THEN
    RETURN;
  END IF;

  v_tx_year := EXTRACT(YEAR FROM v_tx_date)::INT;

  SELECT closed_fiscal_year INTO v_closed_year
  FROM finance_settings
  LIMIT 1;

  IF v_closed_year IS NOT NULL AND v_tx_year <= v_closed_year THEN
    RAISE EXCEPTION 'Annee cloturee: modifications interdites pour les transactions de % (annee fiscale % cloturee)',
      v_tx_year, v_closed_year;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_closed_fiscal_year(p_year INT)
RETURNS JSONB AS $$
DECLARE
  v_current_year INT;
  v_affected_count INT;
BEGIN
  IF p_year IS NOT NULL AND (p_year < 2020 OR p_year > EXTRACT(YEAR FROM CURRENT_DATE)::INT) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid year: %s. Must be between 2020 and current year.', p_year)
    );
  END IF;

  SELECT closed_fiscal_year INTO v_current_year FROM finance_settings LIMIT 1;

  UPDATE finance_settings
  SET closed_fiscal_year = p_year;

  IF p_year IS NOT NULL THEN
    SELECT COUNT(*) INTO v_affected_count
    FROM bank_transactions
    WHERE EXTRACT(YEAR FROM COALESCE(settled_at, emitted_at))::INT <= p_year;
  ELSE
    v_affected_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_closed_year', v_current_year,
    'new_closed_year', p_year,
    'locked_transactions_count', v_affected_count,
    'message', CASE
      WHEN p_year IS NULL THEN 'All fiscal years are now unlocked.'
      ELSE format('Fiscal year %s and earlier are now locked.', p_year)
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_finance_settings()
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_locked_count INT;
  v_unlocked_count INT;
BEGIN
  SELECT * INTO v_settings FROM finance_settings LIMIT 1;

  IF v_settings.closed_fiscal_year IS NOT NULL THEN
    SELECT COUNT(*) INTO v_locked_count
    FROM bank_transactions
    WHERE EXTRACT(YEAR FROM COALESCE(settled_at, emitted_at))::INT <= v_settings.closed_fiscal_year;

    SELECT COUNT(*) INTO v_unlocked_count
    FROM bank_transactions
    WHERE EXTRACT(YEAR FROM COALESCE(settled_at, emitted_at))::INT > v_settings.closed_fiscal_year;
  ELSE
    v_locked_count := 0;
    SELECT COUNT(*) INTO v_unlocked_count FROM bank_transactions;
  END IF;

  RETURN jsonb_build_object(
    'closed_fiscal_year', v_settings.closed_fiscal_year,
    'updated_at', v_settings.updated_at,
    'locked_transactions_count', v_locked_count,
    'unlocked_transactions_count', v_unlocked_count
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_transaction_locked(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION is_transaction_locked_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_transaction_not_locked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_closed_fiscal_year(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_finance_settings() TO authenticated;

-- ===========================================
-- RPC 013: toggle_ignore_transaction
-- ===========================================

CREATE OR REPLACE FUNCTION toggle_ignore_transaction(
  p_tx_id UUID,
  p_ignore BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_status TEXT;
  v_tx_label TEXT;
BEGIN
  PERFORM check_transaction_not_locked(p_tx_id);

  SELECT matching_status, label INTO v_current_status, v_tx_label
  FROM bank_transactions
  WHERE id = p_tx_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  END IF;

  IF p_ignore THEN
    UPDATE bank_transactions
    SET
      matching_status = 'ignored',
      ignored_at = now(),
      ignored_by = auth.uid(),
      ignore_reason = COALESCE(p_reason, 'Ignore manuellement'),
      updated_at = now()
    WHERE id = p_tx_id;

    RETURN jsonb_build_object(
      'success', true,
      'ignored', true,
      'transaction_label', v_tx_label,
      'message', 'Transaction ignoree'
    );
  ELSE
    UPDATE bank_transactions
    SET
      matching_status = 'unmatched',
      ignored_at = NULL,
      ignored_by = NULL,
      ignore_reason = NULL,
      updated_at = now()
    WHERE id = p_tx_id;

    RETURN jsonb_build_object(
      'success', true,
      'ignored', false,
      'transaction_label', v_tx_label,
      'previous_status', v_current_status,
      'message', 'Transaction restauree'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION toggle_ignore_transaction(UUID, BOOLEAN, TEXT) TO authenticated;

-- ===========================================
-- TRIGGER: Enforce Fiscal Year Lock on Direct Updates
-- ===========================================

-- Trigger function to enforce fiscal year lock on bank_transactions updates
CREATE OR REPLACE FUNCTION enforce_fiscal_year_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_date DATE;
  v_closed_year INT;
BEGIN
  -- Get transaction date
  v_tx_date := COALESCE(NEW.settled_at, NEW.emitted_at)::DATE;

  IF v_tx_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get closed fiscal year
  SELECT closed_fiscal_year INTO v_closed_year FROM finance_settings LIMIT 1;

  -- If no closed year, allow all changes
  IF v_closed_year IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if transaction year is locked
  IF EXTRACT(YEAR FROM v_tx_date)::INT <= v_closed_year THEN
    -- Only block changes to enrichment fields
    IF OLD.matching_status IS DISTINCT FROM NEW.matching_status OR
       OLD.category_pcg IS DISTINCT FROM NEW.category_pcg OR
       OLD.counterparty_organisation_id IS DISTINCT FROM NEW.counterparty_organisation_id OR
       OLD.has_attachment IS DISTINCT FROM NEW.has_attachment OR
       OLD.attachment_ids IS DISTINCT FROM NEW.attachment_ids OR
       OLD.ignored_at IS DISTINCT FROM NEW.ignored_at THEN
      RAISE EXCEPTION 'Annee cloturee: modifications interdites pour les transactions de % (annee fiscale % cloturee)',
        EXTRACT(YEAR FROM v_tx_date)::INT, v_closed_year;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS enforce_fiscal_lock_on_bank_transactions ON bank_transactions;
CREATE TRIGGER enforce_fiscal_lock_on_bank_transactions
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_fiscal_year_lock();

-- ===========================================
-- END OF COMBINED MIGRATION
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'All finance reset migrations applied successfully!';
  RAISE NOTICE 'Fiscal year lock trigger installed on bank_transactions';
END $$;
